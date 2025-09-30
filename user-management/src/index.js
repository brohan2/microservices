import express from 'express';
import dotenv from 'dotenv';
import connectdb from './db/db-connection.js'
import userRouter from './router/userRouter.js'


dotenv.config();
const app = express();


const PORT = process.env.PORT 

app.use(express.json())

app.get('/', (req, res) => { 
    res.send('User Management Service is running');
});

app.use("/api/user",userRouter)
app.use("/api/invite",inviteRouter)

connectdb()
    .then(()=>{
        app.listen(PORT, () => {  
    console.log(`User Management Service is listening on port ${PORT}`);
});
    })
    .catch((err)=>{
        console.log("Error connecting to server/database")
    })