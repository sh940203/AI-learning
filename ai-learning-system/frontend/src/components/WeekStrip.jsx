import React, { useState } from 'react';
import styles from './WeekStrip.module.css';

// 與 CalendarWidget 相同的任務類型色彩
const TYPE_COLORS = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  orange: '#f59e0b'
};

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

const toDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// 手機版行事曆：本週 7 天橫條，點日期顯示當天任務 (桌機版仍使用 CalendarWidget)
const WeekStrip = ({ events = [] }) => {
  const today = new Date();
  const todayStr = toDateStr(today);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // 以週一為一週開始
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = toDateStr(date);
    return {
      dateStr,
      day: date.getDate(),
      weekday: WEEKDAYS[i],
      events: events.filter(e => e.date === dateStr)
    };
  });

  const selectedEvents = events
    .filter(e => e.date === selectedDate)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>本週</h2>
        <span className={styles.month}>{today.getFullYear()} 年 {today.getMonth() + 1} 月</span>
      </div>

      <div className={styles.strip}>
        {days.map(d => (
          <button
            key={d.dateStr}
            className={`${styles.day} ${d.dateStr === selectedDate ? styles.daySelected : ''} ${d.dateStr === todayStr ? styles.dayToday : ''}`}
            onClick={() => setSelectedDate(d.dateStr)}
          >
            <span className={styles.weekday}>{d.weekday}</span>
            <span className={styles.dayNum}>{d.day}</span>
            <span className={styles.dots}>
              {d.events.slice(0, 3).map(e => (
                <span key={e.id} className={styles.dot} style={{ backgroundColor: TYPE_COLORS[e.type] || TYPE_COLORS.blue }} />
              ))}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.dayEvents}>
        {selectedEvents.length === 0 ? (
          <p className={styles.empty}>這天沒有安排任務</p>
        ) : (
          selectedEvents.map(e => (
            <div key={e.id} className={styles.eventRow} style={{ borderLeftColor: TYPE_COLORS[e.type] || TYPE_COLORS.blue }}>
              <span className={`${styles.eventTitle} ${e.completed ? styles.eventDone : ''}`}>{e.title}</span>
              <span className={styles.eventTime}>{e.isAllDay ? '整天' : e.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WeekStrip;
