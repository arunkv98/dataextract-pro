import React from 'react';
import { Link } from 'react-router-dom';
import type { BP } from '../types/bp';
interface BPCardProps {
  bp: BP;
}

export function BPCard({ bp }: BPCardProps) {
  const featureIcons = ['📄', '📋', '⚡'];
  const linkUrl = bp.id === 1 ? '/pdf-extraction' : '#';

  return (
    <div className="bp-card" style={{ '--bp-color': bp.color } as React.CSSProperties}>
      <div className="bp-icon-wrapper" style={{ background: `${bp.color}15` }}>
        <span className="bp-icon">{bp.icon}</span>
      </div>
      <h3 className="bp-name">{bp.name}</h3>
      <p className="bp-desc">{bp.description}</p>
      <div className="bp-features">
        {bp.features.map((feature, i) => (
          <div key={i} className="bp-feature">
            <span className="bp-feature-icon">{featureIcons[i]}</span>
            <span>{feature}</span>
          </div>
        ))}
      </div>
      <Link 
        to={linkUrl} 
        className="bp-button" 
        style={{ background: bp.color }}
      >
        {bp.buttonText} →
      </Link>
    </div>
  );
}
