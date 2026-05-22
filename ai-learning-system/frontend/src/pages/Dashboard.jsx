import React, { useState, useEffect } from 'react';
import { Lightbulb, FileText, PlaySquare, FileCode, ExternalLink, Bot } from 'lucide-react';
import TaskTimeline from '../components/TaskTimeline';
import CalendarWidget from '../components/CalendarWidget';
import { useAuth } from '../context/AuthContext';
import styles from './Dashboard.module.css';

const defaultEvents = [
  { 
    id: 1, 
    date: '2026-05-20', 
    time: '21:00',
    title: '計算機概論：期中專案繳交', 
    type: 'red',
    isAllDay: false,
    notes: '請確保所有的程式碼註釋完整並符合格式規範。包含專案雲端連結。',
    location: '線上繳交系統',
    completed: false
  },
  { 
    id: 2, 
    date: '2026-05-21', 
    time: '18:00',
    title: 'AI自主學習：深度學習模組', 
    type: 'blue', // Changed from purple to blue
    isAllDay: false,
    notes: '完成第三單元的自我評測練習題。包含卷積神經網路概念。',
    completed: false
  },
  { 
    id: 3, 
    date: '2026-05-28', 
    time: '12:00',
    title: '通識英語：單字複習', 
    type: 'orange',
    isAllDay: false,
    notes: '利用系統生成的單字卡進行 15 分鐘複習。目標 50 個新單字。',
    completed: false
  },
  { 
    id: 4, 
    date: '2026-05-22', 
    time: '14:00',
    title: '資料結構：紅黑樹討論', 
    type: 'blue',
    isAllDay: false,
    notes: '小組線上會議討論紅黑樹的實作細節。',
    completed: false
  },
  { 
    id: 5, 
    date: '2026-05-25', 
    time: '19:00',
    title: '課外活動：系學會大會', 
    type: 'green',
    isAllDay: false,
    notes: '討論下學期迎新活動企劃。',
    location: '第一會議室',
    completed: false
  }
];

const Dashboard = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [events, setEvents] = useState(() => {
    // Bust cache to v3 to clear out purple categories and load clean default events
    const saved = localStorage.getItem('ai_learning_events_v3');
    return saved ? JSON.parse(saved) : defaultEvents;
  });

  useEffect(() => {
    localStorage.setItem('ai_learning_events_v3', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
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
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const pendingCount = events.filter(e => !e.completed).length;

  return (
    <div className={styles.container}>
      <div className={styles.welcomeHeader}>
        <h1>{greeting}，{user?.name || '陳嘉恩'}</h1>
        <p>今天是 {dateStr}。你有 {pendingCount} 個即將到期的任務。</p>
      </div>

      <div className={styles.mainGrid}>
        {/* Left Column */}
        <div className={styles.leftCol}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>任務時間軸</h2>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>待辦任務</span>
            </div>
            <TaskTimeline events={events} setEvents={setEvents} />
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
            <CalendarWidget events={events} setEvents={setEvents} />
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
