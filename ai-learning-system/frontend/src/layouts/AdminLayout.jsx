import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LineChart, Database, Megaphone, Settings, LogOut, HelpCircle, Bell, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
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
        <div className={styles.logoContainer}>
          <h2>管理後台</h2>
          <span>Admin Dashboard</span>
        </div>

        <nav className={styles.nav}>
          <NavLink to="/admin/dashboard" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
            <LineChart size={20} /> 系統效能監控
          </NavLink>
          <NavLink to="/admin/questions" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
            <Database size={20} /> 題庫管理
          </NavLink>
          <NavLink to="/admin/announcements" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
            <Megaphone size={20} /> 公告系統
          </NavLink>
          <NavLink to="/admin/settings" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
            <Settings size={20} /> 設定
          </NavLink>
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.adminProfile}>
            <div className={styles.avatar} style={{display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-primary)', fontWeight: 'bold'}}>
              {user ? user.name.charAt(0) : 'A'}
            </div>
            <div className={styles.profileInfo}>
              <span className={styles.name}>{user ? user.name : '管理員'}</span>
              <span className={styles.email}>{user ? user.email : 'admin_center@gmail.com'}</span>
            </div>
          </div>
          <button className={styles.ghostBtn}>
            <HelpCircle size={18} /> 幫助中心
          </button>
          <button className={styles.ghostBtn} onClick={handleLogout}>
            <LogOut size={18} /> 登出
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.mainArea}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.pageTitle}>後台管理中心</h2>
            <div className={styles.searchBar}>
              <Search size={18} color="var(--color-text-muted)" />
              <input type="text" placeholder="搜尋數據或功能..." />
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.iconBtn}><Bell size={20} /></button>
            <button className={styles.iconBtn}><HelpCircle size={20} /></button>
          </div>
        </header>
        
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
