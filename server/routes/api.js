import express from 'express';
import multer from 'multer';
import bcrypt from 'bcrypt';
import { db, bucket } from '../index.js';

const router = express.Router();

// Multer configuration for memory storage (we will buffer the file and upload to Firebase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// ==========================================
// HEALTH CHECK
// ==========================================
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SkillSwap API is up and running with Firebase Integration!' });
});

// ==========================================
// AUTHENTICATION
// ==========================================

// Sign Up Route
router.post('/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if user exists
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    
    if (!snapshot.empty) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Save to Firestore
    const newUser = {
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await usersRef.add(newUser);

    res.json({ success: true, message: 'User registered successfully', user: { id: docRef.id, username, email } });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Login Route
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const usersRef = db.collection('users');
    // We allow login with either username or email for flexibility
    let snapshot = await usersRef.where('username', '==', username).get();
    
    if (snapshot.empty) {
      snapshot = await usersRef.where('email', '==', username).get();
    }

    if (snapshot.empty) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    const isMatch = await bcrypt.compare(password, userData.password);

    if (isMatch) {
      res.json({ 
        success: true, 
        message: 'Logged in successfully', 
        user: { id: userDoc.id, username: userData.username, email: userData.email } 
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// ==========================================
// FILE REPOSITORY
// ==========================================

// Get all files metadata
router.get('/files', async (req, res) => {
  try {
    const filesRef = db.collection('files');
    const snapshot = await filesRef.orderBy('uploadedAt', 'desc').get();
    
    const filesList = [];
    snapshot.forEach(doc => {
      filesList.push({ id: doc.id, ...doc.data() });
    });

    res.json(filesList);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Upload a new file
router.post('/files/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}_${req.file.originalname}`;
    const fileUpload = bucket.file(uniqueFilename);

    // Create a write stream to upload the file to Firebase Storage
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    stream.on('error', (err) => {
      console.error('Upload error:', err);
      res.status(500).json({ message: 'Error uploading file to storage' });
    });

    stream.on('finish', async () => {
      // Once uploaded, save metadata to Firestore
      const fileMetadata = {
        name: req.file.originalname,
        storageName: uniqueFilename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date().toISOString()
      };

      const docRef = await db.collection('files').add(fileMetadata);
      
      res.json({
        message: 'File uploaded successfully',
        file: { id: docRef.id, ...fileMetadata }
      });
    });

    // End the stream with the buffer
    stream.end(req.file.buffer);

  } catch (error) {
    console.error('Upload Route Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Generate a Signed URL for downloading
router.get('/files/download/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const doc = await db.collection('files').doc(fileId).get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'File not found' });
    }

    const fileData = doc.data();
    const storageFile = bucket.file(fileData.storageName);

    // Check if file exists in storage
    const [exists] = await storageFile.exists();
    if (!exists) {
      return res.status(404).json({ message: 'File not found in storage bucket' });
    }

    // Generate a signed URL valid for 2 hours
    const [url] = await storageFile.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
      responseDisposition: `attachment; filename="${fileData.name}"` // Force download behavior
    });

    res.json({ url });
  } catch (error) {
    console.error('Download Route Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ==========================================
// SEARCH & USERS
// ==========================================

// Get all users for the search page
router.get('/users', async (req, res) => {
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    
    const usersList = [];
    snapshot.forEach(doc => {
      usersList.push({ id: doc.id, ...doc.data() });
    });

    res.json(usersList);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Seed mock users into the database (one-time use to populate the grid)
router.post('/users/seed', async (req, res) => {
  try {
    const mockUsers = [
      { username: 'Dr. Rivera', email: 'rivera@mock.com', category: 'Medical', offers: 'Medical First Aid', needs: 'Web Development', password: 'mock' },
      { username: 'Alex Smith', email: 'alex@mock.com', category: 'Maths', offers: 'Advanced Calculus', needs: 'Figma Prototyping', password: 'mock' },
      { username: 'Mia Lin', email: 'mia@mock.com', category: 'Arts', offers: 'Digital Illustration', needs: 'React Basics', password: 'mock' },
      { username: 'Marcus', email: 'marcus@mock.com', category: 'Maths', offers: 'Data Science', needs: 'System Architecture', password: 'mock' },
      { username: 'Sarah', email: 'sarah@mock.com', category: 'Arts', offers: 'UI/UX Design', needs: 'Advanced CSS', password: 'mock' }
    ];

    const batch = db.batch();
    const usersRef = db.collection('users');

    mockUsers.forEach(user => {
      const docRef = usersRef.doc(); // Auto-generate ID
      batch.set(docRef, { ...user, createdAt: new Date().toISOString() });
    });

    await batch.commit();
    res.json({ success: true, message: 'Database successfully seeded with users!' });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ==========================================
// CONNECTIONS
// ==========================================

// Send a connection request
router.post('/connections/request', async (req, res) => {
  try {
    const { sender, receiver } = req.body;
    if (!sender || !receiver) return res.status(400).json({ message: 'Sender and receiver required' });

    const connRef = db.collection('connections');
    await connRef.add({
      sender,
      receiver,
      status: 'pending',
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Connection request sent' });
  } catch (error) {
    console.error('Connection Request Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get connection requests for a user
router.get('/connections/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const connRef = db.collection('connections');
    
    // Get requests sent TO this user
    const snapshot = await connRef.where('receiver', '==', username).where('status', '==', 'pending').get();
    
    const requests = [];
    snapshot.forEach(doc => requests.push({ id: doc.id, ...doc.data() }));

    res.json(requests);
  } catch (error) {
    console.error('Fetch Connections Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get accepted connections for a user (to show Chat button on Search page)
router.get('/connections/accepted/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const connRef = db.collection('connections');

    // Get connections where the user is sender OR receiver and status is accepted
    const asSender = await connRef.where('sender', '==', username).where('status', '==', 'accepted').get();
    const asReceiver = await connRef.where('receiver', '==', username).where('status', '==', 'accepted').get();

    const connected = new Set();
    asSender.forEach(doc => connected.add(doc.data().receiver));
    asReceiver.forEach(doc => connected.add(doc.data().sender));

    res.json([...connected]);
  } catch (error) {
    console.error('Fetch Accepted Connections Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Accept connection request
router.post('/connections/accept/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('connections').doc(id).update({ status: 'accepted' });
    res.json({ success: true, message: 'Request accepted' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Reject connection request
router.post('/connections/reject/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('connections').doc(id).update({ status: 'rejected' });
    res.json({ success: true, message: 'Request rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ==========================================
// CHAT MESSAGING
// ==========================================

// Helper: create a deterministic conversation ID for two users
const getConvId = (a, b) => [a, b].sort().join('__');

// Send a message — stores conversationId for index-free querying
router.post('/chat/send', async (req, res) => {
  try {
    const { sender, receiver, text } = req.body;
    if (!sender || !receiver || !text) return res.status(400).json({ message: 'Missing fields' });

    const convId = getConvId(sender, receiver);
    const timestamp = Date.now();

    const newMsg = { sender, receiver, text, timestamp, conversationId: convId };
    const docRef = await db.collection('messages').add(newMsg);

    // Upsert conversation metadata + increment unread count for receiver
    const convRef = db.collection('conversations').doc(convId);
    const convSnap = await convRef.get();
    const prevUnread = convSnap.exists ? (convSnap.data()[`unreadFor_${receiver}`] || 0) : 0;

    await convRef.set({
      participants: [sender, receiver].sort(),
      lastMessage: text,
      lastSender: sender,
      timestamp,
      [`unreadFor_${receiver}`]: prevUnread + 1
    }, { merge: true });

    res.json({ success: true, message: { id: docRef.id, ...newMsg } });
  } catch (error) {
    console.error('Chat Send Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Mark conversation as read — resets unread count for the opener
router.post('/chat/read/:partner', async (req, res) => {
  try {
    const { partner } = req.params;
    const { username } = req.body;
    if (!username || !partner) return res.status(400).json({ message: 'Missing fields' });

    const convId = getConvId(username, partner);
    await db.collection('conversations').doc(convId).set(
      { [`unreadFor_${username}`]: 0 },
      { merge: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get all conversations for the inbox — MUST be before /:user1/:user2 wildcard
router.get('/chat/conversations/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const snapshot = await db.collection('conversations')
      .where('participants', 'array-contains', username)
      .get();

    const conversations = [];
    snapshot.forEach(doc => {
      const d = doc.data();
      const partner = d.participants.find(p => p !== username) || '';
      const unreadCount = d[`unreadFor_${username}`] || 0;
      conversations.push({ partner, lastMessage: d.lastMessage, lastSender: d.lastSender, timestamp: d.timestamp, unreadCount });
    });

    conversations.sort((a, b) => b.timestamp - a.timestamp);
    res.json(conversations);
  } catch (error) {
    console.error('Conversations error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get unread message count — MUST be before /:user1/:user2 wildcard
router.get('/chat/unread/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const since = parseInt(req.query.since) || 0;

    const snapshot = await db.collection('messages')
      .where('receiver', '==', username)
      .get();

    let count = 0;
    snapshot.forEach(doc => {
      if (doc.data().timestamp > since) count++;
    });

    res.json({ count });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ count: 0 });
  }
});

// Get messages between two users — wildcard MUST be last
router.get('/chat/:user1/:user2', async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const convId = getConvId(user1, user2);

    const snapshot = await db.collection('messages')
      .where('conversationId', '==', convId)
      .get();

    const messages = [];
    snapshot.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));
    messages.sort((a, b) => a.timestamp - b.timestamp);

    res.json(messages);
  } catch (error) {
    console.error('Fetch Chat Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;

