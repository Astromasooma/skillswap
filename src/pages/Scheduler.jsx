import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar as CalendarIcon, Plus, X, User, Clock, Info } from 'lucide-react';

function Scheduler({ currentUser }) {
  const [events, setEvents] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [showBooking, setShowBooking] = useState(false);
  const [formData, setFormData] = useState({ partner: '', start: '', end: '', title: '', description: '' });
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!currentUser?.username) return;
    try {
      // Fetch connections
      const connRes = await fetch(`/api/connections/accepted/${currentUser.username}`);
      const connData = await connRes.json();
      setConnectedUsers(Array.isArray(connData) ? connData : []);

      // Fetch meetings
      const meetRes = await fetch(`/api/meetings/${currentUser.username}`);
      const meetData = await meetRes.json();
      const formatted = meetData.map(m => ({
        id: m.id,
        title: m.title || `Session with ${m.partner === currentUser.username ? m.creator : m.partner}`,
        start: m.start,
        end: m.end,
        extendedProps: { ...m }
      }));
      setEvents(formatted);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/meetings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, creator: currentUser.username })
      });
      if (res.ok) {
        setShowBooking(false);
        setFormData({ partner: '', start: '', end: '', title: '', description: '' });
        fetchData();
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="scheduler-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarIcon className="text-primary" size={32} />
            <h1 style={{ margin: 0 }}>Smart Scheduler</h1>
          </div>
          <p>Global timezone synchronized grid coordination.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowBooking(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Book Session
        </button>
      </header>

      <div className="card glass" style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
        <FullCalendar
          plugins={[ dayGridPlugin, timeGridPlugin, interactionPlugin ]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={events}
          height="100%"
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={false}
          nowIndicator={true}
          themeSystem="standard"
        />
      </div>

      {showBooking && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card glass" style={{ width: '450px', padding: '2rem', position: 'relative' }}>
            <button style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setShowBooking(false)}>
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus className="text-primary" /> Book a Meeting
            </h2>
            <form onSubmit={handleBooking}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Select Connected Peer</label>
                <select value={formData.partner} onChange={e => setFormData({...formData, partner: e.target.value})} required style={{ width: '100%', padding: '0.75rem' }}>
                  <option value="">Choose a user...</option>
                  {connectedUsers.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Session Title</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. React Mentorship" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Start Time</label>
                  <input type="datetime-local" value={formData.start} onChange={e => setFormData({...formData, start: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>End Time</label>
                  <input type="datetime-local" value={formData.end} onChange={e => setFormData({...formData, end: e.target.value})} required />
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Description</label>
                <textarea rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Session details..."></textarea>
              </div>
              <button className="btn-primary" style={{ width: '100%', padding: '0.85rem' }} disabled={loading}>
                {loading ? 'Confirming...' : 'Add to Calendar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Scheduler;

