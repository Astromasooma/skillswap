import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

function Layout({ onLogout, currentUser }) {
  return (
    <div className="app-container">
      <Sidebar onLogout={onLogout} currentUser={currentUser} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
