import mongoose from 'mongoose'

const connectdb = async ()=>{
    try{
        const uri = process.env.MONGODB_URI
        const connection = await mongoose.connect(uri);
        console.log("db connected")
        return connection
    }catch(err){
        console.log("Error connecting to database")
    }
}
export default connectdb