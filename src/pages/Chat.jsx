import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, Send, Search, UserCircle2 } from 'lucide-react';

function Chat({ currentUser }) {
  const location = useLocation();
  const chatContainerRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(location.state?.targetUser || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Mark messages as read on open — clears sidebar badge
  useEffect(() => {
    localStorage.setItem('lastChatSeen', Date.now().toString());
  }, [selectedUser]);

  // Fetch conversation list
  const fetchConversations = async () => {
    if (!currentUser?.username) return;
    try {
      const res = await fetch(`/api/chat/conversations/${currentUser.username}`);
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch messages for the active conversation
  const fetchMessages = async () => {
    if (!currentUser || !selectedUser) return;
    try {
      const res = await fetch(`/api/chat/${currentUser.username}/${selectedUser}`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [currentUser, selectedUser]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !currentUser || !selectedUser) return;
    const newMsg = { sender: currentUser.username, receiver: selectedUser, text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    try {
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg)
      });
      fetchConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (partner) => {
    if (!currentUser?.username || !partner) return;
    try {
      await fetch(`/api/chat/read/${partner}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username })
      });
      // Immediately clear the badge in local state
      setConversations(prev => prev.map(c =>
        c.partner === partner ? { ...c, unreadCount: 0 } : c
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const selectConversation = (partner) => {
    setSelectedUser(partner);
    markAsRead(partner);
    localStorage.setItem('lastChatSeen', Date.now().toString());
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredConversations = conversations.filter(c =>
    c.partner?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="page-header" style={{ marginBottom: '1rem' }}>
        <h1>Comms Line</h1>
        <p>Your encrypted peer-to-peer message threads.</p>
      </header>

      {/* Two-panel layout */}
      <div style={{ display: 'flex', gap: '1rem', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* LEFT: Conversation Inbox */}
        <div className="card" style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          {/* Inbox header */}
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--surface-highlight)' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <MessageSquare size={18} className="text-primary" /> Inbox
            </h3>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-main)' }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.25rem', padding: '0.5rem 0.5rem 0.5rem 2.25rem', fontSize: '0.85rem', width: '100%' }}
              />
            </div>
          </div>

          {/* Conversation list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredConversations.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                No conversations yet.<br />Connect with users from Network Search.
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isActive = selectedUser === conv.partner;
                const isLastFromMe = conv.lastSender === currentUser?.username;
                return (
                  <div
                    key={conv.partner}
                  onClick={() => selectConversation(conv.partner)}
                    style={{
                      padding: '0.85rem 1rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--surface-highlight)',
                      background: isActive ? 'rgba(255,106,0,0.08)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
                      transition: 'all 0.15s',
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'center'
                    }}
                  >
                    {/* Avatar */}
                    <div className="avatar" style={{ width: '38px', height: '38px', fontSize: '0.85rem', flexShrink: 0 }}>
                      {conv.partner?.substring(0, 2).toUpperCase()}
                    </div>
                    {/* Text preview */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: conv.unreadCount > 0 ? '700' : '600', color: conv.unreadCount > 0 ? 'var(--text-heading)' : 'var(--text-heading)', fontSize: '0.9rem' }}>{conv.partner}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-main)' }}>{formatTime(conv.timestamp)}</span>
                          {conv.unreadCount > 0 && (
                            <span style={{
                              background: 'var(--primary-color)',
                              color: '#fff',
                              borderRadius: '999px',
                              fontSize: '0.65rem',
                              fontWeight: 'bold',
                              padding: '0.1rem 0.4rem',
                              minWidth: '18px',
                              textAlign: 'center',
                              lineHeight: '1.5',
                              boxShadow: '0 0 6px var(--primary-glow)'
                            }}>{conv.unreadCount}</span>
                          )}
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: conv.unreadCount > 0 ? 'var(--text-heading)' : 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: conv.unreadCount > 0 ? '500' : 'normal' }}>
                        {isLastFromMe ? 'You: ' : ''}{conv.lastMessage}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: Active Chat Thread */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          {selectedUser ? (
            <>
              {/* Chat header */}
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--surface-highlight)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '0.8rem' }}>
                    {selectedUser?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>{selectedUser}</h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-color)', fontFamily: 'var(--font-mono)' }}>● ONLINE</span>
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>[ ENCRYPTED ]</span>
              </div>

              {/* Messages */}
              <div ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-main)', opacity: 0.5, marginTop: '3rem', fontSize: '0.9rem' }}>
                    No messages yet. Say hello!
                  </div>
                )}
                {messages.map((msg, idx) => {
                  const isMe = msg.sender === currentUser?.username;
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        background: isMe ? 'var(--primary-color)' : 'var(--overlay-bg)',
                        padding: '0.65rem 1rem',
                        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        maxWidth: '68%',
                        border: !isMe ? '1px solid var(--overlay-border)' : 'none',
                        lineHeight: '1.5',
                        fontSize: '0.9rem'
                      }}>
                        {msg.text}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-main)', marginTop: '0.2rem', opacity: 0.6 }}>
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <div style={{ padding: '0.85rem 1rem', borderTop: '1px solid var(--surface-highlight)', display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder={`Message ${selectedUser}...`}
                  style={{ flex: 1 }}
                />
                <button className="btn-primary" onClick={handleSend} style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-main)' }}>
              <UserCircle2 size={64} opacity={0.2} />
              <p style={{ opacity: 0.5 }}>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;
