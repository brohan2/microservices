import { createClient } from "redis";

const redis = createClient({
  socket: {
    host: "127.0.0.1", // or 'localhost'
    port: 6379,
  },
});
const redisConnection = async ()=>{
  try {
        redis.on("error", (err) => console.error("Redis Client Error", err));
        await redis.connect();
        console.log("Redis connected")
      } catch (e) {
        console.log(`${e} redis error`);
      }

}
export {redisConnection,redis}