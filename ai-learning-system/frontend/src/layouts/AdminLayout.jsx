import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LineChart, Database, Megaphone, Settings, LogOut, HelpCircle, Bell, Search, Menu, BookOpen, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
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
          <div className={styles.logoText}>
            <h2>管理後台</h2>
            <span>Admin Dashboard</span>
          </div>
        </div>

        <nav className={styles.nav}>
          <NavLink to="/admin/dashboard" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem} title="系統效能監控">
            <LineChart size={20} /> <span className={styles.navItemText}>系統效能監控</span>
          </NavLink>
          <NavLink to="/admin/questions" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem} title="題庫管理">
            <Database size={20} /> <span className={styles.navItemText}>題庫管理</span>
          </NavLink>
          <NavLink to="/admin/knowledge" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem} title="中央知識庫管理">
            <BookOpen size={20} /> <span className={styles.navItemText}>中央知識庫</span>
          </NavLink>
          <NavLink to="/admin/logs/unanswered" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem} title="超綱問題追蹤">
            <AlertCircle size={20} /> <span className={styles.navItemText}>超綱問題追蹤</span>
          </NavLink>
          <NavLink to="/admin/announcements" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem} title="公告系統">
            <Megaphone size={20} /> <span className={styles.navItemText}>公告系統</span>
          </NavLink>
          <NavLink to="/admin/settings" className={({isActive}) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem} title="設定">
            <Settings size={20} /> <span className={styles.navItemText}>設定</span>
          </NavLink>
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={`${styles.adminProfile} ${isSidebarCollapsed ? styles.collapsedProfile : ''}`}>
            <div className={styles.avatar} style={{display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-primary)', fontWeight: 'bold'}}>
              {user ? user.name.charAt(0) : 'A'}
            </div>
            <div className={styles.profileInfo}>
              <span className={styles.name}>{user ? user.name : '管理員'}</span>
              <span className={styles.email}>{user ? user.email : 'admin_center@gmail.com'}</span>
            </div>
          </div>
          <button className={styles.ghostBtn} title="幫助中心">
            <HelpCircle size={18} /> <span className={styles.navItemText}>幫助中心</span>
          </button>
          <button className={styles.ghostBtn} onClick={handleLogout} title="登出">
            <LogOut size={18} /> <span className={styles.navItemText}>登出</span>
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
