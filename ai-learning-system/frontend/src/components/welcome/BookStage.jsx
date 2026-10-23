import React, { useEffect, useState } from 'react';
import styles from './BookStage.module.css';

// 書本裡飛出的小卡：代表 AI 由錯題產生的新內容 (x / y 為飛出終點，相對書本中心)
const FLY_CARDS = [
  { label: 'ASCII 碼 ✓', x: -190, y: -120, r: -12 },
  { label: '新仿題 +1', x: 190, y: -110, r: 10 },
  { label: '錯題複習', x: -160, y: 130, r: 8 }
];

// 攤開的兩頁書 (BookIntro 開場與 BookStage 循環畫面共用)
export const BookPages = () => (
  <>
    <div className={`${styles.page} ${styles.pageLeft}`}>
      <span className={styles.pageTitle}>數位科技概念</span>
      <i className={styles.line} />
      <i className={styles.line} style={{ width: '80%' }} />
      <i className={styles.line} />
      <i className={styles.line} style={{ width: '55%' }} />
    </div>
    <div className={`${styles.page} ${styles.pageRight}`}>
      <span className={styles.pageMastery}>掌握度 78%</span>
      <span className={styles.masteryBar}><span /></span>
      <i className={styles.line} />
      <i className={styles.line} style={{ width: '70%' }} />
      <i className={styles.line} style={{ width: '40%' }} />
    </div>
  </>
);

// 登入頁左欄的循環畫面：書頁緩慢翻動、書中飛出題目小卡
// bookRef 讓 BookIntro 開場結束時能把書本移到這裡的位置
const BookStage = ({ bookRef, isStatic = false }) => {
  // 切到其他分頁時暫停動畫，省電
  const [paused, setPaused] = useState(() => typeof document !== 'undefined' && document.hidden);

  useEffect(() => {
    const handleVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return (
    <div className={`${styles.stage} ${isStatic ? styles.static : ''} ${paused ? styles.paused : ''}`}>
      <div className={styles.scene} aria-hidden="true">
        <div className={styles.book} ref={bookRef}>
          <BookPages />
          <div className={styles.flipPage} />
          {FLY_CARDS.map((card, i) => (
            <span
              key={card.label}
              className={styles.flyCard}
              style={{
                '--fly-x': `${card.x}px`,
                '--fly-y': `${card.y}px`,
                '--fly-r': `${card.r}deg`,
                animationDelay: `calc(var(--duration-card-fly) / ${FLY_CARDS.length} * ${i})`
              }}
            >
              {card.label}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.tagline}>
        <h2>把每一道錯題，寫成你的專屬課本</h2>
        <p>錯題分析 · AI 導師 · 觀念精準派題</p>
      </div>
    </div>
  );
};

export default BookStage;
