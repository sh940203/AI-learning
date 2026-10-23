import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  PenTool, Search, TrendingUp, BookOpen, Database, CalendarRange, ArrowRight
} from 'lucide-react';
import LogoIntro from '../components/welcome/LogoIntro';
import LogoSignal from '../components/welcome/LogoSignal';
import HeroCircuit from '../components/welcome/HeroCircuit';
import styles from './Home.module.css';
import logoUrl from '../assets/logo.png';
import shotAiTutor from '../assets/home/ai-tutor.webp';
import shotErrorAnalysis from '../assets/home/error-analysis.webp';
import shotQuizGenerate from '../assets/home/quiz-generate.webp';
import thumbAiTutor from '../assets/home/ai-tutor-thumb.webp';
import thumbErrorAnalysis from '../assets/home/error-analysis-thumb.webp';
import thumbQuizGenerate from '../assets/home/quiz-generate-thumb.webp';

// 三大 AI 功能：以系統實際截圖呈現 (截圖來源見 HANDOVER.md，介面改版後需重拍)
// thumb 為卡片上顯示的重點區域 (16:10)，點擊放大時顯示完整的 shot
const AI_FEATURES = [
  { shot: shotAiTutor, thumb: thumbAiTutor, title: 'AI 導師', desc: '有問必答，標註教材出處' },
  { shot: shotErrorAnalysis, thumb: thumbErrorAnalysis, title: '錯題三維解析', desc: '錯在哪，一眼看懂' },
  { shot: shotQuizGenerate, thumb: thumbQuizGenerate, title: '精準派題', desc: '錯哪練哪，10・30・50 題' }
];

// 學習循環三節點 (位置以角度表示，0° 為正上方)
const LOOP_STEPS = [
  { icon: PenTool, label: '寫', angle: 0 },
  { icon: Search, label: '析', angle: 120 },
  { icon: TrendingUp, label: '練', angle: 240 }
];

