import { getChannel, getQueueName } from "./setup.js";


export const sendToQueue = async (message) => {
  const channel = getChannel();
  const queue = getQueueName();

  const success = channel.sendToQueue(
    queue,
    Buffer.from(JSON.stringify(message)),
    { persistent: true }
  );

  if (success) {
    console.log('Message published:', message);
  } else {
    console.error('Failed to publish message');
  }
};