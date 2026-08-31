import React from 'react';

// Every strip has matching start/end height for a seamless loop, but a
// deliberately different silhouette so the layers never collapse together.
const backWavePath = 'M0 96 C120 52 245 46 365 91 C500 142 605 151 730 101 C850 53 975 45 1090 87 C1210 131 1325 140 1440 96 L1440 200 L0 200 Z';
const middleWavePath = 'M0 116 C95 80 205 74 310 111 C420 150 525 146 625 106 C735 62 835 70 935 116 C1040 164 1145 157 1245 119 C1320 91 1380 92 1440 116 L1440 200 L0 200 Z';
const frontWavePath = 'M0 132 C155 90 295 96 435 137 C585 181 720 176 865 128 C1010 80 1155 92 1280 137 C1345 160 1395 151 1440 132 L1440 200 L0 200 Z';

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
      path={backWavePath}
      className="futuristic-wave futuristic-wave-back"
      gradientId={`${idPrefix}-wave-back`}
      colors={[["0%", "#f9a8d4", 0.14], ["50%", "#f5d0fe", 0.34], ["100%", "#fb7185", 0.14]]}
    />
    <WaveStrip
      path={middleWavePath}
      className="futuristic-wave futuristic-wave-middle"
      gradientId={`${idPrefix}-wave-middle`}
      colors={[["0%", "#fff1f2", 0.22], ["48%", "#fbcfe8", 0.62], ["100%", "#fdf2f8", 0.24]]}
    />
    <WaveStrip
      path={frontWavePath}
      className="futuristic-wave futuristic-wave-front"
      gradientId={`${idPrefix}-wave-front`}
      colors={[["0%", "#ffffff", 0.94], ["45%", "#fff7fb", 1], ["100%", "#ffffff", 0.94]]}
    />
  </div>
);

export default FuturisticWaves;