// 題庫資源數據
const RESOURCE_STATS = [
  { icon: Database, value: '2,649', unit: '題', label: '母題庫' },
  { icon: BookOpen, value: '4', unit: '本', label: '教材' },
  { icon: CalendarRange, value: '111–115', unit: '年', label: '歷屆試卷' }
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
  const heroCtaRef = useRef(null);
  const { setHeroCtaVisible } = useOutletContext() || {};

  // 歡迎動畫：playing = 開場播放中；revealed = 主視覺已浮現
  const [reduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [introPlaying, setIntroPlaying] = useState(shouldPlayIntro);
  const [introPlayed] = useState(introPlaying);
  const [heroRevealed, setHeroRevealed] = useState(!introPlaying);
  const [zoomShot, setZoomShot] = useState(null);

  const handleIntroReveal = useCallback(() => setHeroRevealed(true), []);
  const handleIntroFinish = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    } catch {
      // 無法寫入 sessionStorage 時，下次仍會播放，不影響瀏覽
    }
    setIntroPlaying(false);
  }, []);

  // 捲動到區塊時淡入 (IntersectionObserver，進入畫面一次後即停止觀察)；開場結束後才開始
  useEffect(() => {
    if (!heroRevealed) return;
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
  }, [heroRevealed]);

  // 主視覺「開始使用」還在畫面內時，隱藏頂部導覽列的同一顆按鈕 (避免同畫面出現兩顆)
  useEffect(() => {
    if (!setHeroCtaVisible || !heroCtaRef.current || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setHeroCtaVisible(entry.isIntersecting));
    observer.observe(heroCtaRef.current);
    return () => {
      observer.disconnect();
      setHeroCtaVisible(false);
    };
  }, [setHeroCtaVisible]);

  // 截圖放大：Esc 關閉
  useEffect(() => {
    if (!zoomShot) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setZoomShot(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [zoomShot]);

  return (
    <div className={styles.container} ref={pageRef}>
      {introPlaying && (
        <LogoIntro targetRef={logoRef} onReveal={handleIntroReveal} onFinish={handleIntroFinish} />
      )}

      {/* ── 主視覺：左文字、右 logo＋電路 ── */}
      <section className={`${styles.hero} ${!heroRevealed ? styles.heroHold : ''} ${introPlayed ? styles.afterIntro : ''}`}>
        <div className={styles.heroText}>
          <span className={`${styles.eyebrow} ${styles.heroItem}`}>MIND SYNC</span>
          <h1 className={`${styles.heroTitle} ${styles.heroItem}`}>
            寫考古題，<br /><em>AI 找出你錯在哪</em>
          </h1>
          <p className={`${styles.heroSub} ${styles.heroItem}`}>專為高職統測考生打造</p>
          <div className={`${styles.heroActions} ${styles.heroItem}`}>
            <Link to="/login" className={styles.btnPrimary} ref={heroCtaRef}>開始使用</Link>
            <Link to="/tests" className={styles.textLink}>
              先試寫一份 <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <HeroCircuit drawn={heroRevealed} />
          {/* 原圖＋光點層：光點 SVG 與圖片同框同比例，座標對齊 */}
          <div className={`${styles.logoMarkBox} ${styles.heroLogo}`}>
            <img ref={logoRef} src={logoUrl} alt="MIND SYNC Logo" className={styles.logoImage} />
            {!reduceMotion && <LogoSignal />}
          </div>
        </div>
      </section>

      {/* ── 三個 AI 功能：實際截圖 ── */}
      <section id="features" className={`${styles.section} ${styles.reveal}`}>
        <h2 className={styles.sectionTitle}>三個 AI 功能</h2>
        <div className={styles.featureGrid}>
          {AI_FEATURES.map(({ shot, thumb, title, desc }) => (
            <article key={title} className={styles.featureCard}>
              <button
                type="button"
                className={styles.shotFrame}
                onClick={() => setZoomShot({ src: shot, title })}
                aria-label={`放大檢視「${title}」畫面`}
              >
                <span className={styles.shotBar} aria-hidden="true"><i /><i /><i /></span>
                <img src={thumb} alt={`${title} 系統畫面`} loading="lazy" />
              </button>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── 學習循環 ── */}
      <section id="path" className={`${styles.section} ${styles.reveal}`}>
        <div className={styles.loopRow}>
          <div className={styles.loopRing} aria-hidden="true">
            <svg viewBox="0 0 240 240">
              <circle className={styles.loopTrack} cx="120" cy="120" r="90" />
              <circle className={styles.loopArc} cx="120" cy="120" r="90" pathLength="1" />
            </svg>
            {LOOP_STEPS.map(({ icon: Icon, label, angle }) => (
              <span key={label} className={styles.loopNode} style={{ '--angle': `${angle}deg` }}>
                <Icon size={18} />
                {label}
              </span>
            ))}
          </div>
          <div className={styles.loopText}>
            <h2 className={styles.sectionTitle}>學習循環</h2>
            <p className={styles.loopFlow}>寫考古題 → AI 解析 → 精準練習</p>
            <p className={styles.loopNote}>每一圈，弱點少一個</p>
          </div>
        </div>
      </section>

      {/* ── 題庫資源 ── */}
      <section id="resources" className={`${styles.section} ${styles.reveal}`}>
        <h2 className={styles.sectionTitle}>題庫資源</h2>
        <div className={styles.statGrid}>
          {RESOURCE_STATS.map(({ icon: Icon, value, unit, label }) => (
            <div key={label} className={styles.statCard}>
              <Icon size={20} color="var(--color-primary)" />
              <div className={styles.statValue}>
                {value}<span>{unit}</span>
              </div>
              <p>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 截圖放大檢視 (放在最外層，避免受 reveal 的 transform 影響 fixed 定位) */}
      {zoomShot && (
        <div className={styles.zoomOverlay} onClick={() => setZoomShot(null)} role="dialog" aria-label={zoomShot.title}>
          <img src={zoomShot.src} alt={`${zoomShot.title} 系統畫面`} />
        </div>
      )}
    </div>
  );
};

export default Home;
