import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Info, BrainCircuit, Target, Zap, PenTool, Search, TrendingUp,
  ArrowRight, BookOpen, Database, CalendarRange
} from 'lucide-react';
import LogoIntro from '../components/welcome/LogoIntro';
import LogoSignal from '../components/welcome/LogoSignal';
import styles from './Home.module.css';
import logoUrl from '../assets/logo.png';

// 三大 AI 功能 (對應二口報告內容)
const AI_FEATURES = [
  {
    icon: BrainCircuit,
    title: 'AI 自主學習導師',
    desc: '用文字或拍照提問，AI 先查官方題庫再回答，並標註出自哪本教材哪一章。',
    tag: 'AI 自主學習中心'
  },
  {
    icon: Target,
    title: 'AI 錯題三維度解析',
    desc: '針對你選的錯誤答案，分析關鍵謬誤、觀念盲點與建議強化方向。',
    tag: '分析報告'
  },
  {
    icon: Zap,
    title: 'AI 觀念精準派題',
    desc: '錯哪個單元就練哪個單元，從 2,649 題題庫抽出 10／30／50 題專屬測驗。',
    tag: '分析報告'
  }
];

// 學習路徑三步驟
const LEARNING_STEPS = [
  { icon: PenTool, title: '寫考古題', desc: '歷屆統測、學測試卷，作答進度即時顯示' },
  { icon: Search, title: '看懂錯在哪', desc: 'AI 解析每一題錯誤背後的觀念盲點' },
  { icon: TrendingUp, title: '針對弱點練習', desc: '同單元精準派題，把不會的變會' }
];

// 題庫資源數據
const RESOURCE_STATS = [
  { icon: Database, value: '2,649', unit: '題', label: '數位科技母題庫' },
  { icon: BookOpen, value: '4', unit: '本', label: '數位科技應用／概論教材' },
  { icon: CalendarRange, value: '111–115', unit: '年', label: '歷屆統測・學測試卷' }
];

const INTRO_SEEN_KEY = 'homeIntroSeen';

// 首頁開場是否要播放：同一次開啟瀏覽器只播一次 (與登入頁的 introSeen 分開計算)；減少動態效果時不播
const shouldPlayIntro = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) !== '1';
  } catch {
    return false;
  }
};

const Home = () => {
  const pageRef = useRef(null);
  const logoRef = useRef(null);

  // 歡迎動畫：playing = 開場播放中；revealed = 主視覺已浮現
  const [reduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [introPlaying, setIntroPlaying] = useState(shouldPlayIntro);
  const [introPlayed] = useState(introPlaying);
  const [heroRevealed, setHeroRevealed] = useState(!introPlaying);

  const handleIntroReveal = useCallback(() => setHeroRevealed(true), []);
  const handleIntroFinish = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    } catch {
      // 無法寫入 sessionStorage 時，下次仍會播放，不影響瀏覽
    }
    setIntroPlaying(false);
  }, []);

  // 捲動到區塊時淡入 (IntersectionObserver，進入畫面一次後即停止觀察)
  useEffect(() => {
    const targets = pageRef.current?.querySelectorAll(`.${styles.reveal}`) || [];
    // 不支援 IntersectionObserver 的瀏覽器：直接顯示，避免內容一直是透明的
    if (!('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add(styles.revealVisible));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.revealVisible);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    targets.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.container} ref={pageRef}>
      {introPlaying && (
        <LogoIntro targetRef={logoRef} onReveal={handleIntroReveal} onFinish={handleIntroFinish} />
      )}

      <section className={`${styles.heroSection} ${!heroRevealed ? styles.heroHold : ''} ${introPlayed ? styles.afterIntro : ''}`}>
        <div className={`${styles.logoWrapper} ${styles.heroItem}`}>
          {/* 原圖＋光點層：光點 SVG 與圖片同框同比例，座標對齊 */}
          <div className={styles.logoMarkBox}>
            <img ref={logoRef} src={logoUrl} alt="MIND SYNC Logo" className={styles.logoImage} />
            {!reduceMotion && <LogoSignal />}
          </div>
          <h2 className={styles.logoText}>MIND SYNC</h2>
        </div>

        <h1 className={`${styles.mainTitle} ${styles.heroItem}`}>AI智能輔助自主學習系統</h1>
        <p className={`${styles.subtitle} ${styles.heroItem}`}>
          專為高職統測考生設計：寫考古題、讓 AI 找出你錯在哪，再針對弱點精準練習。
        </p>

        <div className={`${styles.heroActions} ${styles.heroItem}`}>
          <Link to="/login" className={styles.btnPrimary}>開始使用</Link>
          <a href="#features" className={styles.btnOutline}>了解更多</a>
        </div>
      </section>

      {/* ── 核心功能 ── */}
      <section id="features" className={`${styles.infoSection} ${styles.reveal}`}>
        <div className={styles.infoCard}>
          <div className={styles.cardHeader}>
            <div className={styles.headerTitle}>
              <Info size={16} />
              <span>核心功能</span>
            </div>
            <div className={styles.dots}>
              <span></span><span></span><span></span>
            </div>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.introText}>
              三個 AI 功能串成一個學習循環，全部以官方《題庫資料庫》為知識來源，回答與出題都有憑有據。
            </p>

            <div className={styles.featureGrid}>
              {AI_FEATURES.map(({ icon: Icon, title, desc, tag }) => (
                <div key={title} className={styles.featureItem}>
                  <div className={styles.featureIcon}>
                    <Icon size={20} color="var(--color-primary)" />
                  </div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                  <span className={styles.featureTag}>{tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 學習路徑 ── */}
      <section id="path" className={`${styles.infoSection} ${styles.reveal}`}>
        <h2 className={styles.sectionTitle}>三步驟，從不會到會</h2>
        <div className={styles.stepRow}>
          {LEARNING_STEPS.map(({ icon: Icon, title, desc }, idx) => (
            <React.Fragment key={title}>
              <div className={styles.stepCard}>
                <span className={styles.stepNum}>{idx + 1}</span>
                <Icon size={22} color="var(--color-primary)" />
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
              {idx < LEARNING_STEPS.length - 1 && (
                <ArrowRight size={20} className={styles.stepArrow} aria-hidden="true" />
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ── 題庫資源 ── */}
      <section id="resources" className={`${styles.infoSection} ${styles.reveal}`}>
        <h2 className={styles.sectionTitle}>題庫資源</h2>
        <div className={styles.statGrid}>
          {RESOURCE_STATS.map(({ icon: Icon, value, unit, label }) => (
            <div key={label} className={styles.statCard}>
              <Icon size={18} color="var(--color-text-muted)" />
              <div className={styles.statValue}>
                {value}<span>{unit}</span>
              </div>
              <p>{label}</p>
            </div>
          ))}
        </div>
        <div className={styles.ctaRow}>
          <Link to="/tests" className={styles.btnPrimary}>先寫一份考古題看看</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
