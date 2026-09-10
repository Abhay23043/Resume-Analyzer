import userModel from "../models/user.models.js"
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import tokenblacklistModel from "../models/blacklist.models.js"

import dotenv from 'dotenv'
dotenv.config()
/*
* @name register user controller
* @description register a new user, expects - username,email,password from the request body 
* @accesss public
*/
async function handleRegisterUser(req,res){

    // req.body se username email password ko extract krenge 
    const { username,email,password } = req.body;

    // check krenge kii username or email or password teeno user de rha h ki nhi 
    if(!username || !email || !password){
        return res.status(400).json({
             message:"Please provide Usename, Email and Password" 
            })
    }

    //checking is user(username and email) already exists in a database or not 
    const userAlreadyExists = await userModel.findOne({
        $or: [{ username },{ email }]
    })
    if(userAlreadyExists){
        return res.status(400).json({ message:"User Already Exists,Please try Login " })
    }

    // now hasing the password
    const hashPassword = await bcrypt.hash(password,10)
    // now storing the user data into database
    const user = await userModel.create({
        username,
        email,
        password: hashPassword
    })

    //now creating jsonwebtoken for register
    const token = jwt.sign(
        {id:user._id, username : user.username}, //Payload
        process.env.JWT_SECRET, //secret key
        {expiresIn: "1d"} //options
    ) 
    //token is passed through a cookie
    res.cookie("token", token)

    res.status(201).json({
        message:"User Registerd Successfully",
        user:{
            id:user._id,
            username:user.username,
            email:user.email
        }
    })

}

/*
* @name login user controller
* @description Login an existing user; expects email and password from the request body.
* @accesss public
*/
async function  handleLoginUser(req,res){
    // req.body se email password ko extract krenge 
    const { email,password } = req.body;

    //database me check krenge ki email exist krta hai ki nhi
    const user = await userModel.findOne({ email })
    if(!user){
        return res.status(400).json({
            message:"User Does not Exists, Please try register"
        })
    }  
    //password compare karenge user ki aur database se
    const isPasswordValid = await bcrypt.compare(password,user.password)

    if(!isPasswordValid){
        return res.status(400).json({
            message: "Invalid Email or Password"
        })
    }

    //now creating jsonwebtoken for login 
    const token = jwt.sign(
        {id:user._id, username : user.username}, //Payload
        process.env.JWT_SECRET, //secret key
        {expiresIn: "1d"} //options
    ) 

    res.cookie("token",token)
    //respond success login
    res.status(200).json({
        message:"User Login Successfully",
        user:{
            id:user._id,
            username:user.username,
            email:user.email
        }
    })
}

/*
* @name logout user controller
* @description clear token from user cookie and add the token in blacklist
* @accesss public
*/

async function handlelogoutUser(req,res){
    const token = req.cookies?.token

    if(token){
        try {
            await tokenblacklistModel.create({ token })
        } catch (error) {
            console.error("Token blacklist failed:", error.message)
        }
    }

    res.clearCookie("token")

    res.status(200).json({
        message: "User Logout Successfully"
    })
}

/*
* @name getme user controller
* @description get the current login user details
* @accesss private
*/
async function handlegetMeUser(req,res){
    const user = await userModel.findById(req.user.id)

    res.status(200).json({
        message:"User details fetched Successfully",
        user:{
            id: user._id,
            username: user.username,
            email:user.email
        }
    })
}

export default {
    handleRegisterUser,
    handleLoginUser,
    handlelogoutUser,
    handlegetMeUser
}