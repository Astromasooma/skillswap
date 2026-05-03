import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  MessageSquare, Send, Search, UserCircle2, Phone, Video, Monitor,
  MicOff, VideoOff, PhoneOff, Image, Mic, StopCircle, FileText, X, ChevronLeft, Lock, AlertTriangle
} from 'lucide-react';

const socket = io();
const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

function Chat({ currentUser }) {
  const location = useLocation();
  const navigate = useNavigate();
  const chatContainerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(location.state?.targetUser || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobilePanel, setMobilePanel] = useState('inbox');
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1100;

  const [connStatus, setConnStatus] = useState('accepted'); // 'accepted' | 'pending_payment' | 'expired' | 'none'
  const [isCheckingConn, setIsCheckingConn] = useState(false);

  const [callState, setCallState] = useState(null);
  const [callType, setCallType] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const [audioOutputs, setAudioOutputs] = useState([]);
  const [selectedOutput, setSelectedOutput] = useState('');

  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const isTranscribingRef = useRef(false);

  const [isRecording, setIsRecording] = useState(false);

  const convId = useCallback((a, b) => [a, b].sort().join('__'), []);
  const roomId = selectedUser ? convId(currentUser?.username, selectedUser) : null;

  useEffect(() => {
    if (currentUser?.username) socket.emit('join-chat', currentUser.username);
    if (roomId) socket.emit('join-room', roomId);
  }, [roomId, currentUser]);

  useEffect(() => {
    socket.on('new-message', (msg) => {
      if (selectedUser === msg.sender || (msg.sender === currentUser?.username && msg.receiver === selectedUser)) {
        setMessages(p => {
          if (p.some(m => m.id === msg.id || (m.timestamp === msg.timestamp && m.text === msg.text))) return p;
          return [...p, msg];
        });
      }
      fetchConversations();
    });
    return () => { socket.off('new-message'); };
  }, [selectedUser, currentUser]);

  useEffect(() => {
    socket.on('call-request', ({ callerName, type }) => {
      setIncomingCall({ callerName, type });
      setCallState('receiving');
    });
    socket.on('offer', async ({ offer }) => {
      const pc = createPC();
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { roomId, answer });
    });
    socket.on('answer', async ({ answer }) => {
      await pcRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
    });
    socket.on('ice-candidate', ({ candidate }) => {
      pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
    });
    socket.on('call-ended', () => endCall(false));
    return () => {
      socket.off('call-request'); socket.off('offer'); socket.off('answer');
      socket.off('ice-candidate'); socket.off('call-ended');
    };
  }, [roomId]);

  const fetchConversations = async () => {
    if (!currentUser?.username) return;
    try {
      const res = await fetch(`/api/chat/conversations/${currentUser.username}`);
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const fetchMessages = async () => {
    if (!currentUser || !selectedUser) return;
    try {
      const res = await fetch(`/api/chat/${currentUser.username}/${selectedUser}`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const checkConnection = async (partner) => {
    if (!currentUser || !partner) return;
    setIsCheckingConn(true);
    try {
      const res = await fetch(`/api/connections/${currentUser.username}`);
      const requests = await res.json();
      // Also check accepted connections
      const accRes = await fetch(`/api/connections/accepted/${currentUser.username}`);
      const accepted = await accRes.json();
      
      if (accepted.includes(partner)) {
        setConnStatus('accepted');
      } else {
        const req = requests.find(r => r.sender === partner || r.receiver === partner);
        if (req) {
          setConnStatus(req.status);
        } else {
          setConnStatus('none');
        }
      }
    } catch (e) { console.error(e); }
    setIsCheckingConn(false);
  };

  useEffect(() => {
    fetchConversations();
  }, [currentUser]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
      checkConnection(selectedUser);
    }
  }, [currentUser, selectedUser]);

  useEffect(() => {
    if (chatContainerRef.current)
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !currentUser || !selectedUser || connStatus !== 'accepted') return;
    const newMsg = { sender: currentUser.username, receiver: selectedUser, text: input, type: 'text', timestamp: Date.now() };
    setMessages(p => [...p, newMsg]);
    setInput('');
    await fetch('/api/chat/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newMsg) });
    fetchConversations();
  };

  const sendMediaMessage = async (blob, mimeType) => {
    if (!currentUser || !selectedUser || connStatus !== 'accepted') return;
    const msgType = mimeType.startsWith('image') ? 'image' : 'audio';
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const newMsg = { sender: currentUser.username, receiver: selectedUser, text: dataUrl, type: msgType, timestamp: Date.now() };
    setMessages(p => [...p, newMsg]);
    try {
      await fetch('/api/chat/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newMsg) });
      fetchConversations();
    } catch (err) { console.error(err); }
  };

  const handleImagePick = (e) => {
    const file = e.target.files[0];
    if (file) sendMediaMessage(file, file.type);
    e.target.value = '';
  };

  const startRecording = async () => {
    if (!selectedUser || !currentUser || connStatus !== 'accepted') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        sendMediaMessage(blob, mimeType);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) { alert('Microphone access denied.'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const createPC = () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pc.onicecandidate = e => e.candidate && socket.emit('ice-candidate', { roomId, candidate: e.candidate });
    pc.ontrack = e => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0]; };
    pcRef.current = pc;
    setCallState('active');
    return pc;
  };

  const startCall = async (type) => {
    if (connStatus !== 'accepted') return;
    setCallType(type);
    setCallState('calling');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    const pc = createPC();
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    
    // Emit to receiver's personal room
    socket.emit('call-request', { receiver: selectedUser, callerName: currentUser.username, type, roomId });
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('offer', { roomId, offer });
  };

  const acceptCall = async () => {
    const rId = incomingCall.roomId || roomId;
    socket.emit('join-room', rId); // Ensure we are in the call room
    
    setCallType(incomingCall.type);
    setCallState('active');
    setIncomingCall(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: incomingCall.type === 'video' });
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    if (pcRef.current) stream.getTracks().forEach(t => pcRef.current.addTrack(t, stream));
  };


  const endCall = (emit = true) => {
    if (emit) socket.emit('call-ended', { roomId });
    pcRef.current?.close(); pcRef.current = null;
    if (localVideoRef.current?.srcObject) localVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
    if (remoteVideoRef.current?.srcObject) remoteVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
    setCallState(null); setCallType(null); setIncomingCall(null); setIsSharing(false);
  };

  const toggleScreenShare = async () => {
    if (!isSharing) {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
      if (sender) sender.replaceTrack(screen.getTracks()[0]);
      setIsSharing(true);
      screen.getTracks()[0].onended = () => setIsSharing(false);
    } else {
      const cam = await navigator.mediaDevices.getUserMedia({ video: true });
      const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
      if (sender) sender.replaceTrack(cam.getTracks()[0]);
      setIsSharing(false);
    }
  };

  const toggleMute = () => {
    localVideoRef.current?.srcObject?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(p => !p);
  };

  const toggleCam = () => {
    localVideoRef.current?.srcObject?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCamOff(p => !p);
  };

  const startTranscribing = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const launch = () => {
      if (!isTranscribingRef.current) return;
      const rec = new SpeechRecognition();
      rec.continuous = false; rec.interimResults = true; rec.lang = 'en-US';
      rec.onresult = (e) => {
        let interim = '', final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
          else interim += e.results[i][0].transcript;
        }
        if (final) setTranscript(p => p + final);
        setInterimText(interim);
      };
      rec.onend = () => { setInterimText(''); if (isTranscribingRef.current) launch(); };
      rec.start();
      recognitionRef.current = rec;
    };
    isTranscribingRef.current = true; setIsTranscribing(true); launch();
  };

  const stopTranscribing = () => {
    isTranscribingRef.current = false; setIsTranscribing(false);
    setInterimText(''); recognitionRef.current?.stop();
  };

  const selectConversation = (partner) => {
    setSelectedUser(partner);
    if (isMobile) setMobilePanel('chat');
  };

  const formatTime = (ts) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const renderMessage = (msg, idx) => {
    const isMe = msg.sender === currentUser?.username;
    return (
      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
        <div style={{ background: isMe ? 'var(--primary-color)' : 'var(--overlay-bg)', padding: '0.65rem 1rem', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', maxWidth: '85%', border: !isMe ? '1px solid var(--overlay-border)' : 'none' }}>
          {msg.type === 'image' ? <img src={msg.text} style={{ maxWidth: '220px', borderRadius: '8px' }} /> : msg.type === 'audio' ? <audio controls src={msg.text} style={{ maxWidth: '220px' }} /> : <span style={{ fontSize: '0.9rem' }}>{msg.text}</span>}
        </div>
        <span style={{ fontSize: '0.68rem', opacity: 0.6, marginTop: '0.2rem' }}>{formatTime(msg.timestamp)}</span>
      </div>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header className="page-header">
        <h1>Comms Line</h1>
        <p>Encrypted peer-to-peer messaging and session-locked comms.</p>
      </header>

      <div style={{ display: 'flex', gap: '0.75rem', flex: 1, overflow: 'hidden' }}>
        <div className="card" style={{ width: isMobile ? '100%' : '240px', display: isMobile && mobilePanel !== 'inbox' ? 'none' : 'flex', flexDirection: 'column', padding: 0 }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--overlay-border)' }}><h3>Inbox</h3></div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.map(conv => (
              <div key={conv.partner} onClick={() => selectConversation(conv.partner)} style={{ padding: '1rem', cursor: 'pointer', background: selectedUser === conv.partner ? 'rgba(255,106,0,0.1)' : 'transparent', borderBottom: '1px solid var(--overlay-border)' }}>
                <div style={{ fontWeight: 'bold' }}>{conv.partner}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{conv.lastMessage?.slice(0, 20)}...</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ flex: 1, display: isMobile && mobilePanel !== 'chat' ? 'none' : 'flex', flexDirection: 'column', padding: 0, position: 'relative' }}>
          {selectedUser ? (
            <>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--overlay-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold' }}>{selectedUser}</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-outline" onClick={() => startCall('audio')} disabled={connStatus !== 'accepted'}><Phone size={16} /></button>
                  <button className="btn-outline" onClick={() => startCall('video')} disabled={connStatus !== 'accepted'}><Video size={16} /></button>
                </div>
              </div>

              <div ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map(renderMessage)}
              </div>

              {/* Session Lock Overlay */}
              {connStatus !== 'accepted' && !isCheckingConn && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
                  {connStatus === 'expired' ? (
                    <>
                      <AlertTriangle size={48} color="#EA4335" style={{ marginBottom: '1rem' }} />
                      <h2 style={{ color: '#EA4335' }}>Session Expired</h2>
                      <p>The scheduled meeting has concluded. Communication access has been revoked.</p>
                      <button className="btn-primary" onClick={() => navigate('/search')} style={{ marginTop: '1.5rem' }}>Book New Session</button>
                    </>
                  ) : connStatus === 'pending_payment' ? (
                    <>
                      <Lock size={48} className="text-primary" style={{ marginBottom: '1rem' }} />
                      <h2>Payment Required</h2>
                      <p>This connection is awaiting credit verification. Please complete the payment to unlock the line.</p>
                      <button className="btn-primary" onClick={() => navigate('/wallet')} style={{ marginTop: '1.5rem' }}>Go to Wallet</button>
                    </>
                  ) : (
                    <>
                      <Lock size={48} opacity={0.5} style={{ marginBottom: '1rem' }} />
                      <h2>Line Encrypted</h2>
                      <p>You must be connected and have an active session to communicate with this node.</p>
                      <button className="btn-primary" onClick={() => navigate('/search')} style={{ marginTop: '1.5rem' }}>Find Node</button>
                    </>
                  )}
                </div>
              )}

              <div style={{ padding: '1rem', borderTop: '1px solid var(--overlay-border)', display: 'flex', gap: '0.5rem' }}>
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImagePick} />
                <button className="btn-outline" onClick={() => fileInputRef.current.click()} disabled={connStatus !== 'accepted'}><Image size={18} /></button>
                <button className="btn-outline" onClick={isRecording ? stopRecording : startRecording} disabled={connStatus !== 'accepted'} style={{ color: isRecording ? '#EA4335' : undefined }}><Mic size={18} /></button>
                <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Type a message..." disabled={connStatus !== 'accepted'} style={{ flex: 1 }} />
                <button className="btn-primary" onClick={handleSend} disabled={connStatus !== 'accepted'}><Send size={18} /></button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>Select a node to begin</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;

