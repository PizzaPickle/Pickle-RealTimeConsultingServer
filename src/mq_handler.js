import amqp from 'amqplib/callback_api';
import dotenv from 'dotenv';
import { saveConsultingRoomInfo } from './redis_client';
import { QUEUE_NAMES } from './constants';

dotenv.config();

function setupMQ() {
  const rabbitmqUser = process.env.RABBITMQ_USER;
  const rabbitmqPassword = process.env.RABBITMQ_PASSWORD;
  const rabbitmqHost = process.env.RABBITMQ_HOST;

  amqp.connect(`amqp://${rabbitmqUser}:${rabbitmqPassword}@${rabbitmqHost}`, (error0, connection) => {
    if (error0) {
      throw error0;
    }
    console.log(`rabbitMQ(${rabbitmqHost})에 연결 완료`);
    connection.createChannel((error1, channel) => {
      if (error1) {
        throw error1;
      }

      const queues = [QUEUE_NAMES.CONSULTING_ROOM_CREATION];

      queues.forEach((queue) => {
        // channel.deleteQueue(queue);
        channel.assertQueue(queue, {
          durable: true,
        });

        console.log(`[*] Queue(${queue})에서 메시지를 기다리고 있습니다. 종료하려면 CTRL+C를 누르세요.`);

        channel.consume(
          queue,
          async (message) => {
            if (message != null) {
              try {
                console.log('Received message: ', message.content.toString());
                const messageContent = eval(`(${message.content.toString()})`);
                console.log(` [x] Received at Queue(${queue})`);
                console.log(messageContent);

                if (queue === QUEUE_NAMES.CONSULTING_ROOM_CREATION) {
                  const { roomId } = messageContent;
                  await saveConsultingRoomInfo({ roomId, roomInfo: messageContent });
                }

                channel.ack(message);
              } catch (error) {
                console.error('메시지 처리 중 오류 발생: ', error);
              }
            }
          },
          { noAck: false }
        );
      });
    });
  });
}

export default setupMQ;
