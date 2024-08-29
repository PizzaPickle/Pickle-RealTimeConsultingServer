import amqp from 'amqplib/callback_api';
import dotenv from 'dotenv';

dotenv.config();

function setupMQ() {
  const rabbitmqUser = process.env.RABBITMQ_USER;
  const rabbitmqPassword = process.env.RABBITMQ_PASSWORD;
  const rabbitmqHost = process.env.RABBITMQ_HOST;

  amqp.connect(`amqp://${rabbitmqUser}:${rabbitmqPassword}@${rabbitmqHost}`, function (error0, connection) {
    if (error0) {
      throw error0;
    }
    console.log('실행 테스트 완료');
    connection.createChannel(function (error1, channel) {
      if (error1) {
        throw error1;
      }
    });
  });
}
export default setupMQ;
