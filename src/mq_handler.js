import amqp from 'amqplib/callback_api.js';
import ENV from './config.js';
import { saveConsultingRoomInfo } from './redis_client.js';
import { QUEUE_NAMES } from './constants.js';

function setupMQ() {
    amqp.connect(
        `amqp://${ENV.RABBITMQ_USER}:${ENV.RABBITMQ_PASSWORD}@${ENV.RABBITMQ_HOST}:${ENV.RABBITMQ_PORT}`,
        (error0, connection) => {
            if (error0) {
                console.error('RabbitMQ 연결 실패:', error0);
                return; // 연결 실패 시 함수 종료
            }
            console.log(`rabbitMQ(${ENV.RABBITMQ_HOST})에 연결 완료`);

            connection.createChannel((error1, channel) => {
                if (error1) {
                    console.error('채널 생성 실패:', error1);
                    connection.close(); // 에러 발생 시 연결 닫기
                    return;
                }

                const queues = [QUEUE_NAMES.CONSULTING_ROOM_CREATION];

                queues.forEach((queue) => {
                    channel.assertQueue(queue, { durable: true });
                    console.log(
                        `[*] Queue(${queue})에서 메시지를 기다리고 있습니다. 종료하려면 CTRL+C를 누르세요.`
                    );

                    channel.consume(
                        queue,
                        async (message) => {
                            if (message != null) {
                                try {
                                    const messageContent = JSON.parse(
                                        message.content.toString()
                                    );
                                    console.log(
                                        ` [x] Received at Queue(${queue})`
                                    );
                                    console.log(messageContent);

                                    if (
                                        queue ===
                                        QUEUE_NAMES.CONSULTING_ROOM_CREATION
                                    ) {
                                        const { roomId } = messageContent;
                                        await saveConsultingRoomInfo({
                                            roomId,
                                            roomInfo: messageContent,
                                        });
                                        channel.ack(message); // 메시지 확인
                                    }
                                } catch (error) {
                                    console.error(
                                        '메시지 처리 중 오류 발생: ',
                                        error
                                    );
                                    channel.nack(message, false, false); // 메시지 재처리 방지
                                }
                            }
                        },
                        { noAck: false }
                    );
                });
            });

            // 프로세스 종료 시 연결 닫기
            process.on('SIGINT', () => {
                connection.close();
                console.log('RabbitMQ 연결 종료');
                process.exit(0);
            });
        }
    );
}

export default setupMQ;
