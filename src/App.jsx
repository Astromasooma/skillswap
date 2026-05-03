import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Overview from './pages/Overview';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import Scheduler from './pages/Scheduler';
import Chat from './pages/Chat';
import Connections from './pages/Connections';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  });

  const handleLogin = (user) => {
    localStorage.setItem('isAuthenticated', 'true');
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      setCurrentUser(user);
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/login" element={<Auth onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <Route element={<Layout onLogout={handleLogout} currentUser={currentUser} />}>
            <Route path="/" element={<Overview currentUser={currentUser} />} />
            <Route path="/search" element={<Search currentUser={currentUser} />} />
            <Route path="/connections" element={<Connections currentUser={currentUser} />} />
            <Route path="/profile" element={<Profile currentUser={currentUser} />} />
            <Route path="/wallet" element={<Wallet currentUser={currentUser} />} />
            <Route path="/scheduler" element={<Scheduler currentUser={currentUser} />} />
            <Route path="/chat" element={<Chat currentUser={currentUser} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </Router>
  );
}


export default App;
