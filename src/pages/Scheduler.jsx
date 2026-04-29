import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar as CalendarIcon } from 'lucide-react';

function Scheduler() {
  const events = [
    { title: 'React Session w/ Jane', start: new Date().toISOString().split('T')[0] + 'T10:00:00', end: new Date().toISOString().split('T')[0] + 'T11:00:00' },
    { title: 'CSS Layouts w/ Alex', start: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0] + 'T14:00:00', end: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0] + 'T15:00:00' }
  ];

  return (
    <div className="scheduler-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarIcon className="text-primary" size={32} />
          <h1 style={{ margin: 0 }}>Smart Scheduler</h1>
        </div>
        <p>Global timezone synchronized grid coordination.</p>
      </header>

      <div className="card glass" style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, minHeight: '500px' }}>
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
            slotMinTime="08:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={false}
          />
        </div>
      </div>
    </div>
  );
}

export default Scheduler;
