import { Router } from 'express'
import authController from '../controller/auth.controller.js'
import authMiddleware from '../middleware/auth.middleware.js';
const authRouter = Router();


/*
* @route POST api/auth/register
* @description Register a new user
* @access Public
*/
authRouter.post("/register",authController.handleRegisterUser)

/*
* @route POST api/auth/login
* @description login existing user
* @access Public
*/
authRouter.post("/login",authController.handleLoginUser)

/*
* @route get api/auth/logout
* @description clear token from user cookie and add the token in blacklist
* @access Public
*/
authRouter.get("/logout",authController.handlelogoutUser)

/*
* @route get api/auth/get-me
* @description check which profile is logged in 
* @access private
*/

authRouter.get("/get-me",authMiddleware.authUser,authController.handlegetMeUser)

export default authRouter;