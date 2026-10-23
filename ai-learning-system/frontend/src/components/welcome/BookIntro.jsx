import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Layers } from 'lucide-react';
import { BookPages } from './BookStage';
import stageStyles from './BookStage.module.css';
import styles from './BookIntro.module.css';

// 開場的題目卡：x / y 為散開時的位置 (相對畫面中心)，r 為旋轉角度
const QUESTION_CARDS = [
  { no: 3, text: 'ASCII 碼中…', x: -300, y: -170, r: -35 },
  { no: 7, text: '二進位 1011…', x: 290, y: -150, r: 28 },
  { no: 12, text: '通訊協定…', x: -280, y: 170, r: 22 },
  { no: 18, text: '作業系統…', x: 300, y: 160, r: -24 },
  { no: 21, text: '資料處理…', x: 0, y: -250, r: 12 }
];

// 開場時間軸 (ms)，總長約 3.5 秒：
// 卡片飛入 → 疊在一起 → 變成攤開的書 → 封面闔上顯示品牌 → 封面翻開、書本移到左欄
const TIMELINE = [
  ['fly', 50],
  ['stack', 500],
  ['book', 1400],
  ['cover', 1900],
  ['open', 2900],
  ['leave', 3300]
];
const FINISH_AT = 3700;

// 登入頁歡迎動畫：題目卡片翻飛後疊成一本書
// targetRef 指向 BookStage 的書本，結束時把書本移過去銜接循環畫面
// onReveal / onFinish 需由父層以 useCallback 固定，否則會重設開場計時器
const BookIntro = ({ targetRef, onReveal, onFinish }) => {
  const [phase, setPhase] = useState('start');
  const [leaveStyle, setLeaveStyle] = useState(null);
  const bookRef = useRef(null);
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
    const timers = TIMELINE.map(([name, at]) => setTimeout(() => setPhase(name), at));
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

  // 離場：計算位移讓開場的書本剛好疊到 BookStage 的書本上，同時讓登入卡滑入
  useEffect(() => {
    if (phase !== 'leave') return;
    onReveal();
    const book = bookRef.current;
    const from = book?.getBoundingClientRect();
    const to = targetRef.current?.getBoundingClientRect();
    if (!from || !to) return;
    const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
    const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
    // 以未縮放的寬度 (offsetWidth) 計算比例：手機版書本本身已有 scale
    setLeaveStyle({ transform: `translate(${dx}px, ${dy}px) scale(${to.width / book.offsetWidth})` });
  }, [phase, targetRef, onReveal]);

  return (
    <div className={`${styles.overlay} ${styles[phase]}`} onClick={finish}>
      <button
        ref={skipRef}
        type="button"
        className={styles.skipBtn}
        onClick={(e) => { e.stopPropagation(); finish(); }}
      >
        略過
      </button>

      {QUESTION_CARDS.map((card, i) => (
        <div
          key={card.no}
          className={styles.questionCard}
          style={{
            '--card-x': card.x,
            '--card-y': card.y,
            '--card-r': card.r,
            '--stack-r': (i - 2) * 2,
            transitionDelay: `${i * 60}ms`
          }}
          aria-hidden="true"
        >
          <b>第 {card.no} 題</b>
          {card.text}
          <i />
          <i style={{ width: '65%' }} />
        </div>
      ))}

      <div className={styles.scene} aria-hidden="true">
        <div className={`${stageStyles.book} ${styles.bookMove}`} ref={bookRef} style={leaveStyle}>
          <BookPages />
          <div className={styles.bookCover}>
            <span className={styles.coverIcon}><Layers size={22} /></span>
            <span>AI智能輔助</span>
            <span>自主學習系統</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookIntro;
