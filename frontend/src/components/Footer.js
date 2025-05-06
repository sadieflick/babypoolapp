import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="venmo-section">
          <p>Like this app? Buy me a coffee.</p>
          <div className="venmo-qr">
            <img src="/static/venmo_qr.svg" alt="Venmo QR Code" />
            <p>Venmo Sadie Flick @Sadie-Flick</p>
          </div>
        </div>
        <div className="copyright">
          <p>&copy; {new Date().getFullYear()} Baby Pool</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
