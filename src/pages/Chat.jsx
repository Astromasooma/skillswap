import { useState } from 'react';
import { MessageSquare, Mic, FileText, Send } from 'lucide-react';

function Chat() {
  const [transcribing, setTranscribing] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'Jane', text: 'Hey, ready for the React session?' },
    { sender: 'You', text: 'Yes! Booting up the dev server now.' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: 'You', text: input }]);
    setInput('');
  };

  const toggleTranscription = () => {
    setTranscribing(!transcribing);
  };

  return (
    <div className="chat-container" style={{ height: '100%', display: 'flex', flexDirection: 'column', maxWidth: '1000px' }}>
      <header className="page-header" style={{ marginBottom: '1rem' }}>
        <h1>Comms Line</h1>
        <p>Direct peer-to-peer connection stream.</p>
      </header>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, overflow: 'hidden' }}>
        <div className="card" style={{ flex: 2, display: 'flex', flexDirection: 'column', padding: 0 }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--surface-highlight)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare className="text-primary" /> Session w/ Jane
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-color)', fontFamily: 'var(--font-mono)' }}>[ ENCRYPTED ]</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ 
                alignSelf: msg.sender === 'You' ? 'flex-end' : 'flex-start',
                background: msg.sender === 'You' ? 'var(--primary-color)' : 'var(--overlay-bg)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                maxWidth: '70%',
                border: msg.sender !== 'You' ? '1px solid var(--overlay-border)' : 'none'
              }}>
                <span style={{ fontSize: '0.7rem', opacity: 0.8, display: 'block', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>{msg.sender}</span>
                {msg.text}
              </div>
            ))}
          </div>

          <div style={{ padding: '1rem', borderTop: '1px solid var(--surface-highlight)', display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Transmit message..." 
              style={{ flex: 1 }}
            />
            <button className="btn-primary" onClick={handleSend} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Send size={18} />
            </button>
          </div>
        </div>

        <div className="card glass" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <FileText className="text-accent" /> Live Transcriber (Multimodal AI)
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '1.5rem' }}>
            Converts voice to structured study notes in real-time.
          </p>

          <div style={{ 
            flex: 1, 
            background: 'var(--input-bg)', 
            border: '1px solid var(--overlay-border)', 
            borderRadius: '8px', 
            padding: '1rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            color: 'var(--accent-color)',
            overflowY: 'auto'
          }}>
            {transcribing ? (
              <div className="typing-indicator">
                [AI]: Analyzing audio stream...<br/>
                &gt; "So the useEffect hook..."<br/>
                &gt; "Takes a dependency array..."
              </div>
            ) : (
              <div style={{ color: 'var(--text-main)', opacity: 0.5, textAlign: 'center', marginTop: '2rem' }}>
                Transcription Offline
              </div>
            )}
          </div>

          <button 
            className={transcribing ? "btn-primary" : "btn-outline"} 
            onClick={toggleTranscription} 
            style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
          >
            <Mic size={18} /> {transcribing ? 'Stop Listening' : 'Start Transcriber'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
