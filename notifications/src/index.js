import express from 'express'
import dotenv from 'dotenv'
import {initRabbitMQ} from './rabbitmq/setup.js'
import { consumeQueue } from './rabbitmq/consumer.js'
dotenv.config()

const app = express()

const start = async ()=>{
    const PORT = process.env.PORT

    await initRabbitMQ();
    consumeQueue();


    app.listen(PORT, ()=>{
    console.log(`Listening to port ${PORT}`)
})
}

start();