import React from 'react';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <p className="footer-copyright">© 2025 AI invoice extraction. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">Help</a>
          <span className="footer-divider">|</span>
          <a href="#">Privacy</a>
          <span className="footer-divider">|</span>
          <a href="#">Terms</a>
        </div>
      </div>
    </footer>
  );
}
