import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import styles from './LandingLayout.module.css';

const LandingLayout = () => {
  // 首頁主視覺的「開始使用」還在畫面內時為 true，頂部按鈕暫時隱藏，避免同畫面出現兩顆
  const [heroCtaVisible, setHeroCtaVisible] = useState(false);

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.navLeft}>
          <Link to="/" className={styles.brand}>AI智能輔助自主學習系統</Link>
          <nav className={styles.navLinks}>
            <a href="#features">功能</a>
            <a href="#path">學習循環</a>
            <a href="#resources">題庫</a>
          </nav>
        </div>
        <div className={styles.navRight}>
          <Link
            to="/login"
            className={`${styles.primaryBtn} ${heroCtaVisible ? styles.ctaHidden : ''}`}
            aria-hidden={heroCtaVisible}
            tabIndex={heroCtaVisible ? -1 : undefined}
          >
            開始使用
          </Link>
        </div>
      </header>
      
      <main className={styles.main}>
        <Outlet context={{ setHeroCtaVisible }} />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <p className={styles.footerBrand}>AI智能輔助自主學習系統</p>
          <p className={styles.footerCopy}>© {new Date().getFullYear()} 靜宜大學資訊管理學系 畢業專題・AI智能輔助自主學習系統</p>
        </div>
        <div className={styles.footerRight}>
          <a href="#">使用條款</a>
          <a href="#">隱私政策</a>
          <a href="#">聯繫我們</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingLayout;
