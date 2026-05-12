import React, { useState, useEffect } from 'react';
import { Lightbulb, FileText, PlaySquare, FileCode, ExternalLink, Bot } from 'lucide-react';
import TaskTimeline from '../components/TaskTimeline';
import CalendarWidget from '../components/CalendarWidget';
import { useAuth } from '../context/AuthContext';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Use Asia/Taipei timezone
      const formatter = new Intl.DateTimeFormat('zh-TW', {
        timeZone: 'Asia/Taipei',
        hour: 'numeric',
        hour12: false
      });
      const hour = parseInt(formatter.format(now), 10);
      
      let timeGreeting = '早安';
      if (hour >= 12 && hour < 18) {
        timeGreeting = '午安';
      } else if (hour >= 18) {
        timeGreeting = '晚安';
      }
      setGreeting(timeGreeting);

      // Date string format: YYYY 年 MM 月 DD 日 AM/PM HH:MM
      const dateFormatter = new Intl.DateTimeFormat('zh-TW', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      setDateStr(dateFormatter.format(now));
    };

    updateTime();
    // Update every minute to keep time fresh
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.welcomeHeader}>
        <h1>{greeting}，{user?.name || '使用者'}</h1>
        <p>今天是 {dateStr}。你有 3 個即將到期的任務。</p>
      </div>

      <div className={styles.mainGrid}>
        {/* Left Column */}
        <div className={styles.leftCol}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>任務時間軸</h2>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>本週</span>
            </div>
            <TaskTimeline />
          </div>

          <div className={styles.efficiencyCard}>
            <h3 className={styles.efficiencyTitle}>今日學習效率</h3>
            <div className={styles.efficiencyValue}>85%</div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill}></div>
            </div>
            <p className={styles.efficiencyDesc}>你已經超越了 92% 的同學。繼續保持這個節奏！</p>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightCol}>
          <div className={`${styles.card} ${styles.fullHeight}`}>
            <CalendarWidget />
          </div>
        </div>
      </div>

      <div className={styles.bottomGrid}>
        {/* AI 學習建議 */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>AI 學習建議</h2>
            <Lightbulb size={20} color="var(--color-primary)" />
          </div>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>根據你最近的測驗表現</p>
          <div className={styles.aiBox}>
            <p>"你在『遞迴演算法』部分的理解略顯薄弱，建議今晚撥出 20 分鐘複習動態規劃的基礎概念。"</p>
          </div>
          <button className={styles.linkBtn}>查看強化練習 <ExternalLink size={14} /></button>
        </div>

        {/* 最近查閱資源 */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>最近查閱資源</h2>
          </div>
          <div className={styles.resourceList}>
            <div className={styles.resourceItem}>
              <FileText className={styles.resourceIcon} size={20} />
              <div className={styles.resourceInfo}>
                <h4>資料結構複習筆記.pdf</h4>
                <p>2 小時前</p>
              </div>
            </div>
            <div className={styles.resourceItem}>
              <PlaySquare className={styles.resourceIcon} size={20} />
              <div className={styles.resourceInfo}>
                <h4>線性代數 - 第 4 講</h4>
                <p>昨天 15:20</p>
              </div>
            </div>
            <div className={styles.resourceItem}>
              <FileCode className={styles.resourceIcon} size={20} />
              <div className={styles.resourceInfo}>
                <h4>Python 專案實作範例</h4>
                <p>3 天前</p>
              </div>
            </div>
          </div>
        </div>

        {/* 學習社群 */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>學習社群</h2>
          </div>
          <div className={styles.avatarGroup}>
            <div className={styles.avatars}>
              <img src="https://i.pravatar.cc/100?img=1" alt="user" />
              <img src="https://i.pravatar.cc/100?img=2" alt="user" />
              <img src="https://i.pravatar.cc/100?img=3" alt="user" />
            </div>
            <span className={styles.moreAvatars}>+12</span>
          </div>
          
          <div className={styles.eventBox}>
            <span className={styles.eventBadge}>即將開始的研討</span>
            <h4 className={styles.eventTitle}>計算機概論考前衝刺</h4>
            <p className={styles.eventMeta}>今天 20:00 • 3 人已加入</p>
          </div>
          
          <button className={styles.joinBtn}>
            <Bot size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
