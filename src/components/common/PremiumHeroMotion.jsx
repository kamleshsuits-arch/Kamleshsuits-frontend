import React from 'react';

const PremiumHeroMotion = ({ variant }) => (
  <div className={`premium-hero-motion premium-hero-motion-${variant}`} aria-hidden="true">
    <span className="premium-hero-grid" />
    <span className="premium-hero-aurora premium-hero-aurora-one" />
    <span className="premium-hero-aurora premium-hero-aurora-two" />
    <span className="premium-hero-orbit premium-hero-orbit-large" />
    <span className="premium-hero-orbit premium-hero-orbit-small" />
    <span className="premium-hero-glass-orb premium-hero-glass-orb-one" />
    <span className="premium-hero-glass-orb premium-hero-glass-orb-two" />
    <span className="premium-hero-sweep" />
  </div>
);

export default PremiumHeroMotion;
