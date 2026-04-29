import { useState } from 'react';
import { Search as SearchIcon, Filter, Stethoscope, Calculator, Palette } from 'lucide-react';

function Search() {
  const [query, setQuery] = useState('');

  const users = [
    { id: 1, name: 'Dr. Rivera', category: 'Medical', offers: 'Medical First Aid', needs: 'Web Development', icon: <Stethoscope size={18} /> },
    { id: 2, name: 'Alex Smith', category: 'Maths', offers: 'Advanced Calculus', needs: 'Figma Prototyping', icon: <Calculator size={18} /> },
    { id: 3, name: 'Mia Lin', category: 'Arts', offers: 'Digital Illustration', needs: 'React Basics', icon: <Palette size={18} /> },
    { id: 4, name: 'Marcus', category: 'Maths', offers: 'Data Science', needs: 'System Architecture', icon: <Calculator size={18} /> },
    { id: 5, name: 'Sarah', category: 'Arts', offers: 'UI/UX Design', needs: 'Advanced CSS', icon: <Palette size={18} /> }
  ];

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(query.toLowerCase()) || 
    user.offers.toLowerCase().includes(query.toLowerCase()) ||
    user.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="search-container" style={{ maxWidth: '1000px' }}>
      <header className="page-header">
        <h1>Global Network Search</h1>
        <p>Find your next skill swap across diverse disciplines.</p>
      </header>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <SearchIcon style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-main)' }} size={20} />
          <input 
            type="text" 
            placeholder="Search by name, skill, or field (e.g. Maths, Arts, Medical)..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: '3rem' }}
          />
        </div>
        <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} /> Filters
        </button>
      </div>

      <div className="search-results" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {filteredUsers.map(user => (
          <div key={user.id} className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '0.9rem' }}>
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{user.name}</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary-color)', fontSize: '0.8rem', background: 'var(--overlay-bg)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                {user.icon} {user.category}
              </div>
            </div>
            <div style={{ fontSize: '0.9rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}><strong style={{ color: 'var(--accent-color)' }}>Offers:</strong> {user.offers}</p>
              <p style={{ margin: 0, color: 'var(--text-main)' }}><strong style={{ color: 'var(--text-heading)' }}>Needs:</strong> {user.needs}</p>
            </div>
            <button className="btn-primary" style={{ marginTop: 'auto', padding: '0.5rem' }}>Connect</button>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-main)' }}>
            No matching nodes found on the grid.
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;
