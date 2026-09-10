import mongoose from 'mongoose'

async function connectDb(){
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("mongodb connected Sucessfully")
    }
    catch(e){
        console.log(e.error);
    }
}

export default connectDb