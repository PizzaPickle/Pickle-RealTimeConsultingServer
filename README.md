# Pickle-RealTimeConsultingServer
PizzaPickle - 고객과 PB를 연결시켜주는 화상상담서버

###  기술 스택
#### 프론트엔드
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![Pug](https://img.shields.io/badge/pug-E3C29B.svg?style=for-the-badge&logo=pug&logoColor=black)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)

#### 백엔드
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DC382D.svg?style=for-the-badge&logo=redis&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/rabbitmq-%23FF6600.svg?style=for-the-badge&logo=rabbitmq&logoColor=white)

#### 실시간 통신
![WebRTC](https://img.shields.io/badge/WebRTC-%23F37C20.svg?style=for-the-badge&logo=webrtc&logoColor=white)
![Socket.IO](https://img.shields.io/badge/socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)


### 핵심 기능
- 화면 공유
- 비디오 공유
- 소리 공유
- 비디오 및 마이크 On/Off
- 비디오 및 마이크 연결 기기 선택 
- 채팅

### 주요 기능 설명 및 화면
<table>
  <tr>
    <td>
      <strong>룸 정보 리슨 & 저장</strong><br>
      rabbitMQ의 특정 큐를 리슨하며, 해당 큐로 전달된 룸관련 정보를 Redis에 저장함
    </td>
    <td>
      <img src="./docs/rabbitMQ_save.png" alt="rabbitMQ" width="400"/><br>
      <img src="./docs/save_at_redis.png" alt="save_at_redis" width="400"/>
    </td>
  </tr>
  <tr>
    <td>
      <strong>룸 정보 조회</strong><br>
      api를 통해 redis에 저장된 룸관련 정보를 조회하여 룸 정보를 대기룸에 보여줌<br>
      배포된 상태에서는, 주기적으로 상담 시작 시간으로부터 1시간이 지난 룸 정보는 지우는 함수를 실행함
    </td>
    <td>
      <img src="./docs/show_rooms.png" alt="show_rooms" width="400"/><br>
      <img src="./docs/get_rooms.png" alt="get_rooms" width="400"/>
    </td>
  </tr>
  <tr>
    <td><strong>비디오 공유</strong></td>
    <td><img src="./docs/video_share.png" alt="video_share" width="500"/></td>
  </tr>
  <tr>
    <td><strong>화면 공유</strong></td>
    <td><img src="./docs/screen_share.png" alt="screen_share" width="500"/></td>
  </tr>
  <tr>
    <td><strong>채팅</strong></td>
    <td><img src="./docs/chat.png" alt="chat" height="500"/></td>
  </tr>
</table>
