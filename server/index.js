import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  initializeApp({
    credential: applicationDefault(),
    projectId: process.env.GOOGLE_CLOUD_PROJECT || 'project-62fbc25e-51d7-4b11-93b',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'skill-swap-bucket'
  });
  console.log('Firebase Admin Initialized successfully with your JSON credentials!');
} catch (error) {
  console.error('Firebase initialization error:', error.message);
}

export const db = getFirestore(); // Uses the (default) database unless configured otherwise

export const bucket = getStorage().bucket();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Socket.io for WebRTC signaling and Real-time Chat
export const io = new SocketIO(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

io.on('connection', (socket) => {
  // Join a room for WebRTC signaling (per-conversation)
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
  });

  // Join a personal room for platform-wide notifications and chat alerts
  socket.on('join-chat', (username) => {
    if (username) {
      socket.join(`chat_${username}`);
      console.log(`User ${username} joined their personal notification room`);
    }
  });

  // Signaling logic
  socket.on('offer', ({ roomId, offer }) => {
    socket.to(roomId).emit('offer', { offer, from: socket.id });
  });
  socket.on('answer', ({ roomId, answer }) => {
    socket.to(roomId).emit('answer', { answer });
  });
  socket.on('ice-candidate', ({ roomId, candidate }) => {
    socket.to(roomId).emit('ice-candidate', { candidate });
  });

  // Initial call request must go to the receiver's personal room
  socket.on('call-request', ({ receiver, callerName, type, roomId }) => {
    if (receiver) {
      socket.to(`chat_${receiver}`).emit('call-request', { callerName, type, roomId });
    }
  });

  socket.on('call-ended', ({ roomId }) => {
    socket.to(roomId).emit('call-ended');
  });

  // Generic notification (for connection requests, etc)
  socket.on('notify', ({ receiver, data }) => {
    if (receiver) {
      socket.to(`chat_${receiver}`).emit('notification', data);
    }
  });
});



app.use(cors());
app.use(express.json());
app.set('io', io);

import apiRoutes from './routes/api.js';
app.use('/api', apiRoutes);


if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running. In development, the frontend is served by Vite.');
  });
}

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
