import React, { useState } from 'react';
import './Auth.css';

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass">
        <div className="auth-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <h1 className="auth-title" style={{ fontSize: '2.5rem', fontWeight: 'bold', letterSpacing: '2px', background: 'linear-gradient(90deg, var(--primary-color), var(--accent-color))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>SkillSwap</h1>
          <p className="auth-subtitle">
            {isLogin ? 'Welcome back! Please login to your account.' : 'Create an account to join the network.'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="Enter your email" required />
            </div>
          )}
          <div className="form-group">
            <label>Username</label>
            <input type="text" placeholder="Enter your username" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Enter your password" required />
          </div>

          {isLogin && (
            <div className="auth-options">
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>
          )}

          <button type="submit" className="btn-primary auth-submit">
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button className="btn-outline gmail-login" onClick={onLogin}>
          <svg className="gmail-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Login with Gmail
        </button>

        <div className="auth-footer">
          {isLogin ? (
            <p>New to SkillSwap? <span className="auth-link" onClick={() => setIsLogin(false)}>Sign up</span></p>
          ) : (
            <p>Already have an account? <span className="auth-link" onClick={() => setIsLogin(true)}>Login</span></p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;
