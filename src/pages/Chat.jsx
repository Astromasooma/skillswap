import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  MessageSquare, Send, Search, UserCircle2, Phone, Video, Monitor,
  MicOff, VideoOff, PhoneOff, Image, Mic, StopCircle, FileText, X
} from 'lucide-react';

const socket = io(window.location.origin.replace('5173', '3001'));
const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

function Chat({ currentUser }) {
  const location = useLocation();
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

  // Call state
  const [callState, setCallState] = useState(null);
  const [callType, setCallType] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Speaker / output device
  const [audioOutputs, setAudioOutputs] = useState([]);
  const [selectedOutput, setSelectedOutput] = useState('');

  // Transcriber state
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const isTranscribingRef = useRef(false); // stable ref for auto-restart

  // Recording state
  const [isRecording, setIsRecording] = useState(false);

  const convId = useCallback((a, b) => [a, b].sort().join('__'), []);
  const roomId = selectedUser ? convId(currentUser?.username, selectedUser) : null;

  // Socket room join
  useEffect(() => {
    if (!roomId) return;
    socket.emit('join-room', roomId);
  }, [roomId]);

  // Socket call signaling listeners
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
      socket.off('call-request');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('call-ended');
    };
  }, [roomId]);

  // Message polling
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

  useEffect(() => {
    fetchConversations();
    const t = setInterval(fetchConversations, 5000);
    return () => clearInterval(t);
  }, [currentUser]);

  useEffect(() => {
    fetchMessages();
    const t = setInterval(fetchMessages, 2000);
    return () => clearInterval(t);
  }, [currentUser, selectedUser]);

  useEffect(() => {
    if (chatContainerRef.current)
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [messages]);

  // Send text message
  const handleSend = async () => {
    if (!input.trim() || !currentUser || !selectedUser) return;
    const newMsg = { sender: currentUser.username, receiver: selectedUser, text: input, type: 'text', timestamp: Date.now() };
    setMessages(p => [...p, newMsg]);
    setInput('');
    await fetch('/api/chat/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newMsg) });
    fetchConversations();
  };

  // Send a media message — base64 for audio (no Storage needed), FormData for images
  const sendMediaMessage = async (blob, mimeType) => {
    if (!currentUser || !selectedUser) return;
    const msgType = mimeType.startsWith('image') ? 'image' : 'audio';

    // Convert blob to base64 data URL
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const newMsg = {
      sender: currentUser.username,
      receiver: selectedUser,
      text: dataUrl,
      type: msgType,
      timestamp: Date.now()
    };
    setMessages(p => [...p, newMsg]);
    try {
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg)
      });
      fetchConversations();
    } catch (err) {
      console.error('Failed to send media message:', err);
    }
  };

  const handleImagePick = (e) => {
    const file = e.target.files[0];
    if (file) sendMediaMessage(file, file.type);
    e.target.value = '';
  };

  // Capture user refs at recording-start time to avoid stale closures
  const startRecording = async () => {
    if (!selectedUser || !currentUser) return;
    const capturedSender = currentUser.username;
    const capturedReceiver = selectedUser;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size === 0) { console.warn('Empty recording'); return; }

        // Convert to base64 and send
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        const newMsg = {
          sender: capturedSender,
          receiver: capturedReceiver,
          text: dataUrl,
          type: 'audio',
          timestamp: Date.now()
        };
        setMessages(p => [...p, newMsg]);
        try {
          await fetch('/api/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newMsg)
          });
          fetchConversations();
        } catch (err) {
          console.error('Failed to send voice note:', err);
        }
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Could not access microphone:', err);
      alert('Microphone access denied.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // WebRTC helpers
  const createPC = () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pc.onicecandidate = e => e.candidate && socket.emit('ice-candidate', { roomId, candidate: e.candidate });
    pc.ontrack = e => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0]; };
    pcRef.current = pc;
    setCallState('active');
    return pc;
  };

  const startCall = async (type) => {
    setCallType(type);
    setCallState('calling');
    const constraints = { audio: true, video: type === 'video' };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    const pc = createPC();
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    socket.emit('call-request', { roomId, callerName: currentUser.username, type });
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('offer', { roomId, offer });
  };

  const acceptCall = async () => {
    setCallType(incomingCall.type);
    setCallState('active');
    setIncomingCall(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: incomingCall.type === 'video' });
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    if (pcRef.current) stream.getTracks().forEach(t => pcRef.current.addTrack(t, stream));
  };

  const endCall = (emit = true) => {
    if (emit) socket.emit('call-ended', { roomId });
    pcRef.current?.close();
    pcRef.current = null;
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

  // Enumerate audio output devices for speaker selector
  useEffect(() => {
    const getOutputs = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true }); // need permission first
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter(d => d.kind === 'audiooutput');
        setAudioOutputs(outputs);
        if (outputs.length > 0) setSelectedOutput(outputs[0].deviceId);
      } catch (e) { /* permission denied, skip */ }
    };
    getOutputs();
  }, []);

  const handleOutputChange = async (deviceId) => {
    setSelectedOutput(deviceId);
    if (remoteVideoRef.current && remoteVideoRef.current.setSinkId) {
      try { await remoteVideoRef.current.setSinkId(deviceId); } catch (e) { console.warn('setSinkId failed', e); }
    }
  };

  // AI Transcriber — auto-restarts on silence/error, shows interim results
  const startTranscribing = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Speech recognition requires Chrome or Edge.'); return; }

    const launch = () => {
      if (!isTranscribingRef.current) return; // stopped by user
      const rec = new SpeechRecognition();
      rec.continuous = false;       // false = browser restarts reliably per phrase
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (e) => {
        let interim = '';
        let final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
          else interim += e.results[i][0].transcript;
        }
        if (final) setTranscript(p => p + final);
        setInterimText(interim);
      };

      rec.onend = () => {
        setInterimText('');
        if (isTranscribingRef.current) launch(); // auto-restart
      };

      rec.onerror = (e) => {
        if (e.error === 'not-allowed') {
          alert('Microphone permission denied.');
          stopTranscribing();
        }
        // other errors (no-speech, network) — auto-restart handles them
      };

      rec.start();
      recognitionRef.current = rec;
    };

    isTranscribingRef.current = true;
    setIsTranscribing(true);
    setInterimText('');
    launch();
  };

  const stopTranscribing = () => {
    isTranscribingRef.current = false;
    setIsTranscribing(false);
    setInterimText('');
    recognitionRef.current?.stop();
  };

  const markAsRead = async (partner) => {
    try {
      await fetch(`/api/chat/read/${partner}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: currentUser.username }) });
      setConversations(p => p.map(c => c.partner === partner ? { ...c, unreadCount: 0 } : c));
    } catch (e) { console.error(e); }
  };

  const selectConversation = (partner) => {
    setSelectedUser(partner);
    markAsRead(partner);
    localStorage.setItem('lastChatSeen', Date.now().toString());
  };

  const formatTime = (ts) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const filteredConversations = conversations.filter(c => c.partner?.toLowerCase().includes(searchQuery.toLowerCase()));

  const renderMessage = (msg, idx) => {
    const isMe = msg.sender === currentUser?.username;
    const bubbleStyle = {
      background: isMe ? 'var(--primary-color)' : 'var(--overlay-bg)',
      padding: '0.65rem 1rem',
      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
      maxWidth: '68%',
      border: !isMe ? '1px solid var(--overlay-border)' : 'none',
    };
    return (
      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
        <div style={bubbleStyle}>
          {msg.type === 'image' ? (
            <img src={msg.text} alt="shared" style={{ maxWidth: '220px', borderRadius: '8px', display: 'block' }} />
          ) : msg.type === 'audio' ? (
            <audio controls src={msg.text} style={{ maxWidth: '220px' }} />
          ) : (
            <span style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{msg.text}</span>
          )}
        </div>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-main)', marginTop: '0.2rem', opacity: 0.6 }}>{formatTime(msg.timestamp)}</span>
      </div>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header className="page-header" style={{ marginBottom: '1rem' }}>
        <h1>Comms Line</h1>
        <p>Encrypted peer-to-peer messaging, calls, and media sharing.</p>
      </header>

      {/* Incoming call banner — non-blocking toast */}
      {callState === 'receiving' && incomingCall && (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', background: 'var(--surface-color)', border: '1px solid var(--primary-color)', borderRadius: '12px', padding: '1rem 1.5rem', zIndex: 1000, boxShadow: '0 0 20px var(--primary-glow)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 'bold' }}>Incoming {incomingCall.type} call</p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)' }}>from {incomingCall.callerName}</p>
          </div>
          <button className="btn-primary" style={{ background: '#34A853', borderColor: '#34A853', padding: '0.4rem 0.8rem' }} onClick={acceptCall}>Accept</button>
          <button className="btn-outline" style={{ color: '#EA4335', borderColor: '#EA4335', padding: '0.4rem 0.8rem' }} onClick={() => endCall(true)}>Decline</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Inbox */}
        <div className="card" style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--surface-highlight)' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <MessageSquare size={18} /> Inbox
            </h3>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-main)' }} />
              <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '2rem', fontSize: '0.83rem', width: '100%' }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredConversations.length === 0 ? (
              <p style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-main)', fontSize: '0.83rem' }}>No conversations yet.</p>
            ) : filteredConversations.map(conv => {
              const isActive = selectedUser === conv.partner;
              const isLastFromMe = conv.lastSender === currentUser?.username;
              const preview = conv.lastMessage?.startsWith('http') ? '📎 Media' : conv.lastMessage;
              return (
                <div key={conv.partner} onClick={() => selectConversation(conv.partner)}
                  style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--surface-highlight)', background: isActive ? 'rgba(255,106,0,0.08)' : 'transparent', borderLeft: isActive ? '3px solid var(--primary-color)' : '3px solid transparent', display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                  <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '0.8rem', flexShrink: 0 }}>{conv.partner?.substring(0, 2).toUpperCase()}</div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.88rem', color: 'var(--text-heading)' }}>{conv.partner}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-main)' }}>{formatTime(conv.timestamp)}</span>
                        {conv.unreadCount > 0 && <span style={{ background: 'var(--primary-color)', color: '#fff', borderRadius: '999px', fontSize: '0.62rem', fontWeight: 'bold', padding: '0 0.35rem', lineHeight: '1.6' }}>{conv.unreadCount}</span>}
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: conv.unreadCount > 0 ? '500' : 'normal' }}>{isLastFromMe ? 'You: ' : ''}{preview}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat thread OR active call — swaps inline so transcriber stays visible */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', background: (callState === 'active' || callState === 'calling') ? '#0a0a0a' : undefined }}>
          {(callState === 'active' || callState === 'calling') ? (
            /* ===== INLINE CALL UI ===== */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '2rem' }}>
              {/* Call status badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', padding: '0.3rem 0.9rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: callState === 'calling' ? '#facc15' : '#34A853', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                <span style={{ fontSize: '0.8rem', color: '#ccc', fontFamily: 'var(--font-mono)' }}>{callState === 'calling' ? 'Calling...' : 'Connected'}</span>
              </div>

              {callType === 'video' ? (
                <div style={{ position: 'relative', width: '100%', maxWidth: '560px' }}>
                  <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '12px', background: '#111', border: '1px solid rgba(255,255,255,0.08)' }} />
                  <video ref={localVideoRef} autoPlay playsInline muted style={{ position: 'absolute', bottom: '0.75rem', right: '0.75rem', width: '130px', borderRadius: '8px', border: '2px solid var(--primary-color)' }} />
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div className="avatar" style={{ width: '72px', height: '72px', fontSize: '1.8rem', margin: '0 auto 0.75rem', boxShadow: '0 0 24px var(--primary-glow)' }}>{selectedUser?.substring(0, 2).toUpperCase()}</div>
                  <h2 style={{ color: '#fff', margin: '0 0 0.25rem' }}>{selectedUser}</h2>
                  <audio ref={remoteVideoRef} autoPlay />
                </div>
              )}

              {/* Call controls */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}
                  style={{ borderRadius: '50%', padding: '0.75rem', aspectRatio: '1', background: isMuted ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex' }}>
                  <MicOff size={18} />
                </button>
                {callType === 'video' && (
                  <button onClick={toggleCam} title={isCamOff ? 'Turn Camera On' : 'Turn Camera Off'}
                    style={{ borderRadius: '50%', padding: '0.75rem', aspectRatio: '1', background: isCamOff ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex' }}>
                    <VideoOff size={18} />
                  </button>
                )}
                {callType === 'video' && (
                  <button onClick={toggleScreenShare} title={isSharing ? 'Stop Sharing' : 'Share Screen'}
                    style={{ borderRadius: '50%', padding: '0.75rem', aspectRatio: '1', background: isSharing ? '#facc15' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: isSharing ? '#000' : '#fff', cursor: 'pointer', display: 'flex' }}>
                    <Monitor size={18} />
                  </button>
                )}
                <button onClick={() => endCall(true)} title="End Call"
                  style={{ borderRadius: '50%', padding: '0.75rem', aspectRatio: '1', background: '#EA4335', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}>
                  <PhoneOff size={18} />
                </button>
              </div>

              {/* Speaker / output selector */}
              {audioOutputs.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#888' }}>🔊 Output:</span>
                  <select
                    value={selectedOutput}
                    onChange={e => handleOutputChange(e.target.value)}
                    style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.08)', color: '#ccc', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '0.25rem 0.5rem', cursor: 'pointer' }}
                  >
                    {audioOutputs.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || `Speaker ${d.deviceId.slice(0, 6)}`}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : selectedUser ? (
            <>
              {/* Chat header */}
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--surface-highlight)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div className="avatar" style={{ width: '34px', height: '34px', fontSize: '0.75rem' }}>{selectedUser?.substring(0, 2).toUpperCase()}</div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem' }}>{selectedUser}</h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontFamily: 'var(--font-mono)' }}>● ONLINE</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button className="btn-outline" title="Voice Call" style={{ padding: '0.4rem', borderRadius: '8px' }} onClick={() => startCall('audio')}><Phone size={16} /></button>
                  <button className="btn-outline" title="Video Call" style={{ padding: '0.4rem', borderRadius: '8px' }} onClick={() => startCall('video')}><Video size={16} /></button>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>[ ENCRYPTED ]</span>
                </div>
              </div>

              {/* Messages */}
              <div ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {messages.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-main)', opacity: 0.4, marginTop: '3rem' }}>No messages yet. Say hello!</div>}
                {messages.map(renderMessage)}
              </div>

              {/* Input bar */}
              <div style={{ padding: '0.65rem 0.75rem', borderTop: '1px solid var(--surface-highlight)', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImagePick} />
                <button className="btn-outline" title="Send Image" style={{ padding: '0.4rem', borderRadius: '8px' }} onClick={() => fileInputRef.current?.click()}><Image size={16} /></button>
                <button className="btn-outline" title={isRecording ? 'Stop Recording' : 'Voice Note'} style={{ padding: '0.4rem', borderRadius: '8px', color: isRecording ? '#EA4335' : undefined }} onClick={isRecording ? stopRecording : startRecording}>
                  {isRecording ? <StopCircle size={16} /> : <Mic size={16} />}
                </button>
                <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={`Message ${selectedUser}...`} style={{ flex: 1, fontSize: '0.9rem' }} />
                <button className="btn-primary" onClick={handleSend} style={{ padding: '0.5rem 0.9rem', display: 'flex', alignItems: 'center' }}><Send size={15} /></button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-main)' }}>
              <UserCircle2 size={64} opacity={0.2} />
              <p style={{ opacity: 0.5 }}>Select a conversation to start chatting</p>
            </div>
          )}
        </div>

        {/* AI Transcriber panel — always visible, works side-by-side with calls */}
        <div className="card" style={{ width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h3 style={{ margin: '0 0 0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
            <FileText size={16} />
            AI Transcriber
            {isTranscribing && <span style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: '#EA4335', display: 'inline-block', animation: 'pulse 1s infinite' }} />}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-main)', marginBottom: '0.6rem', lineHeight: '1.4' }}>Live mic speech-to-text. Works during calls.</p>

          {/* Transcript output */}
          <div style={{ flex: 1, background: 'var(--input-bg)', borderRadius: '8px', border: `1px solid ${isTranscribing ? 'var(--primary-color)' : 'var(--overlay-border)'}`, padding: '0.65rem', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', lineHeight: '1.6', minHeight: '100px', transition: 'border-color 0.2s' }}>
            {transcript && <span style={{ color: 'var(--text-heading)' }}>{transcript}</span>}
            {interimText && <span style={{ color: 'var(--primary-color)', fontStyle: 'italic', opacity: 0.8 }}>{interimText}</span>}
            {!transcript && !interimText && <span style={{ opacity: 0.35, color: 'var(--text-main)' }}>Transcript will appear here...</span>}
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem' }}>
            <button
              onClick={isTranscribing ? stopTranscribing : startTranscribing}
              className={isTranscribing ? 'btn-primary' : 'btn-outline'}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.78rem', padding: '0.45rem' }}
            >
              <Mic size={13} /> {isTranscribing ? 'Stop' : 'Start'}
            </button>
            <button className="btn-outline" title="Clear transcript" onClick={() => setTranscript('')} style={{ padding: '0.45rem', borderRadius: '8px' }}><X size={13} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
