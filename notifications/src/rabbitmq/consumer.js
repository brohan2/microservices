import amqp from "amqplib"
import dotenv from "dotenv"
import {sendEmail} from "../mail/notification_mail.js";
dotenv.config()
import { getChannel, getQueueName } from "../rabbitmq/setup.js";

export const consumeQueue = async () => {
  const channel = getChannel();
  const queue = getQueueName();

  console.log(`Waiting for messages in ${queue}`);

  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      const data = JSON.parse(msg.content.toString());
      console.log("Received message:", data);

      try {
        await sendEmail(data.to, data.content);
        channel.ack(msg);
        console.log("Email sent and message acknowledged");
      } catch (err) {
        console.error("Email send failed:", err.message);
        channel.nack(msg, false, true); // Retry
      }
    }
  });
};

