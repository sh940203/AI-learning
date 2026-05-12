import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BrainCircuit, PenTool, Settings, Plus, HelpCircle, LogOut, Bell, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './MainLayout.module.css';

const MainLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div 
          className={styles.logoContainer} 
          onClick={() => navigate('/dashboard')}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles.logoIcon}></div>
          <div className={styles.logoText}>
            <h2>AI智能輔助學習系統</h2>
            <span>學習空間</span>
          </div>
        </div>

        <nav className={styles.nav}>
          <NavLink to="/dashboard" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
            <LayoutDashboard size={20} /> 首頁儀表板
          </NavLink>
          <NavLink to="/ai-learning" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
            <BrainCircuit size={20} /> AI 自主學習中心
          </NavLink>
          <NavLink to="/tests" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
            <PenTool size={20} /> 測驗中心
          </NavLink>
          <NavLink to="/settings" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
            <Settings size={20} /> 個人設定
          </NavLink>
        </nav>

        <div className={styles.sidebarBottom}>
          {user && (
            <div className={styles.adminProfile} style={{ padding: '0 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className={styles.avatar} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary-bg)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                {user.name.charAt(0)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-main)', fontWeight: '500' }}>{user.name}</span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{user.email}</span>
              </div>
            </div>
          )}
          <button className={styles.primaryBtn}>
            <Plus size={18} /> 開始新課程
          </button>
          <button className={styles.ghostBtn}>
            <HelpCircle size={18} /> 協助中心
          </button>
          <button className={styles.ghostBtn} onClick={handleLogout}>
            <LogOut size={18} /> 登出
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.mainArea}>
        <header className={styles.header}>
          <div className={styles.searchBar}>
            <Search size={18} color="var(--color-text-muted)" />
            <input type="text" placeholder="搜尋課程、檔案或筆記..." />
          </div>
          <div className={styles.headerActions}>
            <button className={styles.iconBtn}><Bell size={20} /></button>
            <div className={styles.avatar} style={{display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', backgroundColor: 'var(--color-primary)'}}>
              {user ? user.name.charAt(0) : ''}
            </div>
          </div>
        </header>
        
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
