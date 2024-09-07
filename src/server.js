import express from 'express';
import http from 'http';
import socketHandler from './socket_handler.js';
import setupMQ from './mq_handler.js';
import { Server } from 'socket.io';
import ENV from './config.js';
import setupRoutes from './routes/index.js';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'pug');
app.set('views', join(__dirname, 'views'));
app.use('/public', express.static(join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ENV.REACT_APP_ORIGIN,
    methods: ['GET', 'POST'],
  },
});
setupRoutes(app);
setupMQ();
socketHandler(io);

server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
