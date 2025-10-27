import express from 'express';
import dotenv from 'dotenv';
import connectdb from './db/db-connection.js'
import userRouter from './router/userRouter.js'
import inviteRouter from './router/inviteRouter.js'
import {redisConnection} from './utilitis/redis.js';
import {initRabbitMQ} from './rabbitmq/setup.js'
import swaggerUi from 'swagger-ui-express'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
dotenv.config();
const app = express();


const PORT = process.env.PORT 

app.use(express.json())
// Allow everything CORS
app.use(cors())
// Accept CORS preflight for all routes
// Swagger UI serving openapi.yaml from repo root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const OPENAPI_PATH = path.join(ROOT_DIR, 'openapi.yaml');

app.get('/openapi.yaml', (req, res) => {
    res.sendFile(OPENAPI_PATH);
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(undefined, { swaggerUrl: '/openapi.yaml' }));

// test
app.get('/', (req, res) => { 
    res.send('User Management Service is running');
});


// this router will handle authentication
app.use("/api/user",userRouter)

// this is the router which handles invites
app.use("/api",inviteRouter)

// redis connection for otp
redisConnection()

// rabbitMQ as messaging queue between microservices
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    await initRabbitMQ();
    connectdb()
      .then(() => {
        app.listen(PORT, () => {
          console.log(`User Management Service is listening on port http://localhost:${PORT}`);
        });
      })
      .catch((err) => {
        console.log("Error connecting to server/database");
      });
  })();
}

export default app;

