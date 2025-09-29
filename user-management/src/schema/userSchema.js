import mongoose, { mongo } from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username:{type:String,reuqired:true},
        email:{type:String,required:true,unique:true},
        password:{type:String,required:true},
     }
)
const User = mongoose.model('User',userSchema)
const TempUser = mongoose.model('TempUser',userSchema)

export  {User,TempUser}