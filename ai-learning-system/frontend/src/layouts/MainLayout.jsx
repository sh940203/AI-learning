import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, BrainCircuit, PenTool, Settings, Plus, HelpCircle, LogOut, LogIn, Bell, Search, Menu, AlertTriangle, Target, UserRound, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import QuestionFeedbackModal from '../components/QuestionFeedbackModal';
import styles from './MainLayout.module.css';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showSystemFeedback, setShowSystemFeedback] = useState(false);
  // 手機版「我的」選單 (底部滑出)
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // 手機版底部導覽列項目
  const mobileTabs = [
    { to: '/dashboard', icon: LayoutDashboard, label: '首頁' },
    { to: '/tests', icon: PenTool, label: '測驗' },
    { to: '/error-analysis', icon: Target, label: '錯題' },
    { to: '/ai-learning', icon: BrainCircuit, label: 'AI 導師' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSystemFeedbackSubmit = async (feedbackData) => {
    try {
      const response = await fetch('/api/feedbacks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...feedbackData })
      });
      if (response.ok) {
        alert('感謝您的回報！開發團隊會盡快處理。');
        setShowSystemFeedback(false);
      } else {
        alert('提交失敗，請稍後重試。');
      }
    } catch (err) {
      console.error(err);
      alert('發生網路錯誤，無法提交。');
    }
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
          <button className={styles.ghostBtn} onClick={() => setShowSystemFeedback(true)} title="錯誤回饋">
            <AlertTriangle size={18} /> <span className={styles.navItemText}>錯誤回饋</span>
          </button>
          <button className={styles.ghostBtn} title="協助中心">
            <HelpCircle size={18} /> <span className={styles.navItemText}>協助中心</span>
          </button>
          {user ? (
            <button className={styles.ghostBtn} onClick={handleLogout} title="登出">
              <LogOut size={18} /> <span className={styles.navItemText}>登出</span>
            </button>
          ) : (
            <button className={styles.ghostBtn} onClick={() => navigate('/login')} title="登入">
              <LogIn size={18} /> <span className={styles.navItemText}>登入</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.mainArea}>
        <header className={styles.header}>
          {/* 手機版：頂部只留品牌名稱 */}
          <span className={styles.mobileBrand} onClick={() => navigate('/dashboard')}>MIND SYNC</span>
          <div className={styles.searchBar}>
            <Search size={18} color="var(--color-text-muted)" />
            <input type="text" placeholder="搜尋課程、檔案或筆記..." />
          </div>
          <div className={styles.headerActions}>
            <button className={styles.iconBtn}><Bell size={20} /></button>
            {user ? (
              <div className={styles.avatar} style={{display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', backgroundColor: 'var(--color-primary)', backgroundImage: 'none'}} title={user.name}>
                {user.name.charAt(0)}
              </div>
            ) : (
              <button className={styles.headerLoginBtn} onClick={() => navigate('/login')}>
                <LogIn size={16} /> 登入
              </button>
            )}
          </div>
        </header>
        
        <main className={styles.content}>
          {/* 以路徑為 key，換頁時重新播放淡入過場 */}
          <div key={location.pathname} className={styles.pageTransition}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* 手機版底部導覽列 (寬度 ≤ 768px 才顯示) */}
      <nav className={styles.bottomNav} aria-label="主要導覽">
        {mobileTabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `${styles.bottomNavItem} ${isActive ? styles.bottomNavActive : ''}`}
          >
            <span className={styles.bottomNavIcon}><Icon size={20} /></span>
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          className={`${styles.bottomNavItem} ${showMobileMenu ? styles.bottomNavActive : ''}`}
          onClick={() => setShowMobileMenu(true)}
        >
          <span className={styles.bottomNavIcon}><UserRound size={20} /></span>
          <span>我的</span>
        </button>
      </nav>

      {/* 手機版「我的」選單 */}
      {showMobileMenu && (
        <div className={styles.sheetOverlay} onClick={() => setShowMobileMenu(false)}>
          <div className={styles.sheet} onClick={e => e.stopPropagation()} role="dialog" aria-label="我的">
            <div className={styles.sheetGrab} />
            <div className={styles.sheetHeader}>
              {user ? (
                <div className={styles.sheetProfile}>
                  <div className={styles.sheetAvatar}>{user.name.charAt(0)}</div>
                  <div>
                    <div className={styles.name}>{user.name}</div>
                    <div className={styles.email}>{user.email}</div>
                  </div>
                </div>
              ) : (
                <div className={styles.sheetProfile}>
                  <div className={styles.sheetAvatar}><UserRound size={18} /></div>
                  <div>
                    <div className={styles.name}>訪客</div>
                    <div className={styles.email}>登入後即可保存學習紀錄</div>
                  </div>
                </div>
              )}
              <button className={styles.sheetClose} onClick={() => setShowMobileMenu(false)} aria-label="關閉">
                <X size={18} />
              </button>
            </div>
            <div className={styles.sheetList}>
              <button className={styles.sheetItem} onClick={() => { setShowMobileMenu(false); navigate('/settings'); }}>
                <Settings size={18} /> 個人設定
              </button>
              <button className={styles.sheetItem} onClick={() => { setShowMobileMenu(false); setShowSystemFeedback(true); }}>
                <AlertTriangle size={18} /> 錯誤回饋
              </button>
              <button className={styles.sheetItem}>
                <HelpCircle size={18} /> 協助中心
              </button>
              {user ? (
                <button className={`${styles.sheetItem} ${styles.sheetItemDanger}`} onClick={() => { setShowMobileMenu(false); handleLogout(); }}>
                  <LogOut size={18} /> 登出
                </button>
              ) : (
                <button className={`${styles.sheetItem} ${styles.sheetItemPrimary}`} onClick={() => { setShowMobileMenu(false); navigate('/login'); }}>
                  <LogIn size={18} /> 登入 / 註冊
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 系統錯誤回饋彈窗 */}
      {showSystemFeedback && (
        <QuestionFeedbackModal
          isSystemMode={true}
          onClose={() => setShowSystemFeedback(false)}
          onSubmit={handleSystemFeedbackSubmit}
        />
      )}
    </div>
  );
};

export default MainLayout;
