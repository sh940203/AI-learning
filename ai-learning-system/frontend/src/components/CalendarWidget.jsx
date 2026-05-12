import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import EventModal from './EventModal';
import styles from './CalendarWidget.module.css';

const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const CalendarWidget = () => {
  const [currentDate, setCurrentDate] = useState(new Date()); // 現實時間
  const [events, setEvents] = useState([
    { id: 1, date: '2024-05-06', title: '校園馬拉松', type: 'green' },
    { id: 2, date: '2024-05-08', title: '演算法討論', type: 'blue' },
    { id: 3, date: '2024-05-15', title: '社團博覽會', type: 'red' },
    { id: 4, date: '2024-05-16', title: '計概專案繳交', type: 'red' },
    { id: 5, date: '2024-05-16', title: 'AI 學習進度', type: 'blue' }
  ]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper to change month
  const changeMonth = (offset) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  const handleYearChange = (e) => {
    setCurrentDate(new Date(parseInt(e.target.value), month, 1));
  };

  const handleMonthChange = (e) => {
    setCurrentDate(new Date(year, parseInt(e.target.value), 1));
  };

  // Generate calendar grid
  const generateDays = () => {
    const days = [];
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Adjust for Monday start (0 is Sunday, so if 0 make it 7, then -1)
    let startDayOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    // Previous month's trailing days
    for (let i = startDayOffset - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      days.push({ day: dayNum, muted: true, dateStr: '', events: [] });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.date === dateStr);
      days.push({ 
        day: i, 
        muted: false, 
        today: dateStr === todayStr,
        dateStr,
        events: dayEvents 
      });
    }

    // Next month's leading days to fill 35 or 42 grid
    const totalCells = days.length > 35 ? 42 : 35;
    let nextMonthDay = 1;
    while (days.length < totalCells) {
      days.push({ day: nextMonthDay++, muted: true, dateStr: '', events: [] });
    }

    return days;
  };

  const days = generateDays();

  const handleDayClick = (dateStr) => {
    if (!dateStr) return;
    setSelectedDateStr(dateStr);
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (e, event) => {
    e.stopPropagation(); // 阻止觸發 handleDayClick
    setEditingEvent(event);
    setSelectedDateStr(event.date);
    setIsModalOpen(true);
  };

  const handleAddEventBtn = () => {
    const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    setSelectedDateStr(todayStr);
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleSaveEvent = (newEvent) => {
    if (editingEvent) {
      setEvents(events.map(ev => ev.id === newEvent.id ? newEvent : ev));
    } else {
      setEvents([...events, newEvent]);
    }
  };

  return (
    <>
      <div className={styles.calendarContainer}>
        <div className={styles.calendarHeader}>
          <div className={styles.monthNav}>
            <div className={styles.selectGroup}>
              <select value={year} onChange={handleYearChange} className={styles.dateSelect}>
                {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}年</option>)}
              </select>
              <select value={month} onChange={handleMonthChange} className={styles.dateSelect}>
                {Array.from({length: 12}).map((_, i) => <option key={i} value={i}>{i + 1}月</option>)}
              </select>
            </div>
            <div className={styles.navArrows}>
              <button className={styles.arrowBtn} onClick={() => changeMonth(-1)}><ChevronLeft size={16} /></button>
              <button className={styles.arrowBtn} onClick={() => changeMonth(1)}><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className={styles.viewToggle}>
            <button className={styles.viewBtn}>日</button>
            <button className={styles.viewBtn}>週</button>
            <button className={`${styles.viewBtn} ${styles.active}`}>月</button>
          </div>
        </div>

        <div className={styles.grid}>
          {daysOfWeek.map(day => (
            <div key={day} className={styles.dayName}>{day}</div>
          ))}
          
          {days.map((d, index) => (
            <div 
              key={index} 
              className={`${styles.dayCell} ${d.muted ? '' : styles.clickableCell}`}
              onClick={() => handleDayClick(d.dateStr)}
            >
              <span className={`${styles.dateNumber} ${d.muted ? styles.muted : ''} ${d.today ? styles.today : ''}`}>
                {d.day}
              </span>
              <div className={styles.eventList}>
                {d.events.map((event, i) => (
                  <div 
                    key={i} 
                    className={`${styles.event} ${
                      event.type === 'red' ? styles.eventRed : 
                      event.type === 'blue' ? styles.eventBlue : styles.eventGreen
                    }`}
                    onClick={(e) => handleEventClick(e, event)}
                    style={{ cursor: 'pointer' }}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.legend}>
          <div className={styles.legendItems}>
            <div className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.dotRed}`}></span> 考試/截止日期
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.dotBlue}`}></span> 學術課程
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.dotGreen}`}></span> 課外活動
            </div>
          </div>
          <button className={styles.addBtn} onClick={handleAddEventBtn}>新增日程</button>
        </div>
      </div>

      <EventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveEvent}
        initialDate={selectedDateStr}
        existingEvent={editingEvent}
      />
    </>
  );
};

export default CalendarWidget;
