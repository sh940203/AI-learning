import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BrainCircuit, PenTool, Settings, Plus, HelpCircle, LogOut, Bell, Search, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './MainLayout.module.css';

const MainLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.logoContainer}>
          <button className={styles.toggleBtn} onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
            <Menu size={24} />
          </button>
          <div className={styles.logoText} onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
            <h2>AI智能輔助學習系統</h2>
            <span>學習空間</span>
          </div>
        </div>

        <nav className={styles.nav}>
          <NavLink to="/dashboard" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem} title="首頁儀表板">
            <LayoutDashboard size={20} /> <span className={styles.navItemText}>首頁儀表板</span>
          </NavLink>
          <NavLink to="/ai-learning" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem} title="AI 自主學習中心">
            <BrainCircuit size={20} /> <span className={styles.navItemText}>AI 自主學習中心</span>
          </NavLink>
          <NavLink to="/tests" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem} title="測驗中心">
            <PenTool size={20} /> <span className={styles.navItemText}>測驗中心</span>
          </NavLink>
          <NavLink to="/settings" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem} title="個人設定">
            <Settings size={20} /> <span className={styles.navItemText}>個人設定</span>
          </NavLink>
        </nav>

        <div className={styles.sidebarBottom}>
          {user && (
            <div className={`${styles.adminProfile} ${isSidebarCollapsed ? styles.collapsedProfile : ''}`}>
              <div className={styles.avatar} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary-bg)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-primary)', fontWeight: 'bold', flexShrink: 0 }}>
                {user.name.charAt(0)}
              </div>
              <div className={styles.profileInfo}>
                <span className={styles.name}>{user.name}</span>
                <span className={styles.email}>{user.email}</span>
              </div>
            </div>
          )}
          <button className={styles.primaryBtn} title="開始新課程">
            <Plus size={18} /> <span className={styles.navItemText}>開始新課程</span>
          </button>
          <button className={styles.ghostBtn} title="協助中心">
            <HelpCircle size={18} /> <span className={styles.navItemText}>協助中心</span>
          </button>
          <button className={styles.ghostBtn} onClick={handleLogout} title="登出">
            <LogOut size={18} /> <span className={styles.navItemText}>登出</span>
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
