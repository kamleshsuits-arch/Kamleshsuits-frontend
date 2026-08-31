import React from 'react';

const makeWaveFrame = (baseline, amplitude) => {
  const crest = baseline - amplitude;
  const trough = baseline + amplitude;
  return `M0 ${baseline} C120 ${crest} 240 ${crest} 360 ${baseline} C480 ${trough} 600 ${trough} 720 ${baseline} C840 ${crest} 960 ${crest} 1080 ${baseline} C1200 ${trough} 1320 ${trough} 1440 ${baseline} L1440 220 L0 220 Z`;
};

const makeFrames = (baseline, amplitudes) => {
  const frames = amplitudes.map(([offset, amplitude]) => makeWaveFrame(baseline + offset, amplitude));
  return [...frames, frames[0]];
};

const WAVE_FRAMES = {
  back: makeFrames(94, [[0, 52], [6, 70], [-3, 58]]),
  middle: makeFrames(120, [[0, 42], [-6, 57], [4, 48]]),
  front: makeFrames(146, [[0, 30], [4, 43], [-3, 36]]),
};

const COLOR_PROFILES = {
  new: {
    back: [['0%', '#22D3EE', 0.12], ['46%', '#A78BFA', 0.46], ['100%', '#38BDF8', 0.14]],
    middle: [['0%', '#C4B5FD', 0.22], ['50%', '#67E8F9', 0.7], ['100%', '#DDD6FE', 0.24]],
    front: [['0%', '#F8FAFC', 0.96], ['50%', '#ECFEFF', 1], ['100%', '#F5F3FF', 0.96]],
  },
  sale: {
    back: [['0%', '#FB7185', 0.16], ['48%', '#FDBA74', 0.5], ['100%', '#E879F9', 0.16]],
    middle: [['0%', '#F0ABFC', 0.26], ['50%', '#FED7AA', 0.74], ['100%', '#FDA4AF', 0.26]],
    front: [['0%', '#FFF7ED', 0.96], ['50%', '#FFFFFF', 1], ['100%', '#FDF2F8', 0.96]],
  },
};

const AnimatedPath = ({ frames, translate = false, duration }) => (
  <path d={frames[0]} transform={translate ? 'translate(1440 0)' : undefined}>
    <animate
      attributeName="d"
      dur={duration}
      repeatCount="indefinite"
      calcMode="spline"
      keyTimes="0;0.333;0.666;1"
      keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1"
      values={frames.join(';')}
    />
  </path>
);

const WaveStrip = ({ frames, className, gradientId, colors, duration }) => (
  <svg className={className} viewBox="0 0 2880 220" preserveAspectRatio="none">
    <defs>
      <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
        {colors.map(([offset, color, opacity]) => <stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />)}
      </linearGradient>
    </defs>
    <g fill={`url(#${gradientId})`}>
      <AnimatedPath frames={frames} duration={duration} />
      <AnimatedPath frames={frames} duration={duration} translate />
    </g>
  </svg>
);

const FuturisticWaves = ({ idPrefix, variant }) => {
  const colors = COLOR_PROFILES[variant] || COLOR_PROFILES.new;
  return (
    <div className={`futuristic-wave-scene futuristic-wave-scene-${variant}`} aria-hidden="true">
      <div className="futuristic-horizon" />
      <WaveStrip frames={WAVE_FRAMES.back} duration="7.8s" className="futuristic-wave futuristic-wave-back" gradientId={`${idPrefix}-wave-back`} colors={colors.back} />
      <WaveStrip frames={WAVE_FRAMES.middle} duration="6.4s" className="futuristic-wave futuristic-wave-middle" gradientId={`${idPrefix}-wave-middle`} colors={colors.middle} />
      <WaveStrip frames={WAVE_FRAMES.front} duration="5.2s" className="futuristic-wave futuristic-wave-front" gradientId={`${idPrefix}-wave-front`} colors={colors.front} />
    </div>
  );
};

export default FuturisticWaves;
