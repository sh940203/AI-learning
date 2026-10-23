import React from 'react';
import { LOGO_VIEWBOX, LOGO_COLOR, LOGO_PATHS } from './logoPaths';

// 可描繪的線稿：classes 由使用端 (LogoIntro) 傳入，用來控制每一組的動畫
const LogoMark = ({ classes = {}, className = '' }) => (
  <svg viewBox={LOGO_VIEWBOX} className={className} aria-hidden="true">
    <g fill="none" stroke={LOGO_COLOR} strokeWidth="30" strokeLinecap="round" strokeLinejoin="round">
      <path className={classes.hex} d={LOGO_PATHS.hex} pathLength="1" />
      {LOGO_PATHS.traces.map((d, i) => (
        <path key={d} className={classes.trace} d={d} pathLength="1" style={{ '--i': i }} />
      ))}
      {LOGO_PATHS.shield.map((d, i) => (
        <path key={d} className={classes.shield} d={d} pathLength="1" style={{ '--i': i < 2 ? 0 : 1 }} />
      ))}
      <path className={classes.bars} d={LOGO_PATHS.bars} pathLength="1" />
      <path className={classes.arrowHead} d={LOGO_PATHS.arrowHead} pathLength="1" />
    </g>
    {LOGO_PATHS.nodes.map(([cx, cy], i) => (
      <circle
        key={`${cx}-${cy}`}
        className={classes.node}
        cx={cx}
        cy={cy}
        r="46"
        fill="#ffffff"
        stroke={LOGO_COLOR}
        strokeWidth="28"
        style={{ '--i': i }}
      />
    ))}
  </svg>
);

export default LogoMark;
