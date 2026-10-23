import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, FileText, PlaySquare, FileCode, ExternalLink, Bot, LogIn } from 'lucide-react';
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

// 新使用者的預設任務：引導統測考生走一次系統主線 (寫考卷 → 看錯題 → 問 AI → 強化練習)
const defaultEvents = [
  {
    id: 1,
    date: getRelativeDateStr(0),
    time: '20:00',
    title: '完成一份統測考古題',
    type: 'red',
    isAllDay: false,
    notes: '到測驗中心寫「[114 統測] 專業科目(一)」，交卷後系統會自動分析錯題。',
    completed: false
  },
  {
    id: 2,
    date: getRelativeDateStr(1),
    time: '19:00',
    title: '查看 AI 錯題分析',
    type: 'blue',
    isAllDay: false,
    notes: '在分析報告點選錯題，讓 AI 解析關鍵謬誤與觀念盲點。',
    completed: false
  },
  {
    id: 3,
    date: getRelativeDateStr(2),
    time: '19:00',
    title: '問 AI 導師一個不懂的觀念',
    type: 'orange',
    isAllDay: false,
    notes: '到 AI 自主學習中心提問，或直接拍照上傳題目。',
    completed: false
  },
  {
    id: 4,
    date: getRelativeDateStr(3),
    time: '19:00',
    title: '用確保觀念生成題練 10 題',
    type: 'green',
    isAllDay: false,
    notes: '在分析報告右側選「生成 10 題」，針對錯的單元再練一次。',
    completed: false
  }
];

// 舊版 (v4) 預設範例任務的標題：升級時移除這些範例，只保留使用者自己新增的任務
const LEGACY_SAMPLE_TITLES = [
  '計算機概論：期中專案繳交',
  'AI自主學習：深度學習模組',
  '通識英語：單字複習',
  '資料結構：紅黑樹討論',
  '課外活動：系學會大會'
];

const EVENTS_STORAGE_KEY = 'ai_learning_events_v5';

const loadInitialEvents = () => {
  try {
    const saved = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);

    // 從 v4 遷移：保留使用者自建任務，並補上新的預設引導任務
    const legacy = localStorage.getItem('ai_learning_events_v4');
    if (legacy) {
      const userEvents = JSON.parse(legacy).filter(e => !LEGACY_SAMPLE_TITLES.includes(e.title));
      const maxId = Math.max(0, ...userEvents.map(e => Number(e.id) || 0));
      return [
        ...userEvents,
        ...defaultEvents.map((e, i) => ({ ...e, id: maxId + i + 1 }))
      ];
    }
  } catch (e) {
    console.error('讀取任務資料失敗，改用預設任務', e);
  }
  return defaultEvents;
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [events, setEvents] = useState(loadInitialEvents);
  const [recentResources, setRecentResources] = useState([]);

  useEffect(() => {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
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
        <h1>{greeting}，{user?.name || '同學'}</h1>
        <p>今天是 {dateStr}。你有 {pendingCount} 個即將到期的任務。</p>
      </div>

      {/* 訪客提示：未登入時說明哪些資料不會保存 */}
      {!user && (
        <div className={styles.guestBanner}>
          <div>
            <strong>目前為訪客模式</strong>
            <span>可以先瀏覽與試寫考卷；登入後才會保存作答紀錄、錯題分析與 AI 對話。</span>
          </div>
          <button className={styles.guestBannerBtn} onClick={() => navigate('/login')}>
            <LogIn size={15} /> 登入 / 註冊
          </button>
        </div>
      )}

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
