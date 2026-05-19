import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

const Login = () => {
  const [activeTab, setActiveTab] = useState('register'); // 'login' or 'register'

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [announcementsData, setAnnouncementsData] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch('/api/announcements?public=true');
        if (res.ok) {
          const data = await res.json();
          setAnnouncementsData(data);
        }
      } catch (err) {
        console.error('Failed to fetch announcements', err);
      }
    };
    fetchAnnouncements();
  }, []);

  const navigate = useNavigate();
  const { login } = useAuth();

  const validateForm = () => {
    const newErrors = {};
    if (activeTab === 'register' && !name.trim()) newErrors.name = '請填寫真實姓名';

    if (!email) {
      newErrors.email = '請填寫電子郵件';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = '電子郵件格式不正確';
    }

    if (!password) {
      newErrors.password = '請填寫密碼';
    } else if (password.length < 8) {
      newErrors.password = '密碼至少需要 8 個字元';
    }

    if (activeTab === 'register') {
      if (password !== confirmPassword) {
        newErrors.confirmPassword = '兩次輸入的密碼不一致';
      }
      if (!termsAccepted) {
        newErrors.terms = '必須同意服務條款才能註冊';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const endpoint = activeTab === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload = activeTab === 'register' ? { name, email, password } : { email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ ...errors, submit: data.message || '發生錯誤，請稍後再試' });
        return;
      }

      // 登入成功
      login(data.user, data.token);
      navigate('/disclaimer');
    } catch (error) {
      setErrors({ ...errors, submit: '網路連線錯誤，請確認伺服器是否運行中' });
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logoGroup}>
          <div className={styles.logoIcon}></div>
          <span className={styles.brand}>AI智能輔助自主學習系統</span>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.outlineBtn} onClick={() => { setActiveTab('login'); setErrors({}); }}>登入</button>
          <button className={styles.primaryBtn} onClick={() => { setActiveTab('register'); setErrors({}); }}>註冊</button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Left: Announcements */}
        <div className={styles.announcementPanel}>
          <h2 className={styles.panelTitle}>
            <Megaphone size={24} /> 系統公告
          </h2>

          <div className={styles.announcementList}>
            {announcementsData.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>目前沒有公告</p>
            ) : (
              announcementsData.slice(0, 4).map((item) => (
                <div 
                  key={item._id} 
                  className={styles.announcementCard} 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedAnnouncement(item)}
                >
                  <div className={styles.cardHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.isPinned && <span style={{ color: '#d97706', fontSize: '12px', fontWeight: 'bold' }}>📌</span>}
                      <span className={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    {item.tag && <span className={`${styles.tag} ${styles['tag' + item.tag] || styles.tag一般}`}>{item.tag}</span>}
                  </div>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  {item.content && (
                    <p className={styles.cardContent}>
                      {item.content.length > 50 ? (
                        <>
                          {item.content.substring(0, 50)}...
                          <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>更多內容</span>
                        </>
                      ) : (
                        item.content
                      )}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {announcementsData.length > 4 && (
            <button className={styles.moreBtn}>
              查看更多公告 <ChevronRight size={16} />
            </button>
          )}
        </div>

        {selectedAnnouncement && (
          <div className={styles.modalOverlay} onClick={() => setSelectedAnnouncement(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h3 className={styles.modalTitle}>{selectedAnnouncement.title}</h3>
              <div className={styles.modalMeta}>
                <span className={styles.date}>{new Date(selectedAnnouncement.createdAt).toLocaleDateString()}</span>
                {selectedAnnouncement.tag && <span className={`${styles.tag} ${styles['tag' + selectedAnnouncement.tag] || styles.tag一般}`}>{selectedAnnouncement.tag}</span>}
              </div>
              <div className={styles.modalBody}>
                {selectedAnnouncement.content}
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setSelectedAnnouncement(null)}>關閉</button>
            </div>
          </div>
        )}

        {/* Right: Auth Form */}
        <div className={styles.formPanel}>
          <div className={styles.formWrapper}>
            <div className={styles.formHeader}>
              <h1>開始您的智慧學習之旅</h1>
              <p>您專屬的學術助手</p>
            </div>

            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'register' ? styles.activeTab : ''}`}
                onClick={() => { setActiveTab('register'); setErrors({}); }}
              >
                建立帳號
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'login' ? styles.activeTab : ''}`}
                onClick={() => { setActiveTab('login'); setErrors({}); }}
              >
                登入系統
              </button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              {activeTab === 'register' && (
                <div className={styles.formGroup}>
                  <label>姓名</label>
                  <input
                    type="text"
                    placeholder="輸入您的真實姓名"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={errors.name ? styles.inputError : ''}
                  />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>
              )}

              <div className={styles.formGroup}>
                <label>電子郵件</label>
                <input
                  type="email"
                  placeholder="example@scholar.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? styles.inputError : ''}
                />
                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>密碼</label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={activeTab === 'register' ? "至少 8 個字元" : "輸入密碼"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={errors.password ? styles.inputError : ''}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <span className={styles.errorText}>{errors.password}</span>}
              </div>

              {activeTab === 'register' && (
                <div className={styles.formGroup}>
                  <label>確認密碼</label>
                  <div className={styles.passwordInputWrapper}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="再次輸入密碼"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={errors.confirmPassword ? styles.inputError : ''}
                    />
                  </div>
                  {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
                </div>
              )}

              {activeTab === 'register' && (
                <div className={styles.checkboxGroup}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                    <label htmlFor="terms">
                      我已閱讀並同意 <a href="#">服務條款</a> 與 <a href="#">隱私權政策</a>
                    </label>
                  </div>
                  {errors.terms && <span className={styles.errorText} style={{ marginLeft: '24px' }}>{errors.terms}</span>}
                </div>
              )}
              
              {errors.submit && (
                <div className={styles.errorText} style={{ textAlign: 'center', marginBottom: '16px', fontWeight: 'bold' }}>
                  {errors.submit}
                </div>
              )}

              <button type="submit" className={styles.submitBtn}>
                {activeTab === 'register' ? '立即註冊' : '登入系統'}
              </button>
            </form>

            <div className={styles.divider}>
              <span>第三方快速登入</span>
            </div>

            <div className={styles.socialAuth}>
              <button type="button" className={styles.socialBtn}>
                Google
              </button>
              <button type="button" className={styles.socialBtn}>
                GitHub
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p className={styles.footerCopy}>© 2024 AI智能輔助自主學習系統</p>
        <div className={styles.footerLinks}>
          <a href="#">使用條款</a>
          <a href="#">隱私政策</a>
          <a href="#">聯繫我們</a>
        </div>
      </footer>
    </div>
  );
};

export default Login;
