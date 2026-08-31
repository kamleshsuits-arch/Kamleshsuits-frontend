import React from 'react';

const wavePath = 'M0 92 C160 28 310 34 480 96 C650 158 820 164 980 94 C1140 24 1280 26 1440 92 L1440 200 L0 200 Z';
const fineWavePath = 'M0 118 C180 72 330 66 500 112 C670 158 820 164 1000 110 C1180 56 1320 68 1440 118 L1440 200 L0 200 Z';

const WaveStrip = ({ path, className, gradientId, colors }) => (
  <svg className={className} viewBox="0 0 2880 200" preserveAspectRatio="none">
    <defs>
      <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
        {colors.map(([offset, color, opacity]) => <stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />)}
      </linearGradient>
    </defs>
    <path d={path} fill={`url(#${gradientId})`} />
    <path d={path} transform="translate(1440 0)" fill={`url(#${gradientId})`} />
  </svg>
);

const FuturisticWaves = ({ idPrefix }) => (
  <div className="futuristic-wave-scene" aria-hidden="true">
    <div className="futuristic-horizon" />
    <WaveStrip
      path={wavePath}
      className="futuristic-wave futuristic-wave-back"
      gradientId={`${idPrefix}-wave-back`}
      colors={[["0%", "#f9a8d4", 0.14], ["50%", "#f5d0fe", 0.34], ["100%", "#fb7185", 0.14]]}
    />
    <WaveStrip
      path={fineWavePath}
      className="futuristic-wave futuristic-wave-middle"
      gradientId={`${idPrefix}-wave-middle`}
      colors={[["0%", "#fff1f2", 0.22], ["48%", "#fbcfe8", 0.62], ["100%", "#fdf2f8", 0.24]]}
    />
    <WaveStrip
      path={wavePath}
      className="futuristic-wave futuristic-wave-front"
      gradientId={`${idPrefix}-wave-front`}
      colors={[["0%", "#ffffff", 0.94], ["45%", "#fff7fb", 1], ["100%", "#ffffff", 0.94]]}
    />
  </div>
);

export default FuturisticWaves;
