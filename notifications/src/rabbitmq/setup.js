import amqp from 'amqplib';

let connection;
let channel;

const QUEUE_NAME = 'notification_queue';

export const initRabbitMQ = async () => {
  connection = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  console.log('RabbitMQ connection ready');
};

export const getChannel = () => {
  if (!channel) throw new Error('RabbitMQ channel not initialized');
  return channel;
};

export const getQueueName = () => QUEUE_NAME;