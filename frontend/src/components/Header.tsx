import React from 'react';

export function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <div className="header-left">
          <a href="/" className="logo">
            <span className="logo-icon">📄</span>
            <span className="logo-text">AI Invoice Extraction</span>
          </a>
        </div>
        <nav className="nav">
          <a href="/" className="nav-link active">
            <span className="nav-icon">🏠</span>
            Home
          </a>
        </nav>
        <div className="header-right">
          <button className="notification-btn">🔔</button>
          <button className="user-btn">👤</button>
        </div>
      </div>
    </header>
  );
}
