import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase using Application Default Credentials
// It will automatically use the credentials from the gcloud login you just performed!
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

// Export db and bucket for routes to use
// Using the named database you created in the Google Cloud Console!
export const db = getFirestore('skill-swap-db');
export const bucket = getStorage().bucket();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
import apiRoutes from './routes/api.js';
app.use('/api', apiRoutes);

// Serve static files from the React app in production
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

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
