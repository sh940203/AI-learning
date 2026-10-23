import React, { useCallback, useEffect, useRef, useState } from 'react';
import LogoMark from './LogoMark';
import logoUrl from '../../assets/logo.png';
import styles from './LogoIntro.module.css';

// 開場時間軸 (ms)，總長約 2.9 秒：
// 底部節點亮起 → 訊號沿電路往上、節點彈出 → 盾牌外框描出 → 箭頭衝出 → 換成 PNG 原圖 → 縮進主視覺卡片
const TIMELINE = [
  ['lit', 50],
  ['flow', 300],
  ['guard', 1300],
  ['launch', 2000],
  ['settle', 2350],
  ['leave', 2600]
];
const FINISH_AT = 2950;

// 首頁歡迎動畫：以 MIND SYNC logo 的電路與盾牌線條描繪成形
// targetRef 指向首頁主視覺卡片中的 logo 圖片，結束時把 logo 移過去銜接
// onReveal / onFinish 需由父層以 useCallback 固定，否則會重設開場計時器
const LogoIntro = ({ targetRef, onReveal, onFinish }) => {
  const [step, setStep] = useState(-1);
  const [leaveStyle, setLeaveStyle] = useState(null);
  const markRef = useRef(null);
  const skipRef = useRef(null);
  const finishedRef = useRef(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onReveal();
    onFinish();
  }, [onReveal, onFinish]);

  useEffect(() => {
    skipRef.current?.focus();
    const timers = TIMELINE.map(([, at], i) => setTimeout(() => setStep(i), at));
    timers.push(setTimeout(finish, FINISH_AT));

    const handleKey = (e) => {
      if (e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('keydown', handleKey);
    };
  }, [finish]);

  const isLeaving = step === TIMELINE.length - 1;

  // 離場：計算位移讓開場的 logo 剛好疊到主視覺卡片的 logo 上，同時讓首頁內容浮現
  useEffect(() => {
    if (!isLeaving) return;
    onReveal();
    const mark = markRef.current;
    const from = mark?.getBoundingClientRect();
    const to = targetRef.current?.getBoundingClientRect();
    if (!from || !to) return;
    const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
    const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
    // 卡片中的 logo 以 object-fit: contain 置中，比例相同時以高度對齊
    setLeaveStyle({ transform: `translate(${dx}px, ${dy}px) scale(${to.height / mark.offsetHeight})` });
  }, [isLeaving, targetRef, onReveal]);

  // 已經過的階段全部保留 class，讓前面畫好的線條維持顯示
  const phaseClasses = TIMELINE.slice(0, step + 1).map(([name]) => styles[name]).join(' ');

  return (
    <div className={`${styles.overlay} ${phaseClasses}`} onClick={finish}>
      <button
        ref={skipRef}
        type="button"
        className={styles.skipBtn}
        onClick={(e) => { e.stopPropagation(); finish(); }}
      >
        略過
      </button>

      <div className={styles.mark} ref={markRef} style={leaveStyle}>
        <LogoMark
          className={styles.markSvg}
          classes={{
            hex: styles.hex,
            trace: styles.trace,
            shield: styles.shieldLine,
            bars: styles.bars,
            arrowHead: styles.arrowHead,
            node: styles.node
          }}
        />
        <img src={logoUrl} alt="" className={styles.markImg} />
        <span className={styles.flash} aria-hidden="true" />
      </div>
      <div className={styles.name} aria-hidden="true">MIND SYNC</div>
    </div>
  );
};

export default LogoIntro;
