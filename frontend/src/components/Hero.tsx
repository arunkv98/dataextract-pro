import React from 'react';

export function Hero() {
  return (
    <section className="hero">
      <div className="container hero-inner">
        <div className="hero-content">
          <p className="hero-tagline">EXTRACT. PROCESS. GET INSIGHTS.</p>
          <h1 className="hero-title">Welcome to <span className="text-blue">AI Invoice Extraction</span></h1>
          <p className="hero-desc">Upload your documents and let AI extract the important information — quickly, accurately, and securely.</p>
        </div>
        <div className="hero-visual">
          <div className="hero-illustration">
            <div className="doc-icon">📄</div>
            <div className="scan-lines"></div>
            <div className="extracted-badge">
              <span className="badge-title">Extracted Data</span>
              <div className="badge-items">
                <div className="badge-item"><span className="check">✓</span> <span>Invoice Number</span></div>
                <div className="badge-item"><span className="check">✓</span> <span>Line Items</span></div>
                <div className="badge-item"><span className="check">✓</span> <span>Tax Details</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
