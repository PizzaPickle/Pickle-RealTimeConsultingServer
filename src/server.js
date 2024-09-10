import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

import socketHandler from './socket_handler.js';
import setupMQ from './mq_handler.js';
import setupRoutes from './routes/index.js';
import consultingRoutes from './routes/consultingRoutes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Logging middleware
app.use(morgan('dev'));

// Static files middleware (placed before other middlewares)
app.use(express.static(join(__dirname, 'public')));

// MIME type checking middleware
app.use((req, res, next) => {
    if (req.url.endsWith('.js')) {
        res.type('application/javascript');
    }
    next();
});

// Security middleware
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    'https://cdn.socket.io',
                    "'unsafe-inline'",
                ], // 추가
                connectSrc: ["'self'", 'wss:'],
                styleSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
                fontSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
            },
        },
    })
);

// Parse JSON bodies
app.use(bodyParser.json());
// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// CORS middleware
app.use(
    cors({
        origin: process.env.CORS_ORIGIN || 'https://pickle.my',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));
// Routes
// setupRoutes(app);

app.use('/consulting-room/', consultingRoutes);

// 404 handler
app.use((req, res, next) => {
    res.status(404).render('404', { message: 'Page not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).render('error', {
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {},
    });
});

// Server setup
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'https://pickle.my',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Socket.io setup
socketHandler(io);

// Message queue setup
setupMQ();
console.log('Current directory:', __dirname);
// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
