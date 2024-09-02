import express from 'express';
import http from 'http';
import socketHandler from './socket_handler';
import setupMQ from './mq_handler';

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use('/public', express.static(__dirname + '/public'));
app.get('/', (req, res) => res.render('home'));

const server = http.createServer(app);
setupMQ();
socketHandler(server);

server.listen(3000, () => {
	console.log('Server is listening on port 3000');
});
