import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

const announcements = [
  { id: 1, date: '2024.05.20', tag: '重要', title: 'AI 論文摘要生成功能優化更新', content: '系統已更新 LLM 模型，提供更精準的長文本摘要能力，提升學習效率...' },
  { id: 2, date: '2024.05.18', tag: null, title: '系統維護通知：本週六凌晨 02:00', content: '為進行核心數據庫升級，預計影響服務 2 小時，請提早存檔。' },
  { id: 3, date: '2024.05.15', tag: null, title: '新功能上線：智慧化學習路徑規劃', content: '透過 AI 分析個人學習弱點，自動生成專屬的學習藍圖與資源推薦。' },
  { id: 4, date: '2024.05.10', tag: null, title: '伺服器擴展完成，連線速度提升 40%', content: '' },
];

const Login = () => {
  const [activeTab, setActiveTab] = useState('register'); // 'login' or 'register'
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // 模擬驗證成功並登入
    login({ name: activeTab === 'register' ? name : '使用者', email });
    navigate('/disclaimer');
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
            {announcements.map((item) => (
              <div key={item.id} className={styles.announcementCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.date}>{item.date}</span>
                  {item.tag && <span className={styles.tag}>{item.tag}</span>}
                </div>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                {item.content && <p className={styles.cardContent}>{item.content}</p>}
              </div>
            ))}
          </div>
          
          <button className={styles.moreBtn}>
            查看更多公告 <ChevronRight size={16} />
          </button>
        </div>

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
                  {errors.terms && <span className={styles.errorText} style={{marginLeft: '24px'}}>{errors.terms}</span>}
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
