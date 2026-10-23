import React, { useEffect, useRef, useState } from 'react';
import { LOGO_VIEWBOX, LOGO_PATHS } from './logoPaths';
import styles from './LogoSignal.module.css';

// 疊在首頁 logo 圖片上的光點層：每隔一段時間有一顆光點沿電路跑到箭頭尖端
// 與 <img object-fit: contain> 同框同 viewBox，座標會與 PNG 對齊
const LogoSignal = () => {
  const ref = useRef(null);
  const [inView, setInView] = useState(true);
  const [pageHidden, setPageHidden] = useState(() => typeof document !== 'undefined' && document.hidden);

  // 捲出畫面或切到其他分頁時暫停
  useEffect(() => {
    const handleVisibility = () => setPageHidden(document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);

    let observer;
    if ('IntersectionObserver' in window && ref.current) {
      observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
      observer.observe(ref.current);
    }
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      observer?.disconnect();
    };
  }, []);

  return (
    <svg
      ref={ref}
      viewBox={LOGO_VIEWBOX}
      className={`${styles.signal} ${!inView || pageHidden ? styles.paused : ''}`}
      aria-hidden="true"
    >
      <path className={styles.glow} d={LOGO_PATHS.signal} pathLength="1" />
      <path className={styles.spark} d={LOGO_PATHS.signal} pathLength="1" />
    </svg>
  );
};

export default LogoSignal;
