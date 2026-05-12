import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import styles from './LandingLayout.module.css';

const LandingLayout = () => {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.navLeft}>
          <Link to="/" className={styles.brand}>AI智能輔助自主學習系統</Link>
          <nav className={styles.navLinks}>
            <a href="#features">核心功能</a>
            <a href="#path">學習路徑</a>
            <a href="#resources">資源庫</a>
          </nav>
        </div>
        <div className={styles.navRight}>
          <Link to="/login" className={styles.primaryBtn}>開始使用</Link>
        </div>
      </header>
      
      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <p className={styles.footerBrand}>AI智能輔助自主學習系統</p>
          <p className={styles.footerCopy}>© 2024 AI智能輔助自主學習系統. 基於學術實踐與效能設計.</p>
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
