import express from 'express';
import multer from 'multer';
import bcrypt from 'bcryptjs';

import Stripe from 'stripe';
import { db, bucket } from '../index.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51TSkNDDXbv271WTLN9Lhi6AM1vOMBFLQj4WnF74Hq1gAPUTxYJparzT8GAQq0gZQHQc4B3ArgTJxYYqk07UoCACa00gR6jeg6h');


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

    const newUser = {
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      balance: 0,
      occupation: '',
      offers: '',
      needs: '',
      rates: 0,
      availability: '',
      portfolio: []
    };


    const docRef = await usersRef.add(newUser);

    res.json({ success: true, message: 'User registered successfully', user: { id: docRef.id, username, email } });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ success: false, message: `Signup Error: ${error.message}` });
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
    res.status(500).json({ success: false, message: `Login Error: ${error.message}` });
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

// Seed mock users with Identity Matrix (one-time use)
router.post('/users/seed', async (req, res) => {
  try {
    const mockUsers = [
      {
        username: 'Dr. Rivera', email: 'rivera@mock.com', occupation: 'Physician',
        offers: 'Medical First Aid, CPR Training', needs: 'Web Development',
        rates: 50, availability: 'Mon-Wed, 6pm-9pm', portfolio: [], password: 'mock'
      },
      {
        username: 'Alex Smith', email: 'alex@mock.com', occupation: 'Math Professor',
        offers: 'Advanced Calculus, Linear Algebra', needs: 'Figma Prototyping',
        rates: 40, availability: 'Tue/Thu, 4pm-7pm', portfolio: [], password: 'mock'
      },
      {
        username: 'Mia Lin', email: 'mia@mock.com', occupation: 'Concept Artist',
        offers: 'Digital Illustration, Character Design', needs: 'React Basics',
        rates: 45, availability: 'Weekends, 10am-4pm', portfolio: [], password: 'mock'
      },
      {
        username: 'Marcus', email: 'marcus@mock.com', occupation: 'Cloud Architect',
        offers: 'AWS/GCP Architecture, Data Science', needs: 'System Architecture',
        rates: 60, availability: 'Friday, 2pm-8pm', portfolio: [], password: 'mock'
      }
    ];

    const batch = db.batch();
    const usersRef = db.collection('users');

    mockUsers.forEach(user => {
      const docRef = usersRef.doc();
      batch.set(docRef, { ...user, createdAt: new Date().toISOString(), balance: 0 });
    });

    await batch.commit();
    res.json({ success: true, message: 'Database seeded with Identity Matrix users!' });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Send a connection request (Learn or Teach flow)
router.post('/connections/request', async (req, res) => {
  try {
    const { sender, receiver, type } = req.body;
    if (!sender || !receiver || !type) return res.status(400).json({ message: 'Missing fields' });

    const message = type === 'learn' ? 'I want to learn your skill.' : 'I am available/interested to fulfill your need.';

    const connRef = db.collection('connections');
    const docRef = await connRef.add({
      sender,
      receiver,
      type, // 'learn' | 'teach'
      status: 'pending',
      message,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Request sent successfully', id: docRef.id });
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

// Accept connection request (initiates payment requirement)
router.post('/connections/accept/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connDoc = await db.collection('connections').doc(id).get();
    if (!connDoc.exists) return res.status(404).json({ message: 'Request not found' });
    
    const data = connDoc.data();
    // For 'learn', the sender (learner) pays. For 'teach', the receiver (need owner) pays.
    const payer = data.type === 'learn' ? data.sender : data.receiver;

    await connDoc.ref.update({ 
      status: 'pending_payment',
      payer,
      acceptedAt: new Date().toISOString()
    });

    res.json({ success: true, message: 'Request accepted. Payment required from ' + payer });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Get pending payments for a user
router.get('/connections/pending-payment/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const snap = await db.collection('connections')
      .where('payer', '==', username)
      .where('status', '==', 'pending_payment')
      .get();

    const pending = [];
    snap.forEach(doc => pending.push({ id: doc.id, ...doc.data() }));
    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Pay for a connection (internal credit transfer)
router.post('/connections/pay/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connDoc = await db.collection('connections').doc(id).get();
    if (!connDoc.exists) return res.status(404).json({ message: 'Connection not found' });

    const data = connDoc.data();
    const amount = 50; // Fixed session cost for now, could be dynamic based on rates

    const payerRef = db.collection('users').where('username', '==', data.payer);
    const receiverRef = db.collection('users').where('username', '==', (data.payer === data.sender ? data.receiver : data.sender));
    
    const payerSnap = await payerRef.get();
    const receiverSnap = await receiverRef.get();

    if (payerSnap.empty || receiverSnap.empty) return res.status(404).json({ message: 'Users not found' });

    const payerDoc = payerSnap.docs[0];
    const receiverDoc = receiverSnap.docs[0];

    if (payerDoc.data().balance < amount) return res.status(400).json({ message: 'Insufficient credits' });

    // Atomic update
    await db.runTransaction(async (transaction) => {
      transaction.update(payerDoc.ref, { balance: payerDoc.data().balance - amount });
      transaction.update(receiverDoc.ref, { balance: (receiverDoc.data().balance || 0) + amount });
      transaction.update(connDoc.ref, { status: 'accepted' });

      // Log transactions
      const ledger = db.collection('ledger');
      transaction.set(ledger.doc(), {
        from: data.payer,
        to: receiverDoc.data().username,
        amount,
        type: 'session_payment',
        description: `Session Payment: ${data.type.toUpperCase()}`,
        timestamp: new Date().toISOString()
      });
    });

    res.json({ success: true, message: 'Payment successful. Connection activated.' });
  } catch (error) {
    console.error('Payment Error:', error);
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
// IDENTITY MATRIX (PROFILE)
// ==========================================

// Get profile
router.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const snap = await db.collection('users').where('username', '==', username).get();
    if (snap.empty) return res.status(404).json({ message: 'User not found' });
    res.json(snap.docs[0].data());
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Update profile
router.post('/profile/update', async (req, res) => {
  try {
    const { username, occupation, offers, needs, rates, availability } = req.body;
    const snap = await db.collection('users').where('username', '==', username).get();
    if (snap.empty) return res.status(404).json({ message: 'User not found' });

    await snap.docs[0].ref.update({
      occupation, offers, needs, rates: Number(rates), availability
    });

    res.json({ success: true, message: 'Matrix updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Upload to Portfolio
router.post('/profile/portfolio/upload', upload.single('file'), async (req, res) => {
  try {
    const { username } = req.body;
    if (!req.file || !username) return res.status(400).json({ message: 'Missing file or username' });

    const filename = `portfolios/${Date.now()}_${req.file.originalname}`;
    const fileRef = bucket.file(filename);

    const stream = fileRef.createWriteStream({ metadata: { contentType: req.file.mimetype } });
    stream.on('error', () => res.status(500).json({ message: 'Upload failed' }));
    stream.on('finish', async () => {
      // makePublic() fails on buckets with Uniform Bucket-Level Access enabled.
      // We assume the bucket is configured for public read or we use the direct URL.
      const url = `https://storage.googleapis.com/${bucket.name}/${filename}`;
      
      const snap = await db.collection('users').where('username', '==', username).get();
      if (!snap.empty) {
        const userDoc = snap.docs[0];
        const portfolio = userDoc.data().portfolio || [];
        portfolio.push({ name: req.file.originalname, url, timestamp: Date.now() });
        await userDoc.ref.update({ portfolio });
      }

      res.json({ success: true, url });
    });

    stream.end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// ==========================================
// CHAT MESSAGING
// ==========================================

// Helper: create a deterministic conversation ID for two users
const getConvId = (a, b) => [a, b].sort().join('__');

// Upload image or voice note to Firebase Storage and return a public URL
router.post('/chat/upload', upload.single('media'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const timestamp = Date.now();
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `chat-media/${timestamp}_${safeName}`;
    const fileRef = bucket.file(filename);

    const stream = fileRef.createWriteStream({ metadata: { contentType: req.file.mimetype } });
    stream.on('error', () => res.status(500).json({ message: 'Upload failed' }));
    stream.on('finish', async () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
      res.json({ success: true, url: publicUrl, type: req.file.mimetype });
    });

    stream.end(req.file.buffer);
  } catch (error) {
    console.error('Media upload error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Send a message — stores conversationId for index-free querying
router.post('/chat/send', async (req, res) => {
  try {
    const { sender, receiver, text, type = 'text' } = req.body;
    if (!sender || !receiver || !text) return res.status(400).json({ message: 'Missing fields' });

    const convId = getConvId(sender, receiver);
    const timestamp = Date.now();

    const newMsg = { sender, receiver, text, type, timestamp, conversationId: convId };
    const docRef = await db.collection('messages').add(newMsg);

    // Human-readable preview for media messages (don't store raw base64 in lastMessage)
    let lastMessagePreview = text;
    if (type === 'audio') lastMessagePreview = '🎤 Voice message';
    else if (type === 'image') lastMessagePreview = '🖼️ Image';

    // Upsert conversation metadata + increment unread count for receiver
    const convRef = db.collection('conversations').doc(convId);
    const convSnap = await convRef.get();
    const prevUnread = convSnap.exists ? (convSnap.data()[`unreadFor_${receiver}`] || 0) : 0;

    await convRef.set({
      participants: [sender, receiver].sort(),
      lastMessage: lastMessagePreview,
      lastSender: sender,
      timestamp,
      [`unreadFor_${receiver}`]: prevUnread + 1
    }, { merge: true });

    // Real-time notification via Socket.io
    const io = req.app.get('io');
    const msgWithId = { id: docRef.id, ...newMsg };
    io.to(`chat_${receiver}`).emit('new-message', msgWithId);

    res.json({ success: true, message: msgWithId });

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

// ==========================================
// WALLET & TRANSACTIONS
// ==========================================

// Get user balance
router.get('/wallet/balance/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const userDoc = await db.collection('users').where('username', '==', username).get();
    if (userDoc.empty) return res.status(404).json({ message: 'User not found' });

    const userData = userDoc.docs[0].data();
    res.json({ balance: userData.balance || 0 });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get transaction history (Ledger)
router.get('/wallet/history/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const snapshot = await db.collection('transactions')
      .where('participants', 'array-contains', username)
      .orderBy('timestamp', 'desc')
      .get();

    const history = [];
    snapshot.forEach(doc => history.push({ id: doc.id, ...doc.data() }));
    res.json(history);
  } catch (error) {
    console.error('Ledger error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Sandbox Top-up (Add credits)
router.post('/wallet/topup', async (req, res) => {
  try {
    const { username, amount } = req.body;
    if (!username || !amount) return res.status(400).json({ message: 'Missing fields' });

    const userRef = db.collection('users').where('username', '==', username);
    const snap = await userRef.get();
    if (snap.empty) return res.status(404).json({ message: 'User not found' });

    const doc = snap.docs[0];
    const newBalance = (doc.data().balance || 0) + Number(amount);

    // Update balance
    await doc.ref.update({ balance: newBalance });

    // Record transaction
    await db.collection('transactions').add({
      type: 'topup',
      participants: [username],
      to: username,
      amount: Number(amount),
      timestamp: Date.now(),
      status: 'completed',
      description: 'Sandbox Top-up'
    });

    res.json({ success: true, balance: newBalance });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Transfer credits
router.post('/wallet/transfer', async (req, res) => {
  try {
    const { from, to, amount } = req.body;
    if (!from || !to || !amount) return res.status(400).json({ message: 'Missing fields' });

    // Verify sender
    const fromSnap = await db.collection('users').where('username', '==', from).get();
    if (fromSnap.empty) return res.status(404).json({ message: 'Sender not found' });
    const fromDoc = fromSnap.docs[0];
    const fromBalance = fromDoc.data().balance || 0;

    if (fromBalance < amount) return res.status(400).json({ message: 'Insufficient balance' });

    // Verify receiver
    const toSnap = await db.collection('users').where('username', '==', to).get();
    if (toSnap.empty) return res.status(404).json({ message: 'Receiver not found' });
    const toDoc = toSnap.docs[0];

    // Atomic-like update (simplified)
    await fromDoc.ref.update({ balance: fromBalance - Number(amount) });
    await toDoc.ref.update({ balance: (toDoc.data().balance || 0) + Number(amount) });

    // Record transaction
    await db.collection('transactions').add({
      type: 'transfer',
      participants: [from, to],
      from,
      to,
      amount: Number(amount),
      timestamp: Date.now(),
      status: 'completed',
      description: `Transfer to ${to}`
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ==========================================
// STRIPE INTEGRATION
// ==========================================

// Create a Stripe Checkout Session
router.post('/wallet/create-checkout-session', async (req, res) => {
  try {
    const { username, amount } = req.body;
    if (!username || !amount) return res.status(400).json({ message: 'Missing fields' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${amount} SkillSwap Credits`,
            description: 'Equivalent exchange credits for SkillSwap community.',
          },
          unit_amount: amount * 100, // Amount in cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}/wallet?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/wallet`,
      metadata: { username, amount }
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe Session Error:', error);
    res.status(500).json({ message: 'Stripe integration error' });
  }
});

// Verify Stripe Session (Simple alternative to Webhooks for local dev)
router.get('/wallet/verify-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const { username, amount } = session.metadata;

      // Check if this session was already processed to prevent duplicate top-ups
      const txRef = db.collection('transactions').where('stripeSessionId', '==', sessionId);
      const txSnap = await txRef.get();

      if (txSnap.empty) {
        // Update balance
        const userRef = db.collection('users').where('username', '==', username);
        const userSnap = await userRef.get();
        if (!userSnap.empty) {
          const userDoc = userSnap.docs[0];
          const newBalance = (userDoc.data().balance || 0) + Number(amount);
          await userDoc.ref.update({ balance: newBalance });

          // Record transaction
          await db.collection('transactions').add({
            type: 'topup',
            participants: [username],
            to: username,
            amount: Number(amount),
            timestamp: Date.now(),
            status: 'completed',
            description: 'Stripe Payment',
            stripeSessionId: sessionId
          });

          return res.json({ success: true, amount, balance: newBalance });
        }
      } else {
        return res.json({ success: true, message: 'Already processed' });
      }
    }
    res.status(400).json({ success: false, message: 'Payment not completed' });
  } catch (error) {
    res.status(500).json({ message: 'Verification error' });
  }
});

// ==========================================
// CALENDAR & SCHEDULING
// ==========================================

// Create a meeting
router.post('/meetings/create', async (req, res) => {
  try {
    const { creator, partner, start, end, title, description } = req.body;
    if (!creator || !partner || !start || !end) return res.status(400).json({ message: 'Missing fields' });

    const meeting = {
      participants: [creator, partner].sort(),
      creator,
      partner,
      start, // ISO string
      end,   // ISO string
      title,
      description,
      status: 'scheduled',
      timestamp: Date.now()
    };

    const docRef = await db.collection('meetings').add(meeting);
    res.json({ success: true, meeting: { id: docRef.id, ...meeting } });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get meetings for a user
router.get('/meetings/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const snap = await db.collection('meetings')
      .where('participants', 'array-contains', username)
      .get();
    
    const meetings = [];
    snap.forEach(doc => meetings.push({ id: doc.id, ...doc.data() }));
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ==========================================
// BACKGROUND JOB (SESSION CONTROL)
// ==========================================
// This checks for expired meetings and revokes connection access
const sessionCleanupJob = async () => {
  try {
    const now = new Date().toISOString();
    // Simplified query to avoid composite index requirements
    const snap = await db.collection('meetings')
      .where('status', '==', 'scheduled')
      .get();

    if (snap.empty) return;

    for (const doc of snap.docs) {
      const meeting = doc.data();
      // Filter by end time in memory
      if (meeting.end < now) {
        // Revoke connection (set status to expired)
        const [u1, u2] = meeting.participants;
        const connSnap = await db.collection('connections')
          .where('participants', 'array-contains', u1)
          .get();
        
        for (const connDoc of connSnap.docs) {
          const c = connDoc.data();
          if (c.participants?.includes(u2)) {
            await connDoc.ref.update({ status: 'expired' });
          }
        }

        await doc.ref.update({ status: 'completed' });
        console.log(`Meeting ${doc.id} completed. Revoked access between ${u1} and ${u2}.`);
      }
    }
  } catch (e) {
    console.error('Session cleanup error:', e);
  }
};


// Aggregated user metrics for Overview/Dashboard
router.get('/overview/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // 1. Get Connections
    const connsSnap = await db.collection('connections')
      .where('participants', 'array-contains', username)
      .where('status', '==', 'accepted')
      .get();
    const connectionsCount = connsSnap.size;

    // 2. Get Transactions for Credits Earned/Spent
    const txSnap = await db.collection('transactions')
      .where('participants', 'array-contains', username)
      .get();

    let creditsEarned = 0;
    let creditsSpent = 0;
    let transactions = [];
    txSnap.forEach(doc => transactions.push({ id: doc.id, ...doc.data() }));

    // Sort in-memory to avoid composite index requirement
    transactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const recentActivity = [];
    transactions.forEach(tx => {
      if (tx.receiver === username) creditsEarned += tx.amount;
      if (tx.sender === username) creditsSpent += tx.amount;
      
      if (recentActivity.length < 10) {
        recentActivity.push({
          id: tx.id,
          type: 'transaction',
          title: tx.sender === username ? `Sent credits to ${tx.receiver}` : `Received credits from ${tx.sender}`,
          amount: tx.amount,
          timestamp: tx.timestamp,
          positive: tx.receiver === username
        });
      }
    });


    // 3. Get Meetings for Hours Spent
    const meetSnap = await db.collection('meetings')
      .where('participants', 'array-contains', username)
      .where('status', '==', 'completed')
      .get();

    let totalMinutes = 0;
    meetSnap.forEach(doc => {
      const m = doc.data();
      const start = new Date(m.start);
      const end = new Date(m.end);
      totalMinutes += (end - start) / (1000 * 60);
    });
    const hoursSpent = (totalMinutes / 60).toFixed(1);

    res.json({
      hoursSpent,
      creditsEarned,
      creditsSpent,
      connectionsCount,
      recentActivity
    });

  } catch (error) {
    console.error('Overview error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Run cleanup every 1 minute
setInterval(sessionCleanupJob, 60000);

export default router;

