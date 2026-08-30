import React, { useState, useEffect } from 'react';
import { Lightbulb, FileText, PlaySquare, FileCode, ExternalLink, Bot } from 'lucide-react';
import TaskTimeline from '../components/TaskTimeline';
import CalendarWidget from '../components/CalendarWidget';
import { useAuth } from '../context/AuthContext';
import styles from './Dashboard.module.css';

const getTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (minutes < 60) return `${minutes || 1} 分鐘前`;
  if (hours < 24) return `${hours} 小時前`;
  if (days === 1) return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  return `${days} 天前`;
};

const getRelativeDateStr = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const defaultEvents = [
  { 
    id: 1, 
    date: getRelativeDateStr(0), 
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
    date: getRelativeDateStr(1), 
    time: '18:00',
    title: 'AI自主學習：深度學習模組', 
    type: 'blue', // Changed from purple to blue
    isAllDay: false,
    notes: '完成第三單元的自我評測練習題。包含卷積神經網路概念。',
    completed: false
  },
  { 
    id: 3, 
    date: getRelativeDateStr(8), 
    time: '12:00',
    title: '通識英語：單字複習', 
    type: 'orange',
    isAllDay: false,
    notes: '利用系統生成的單字卡進行 15 分鐘複習。目標 50 個新單字。',
    completed: false
  },
  { 
    id: 4, 
    date: getRelativeDateStr(2), 
    time: '14:00',
    title: '資料結構：紅黑樹討論', 
    type: 'blue',
    isAllDay: false,
    notes: '小組線上會議討論紅黑樹的實作細節。',
    completed: false
  },
  { 
    id: 5, 
    date: getRelativeDateStr(5), 
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
    // Bust cache to v4 to clear out old static dates and load clean relative default events
    const saved = localStorage.getItem('ai_learning_events_v4');
    return saved ? JSON.parse(saved) : defaultEvents;
  });
  const [recentResources, setRecentResources] = useState([]);

  useEffect(() => {
    localStorage.setItem('ai_learning_events_v4', JSON.stringify(events));
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

    const fetchRecentExams = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/progress/exams', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            const sorted = data.data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            setRecentResources(sorted.slice(0, 3));
          }
        }
      } catch (err) {
        console.error('Failed to fetch recent exams', err);
      }
    };

    updateTime();
    fetchRecentExams();
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

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>最近查閱資源</h2>
            </div>
            <div className={styles.resourceList}>
              {recentResources.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', padding: '10px 0' }}>目前沒有最近查閱的考古題資源</p>
              ) : (
                recentResources.map((resource) => (
                  <div 
                    key={resource._id} 
                    className={styles.resourceItem} 
                  >
                    <FileText className={styles.resourceIcon} size={20} />
                    <div className={styles.resourceInfo}>
                      <h4>{resource.examTitle || '未命名考卷'}</h4>
                      <p>{getTimeAgo(resource.updatedAt || resource.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightCol}>
          <div className={`${styles.card} ${styles.fullHeight}`}>
            <CalendarWidget events={events} setEvents={setEvents} />
          </div>
        </div>
      </div>


    </div>
  );
};

export default Dashboard;
