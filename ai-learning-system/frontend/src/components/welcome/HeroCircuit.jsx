import React from 'react';
import styles from './HeroCircuit.module.css';

// 首頁主視覺背景：從盾牌 logo 往外延伸的電路線 (座標以 600×500 畫布、logo 置中 220×281 為準)
const LINES = [
  { d: 'M410,200 L470,200 L510,160 L600,160', end: [600, 160], spark: true },
  { d: 'M404,300 L460,356 L570,356', end: [570, 356], spark: false },
  { d: 'M190,215 L120,215 L80,175 L0,175', end: [0, 175], spark: true },
  { d: 'M198,318 L140,376 L50,376', end: [50, 376], spark: false },
  { d: 'M300,112 L300,60 L350,10', end: [350, 10], spark: false },
  { d: 'M262,390 L262,440 L212,490', end: [212, 490], spark: true }
];

// drawn = true 時電路線開始往外描出 (開場結束後由首頁開啟)
const HeroCircuit = ({ drawn }) => (
  <svg
    className={`${styles.circuit} ${drawn ? styles.drawn : ''}`}
    viewBox="0 0 600 500"
    aria-hidden="true"
  >
    {LINES.map(({ d, end }, i) => (
      <g key={d} style={{ '--i': i }}>
        <path className={styles.line} d={d} pathLength="1" />
        <circle className={styles.node} cx={end[0]} cy={end[1]} r="4" />
      </g>
    ))}
    {LINES.filter(line => line.spark).map(({ d }, i) => (
      <path key={`spark-${d}`} className={styles.spark} d={d} pathLength="1" style={{ '--i': i }} />
    ))}
  </svg>
);

export default HeroCircuit;
