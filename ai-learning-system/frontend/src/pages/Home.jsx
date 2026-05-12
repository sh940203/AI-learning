import React from 'react';
import { Link } from 'react-router-dom';
import { Info, BrainCircuit, GitMerge, BarChart2 } from 'lucide-react';
import styles from './Home.module.css';
import logoUrl from '../assets/logo.png';

const Home = () => {
  return (
    <div className={styles.container}>
      <section className={styles.heroSection}>
        <div className={styles.logoWrapper}>
          <img src={logoUrl} alt="MIND SYNC Logo" className={styles.logoImage} />
          <h2 className={styles.logoText}>MIND SYNC</h2>
        </div>
        
        <h1 className={styles.mainTitle}>AI智能輔助自主學習系統</h1>
        <p className={styles.subtitle}>
          結合頂尖人工智慧技術與教育心理學，為每一位學習者打造專屬的知識進化路徑。
        </p>
        
        <div className={styles.heroActions}>
          <Link to="/login" className={styles.btnPrimary}>開始使用</Link>
          <button className={styles.btnOutline}>了解更多</button>
        </div>
      </section>

      <section className={styles.infoSection}>
        <div className={styles.infoCard}>
          <div className={styles.cardHeader}>
            <div className={styles.headerTitle}>
              <Info size={16} />
              <span>系統簡介</span>
            </div>
            <div className={styles.dots}>
              <span></span><span></span><span></span>
            </div>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.introText}>
              這是一個結合人工智慧技術的自主學習平台，旨在透過智慧分析與個人化路徑，協助學生提升學習效率與成效。我們相信技術應服務於學習本質，透過極簡化的界面與深度資料洞察，讓教育回歸專注。
            </p>

            <div className={styles.featureGrid}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <BrainCircuit size={20} color="var(--color-primary)" />
                </div>
                <h3>智慧分析</h3>
                <p>精準診斷學習盲點與知識缺漏</p>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <GitMerge size={20} color="var(--color-primary)" />
                </div>
                <h3>個人化路徑</h3>
                <p>動態調整學習難度與進度排程</p>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <BarChart2 size={20} color="var(--color-primary)" />
                </div>
                <h3>成效可視化</h3>
                <p>全方位的學習數據追蹤與回饋</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
