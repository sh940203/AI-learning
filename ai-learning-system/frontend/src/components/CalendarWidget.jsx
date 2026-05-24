import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, AlignLeft, Calendar as CalIcon, Lightbulb } from 'lucide-react';
import EventModal from './EventModal';
import styles from './CalendarWidget.module.css';

const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const filterTypes = [
  { type: 'red', label: '考試/截止', dotColor: '#ef4444', activeColor: '#fee2e2', textColor: '#b91c1c' },
  { type: 'blue', label: '學術課程', dotColor: '#3b82f6', activeColor: '#dbeafe', textColor: '#1d4ed8' },
  { type: 'green', label: '課外活動', dotColor: '#22c55e', activeColor: '#dcfce7', textColor: '#15803d' },
  { type: 'orange', label: '個人備忘', dotColor: '#f97316', activeColor: '#ffedd5', textColor: '#c2410c' }
];

const getDisplayTitle = (title) => {
  if (!title) return '';
  const separators = ['：', ':'];
  for (const sep of separators) {
    if (title.includes(sep)) return title.split(sep)[0].trim();
  }
  return title;
};

const getDailyQuote = (day) => {
  const quotes = [
    "「成功沒有秘訣，它是準備、苦幹以及從失敗中吸取教訓的結果。」— 柯林·鮑威爾",
    "「費曼學習法：若想真正理解一個概念，試著用最簡單的話向別人解釋它。」— 理查·費曼",
    "「精通一個領域的唯一方法，是每天進行刻意練習。」— 安德斯·艾瑞克森",
    "「今日的一小步，是明日卓越的起點。保持專注，你做得到的！」— AI 智慧助手",
    "「不要因為路途漫長而放棄，高聳的大樹也是由小小的幼苗茁壯而成。」— 學習箴言",
    "「複習是學習之母。將短暫知識轉化為長期記憶的關鍵，在於規律的間隔複習。」",
    "「遇到瓶頸時，試著將任務拆解成 20 分鐘的番茄鐘，專注完成眼前的小事。」"
  ];
  return quotes[day % quotes.length];
};

const getTodayStr = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const CalendarWidget = ({ events, setEvents }) => {
  const [currentDate, setCurrentDate] = useState(new Date()); // 基準時間為系統時間
  const [activeFilters, setActiveFilters] = useState(['red', 'blue', 'green', 'orange']);
  const [view, setView] = useState('month'); // 'day', 'week', 'month'
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);

  // Hover Card State
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [hoverPos, setHoverPos] = useState({ top: 0, left: 0 });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const changeDate = (offset) => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() + offset);
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() + offset * 7);
    } else {
      newDate.setDate(currentDate.getDate() + offset);
    }
    setCurrentDate(newDate);
  };

  const handleYearChange = (e) => {
    setCurrentDate(new Date(parseInt(e.target.value), month, currentDate.getDate()));
  };

  const handleMonthChange = (e) => {
    setCurrentDate(new Date(year, parseInt(e.target.value), currentDate.getDate()));
  };

  const toggleFilter = (type) => {
    if (activeFilters.includes(type)) {
      setActiveFilters(activeFilters.filter(f => f !== type));
    } else {
      setActiveFilters([...activeFilters, type]);
    }
  };

  const generateDays = () => {
    const days = [];
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    let startDayOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    for (let i = startDayOffset - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      days.push({ day: dayNum, muted: true, dateStr: '', events: [] });
    }

    const todayStr = getTodayStr();

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.date === dateStr && activeFilters.includes(e.type));
      days.push({ 
        day: i, 
        muted: false, 
        today: dateStr === todayStr,
        dateStr,
        events: dayEvents 
      });
    }

    const totalCells = days.length > 35 ? 42 : 35;
    let nextMonthDay = 1;
    while (days.length < totalCells) {
      days.push({ day: nextMonthDay++, muted: true, dateStr: '', events: [] });
    }

    return days;
  };

  const days = generateDays();

  // Helper to calculate weekly days
  const getWeekDays = () => {
    const weekDaysList = [];
    const current = new Date(currentDate);
    const dayVal = current.getDay();
    const diff = current.getDate() - dayVal + (dayVal === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      const dateStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.date === dateStr && activeFilters.includes(e.type));
      weekDaysList.push({
        date: nextDay,
        dateStr,
        dayNum: nextDay.getDate(),
        dayName: daysOfWeek[i],
        events: dayEvents,
        today: dateStr === getTodayStr()
      });
    }
    return weekDaysList;
  };

  // Helper for current day events
  const getDayEvents = () => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr && activeFilters.includes(e.type));
  };

  const handleDayClick = (dateStr) => {
    if (!dateStr) return;
    setSelectedDateStr(dateStr);
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (e, event) => {
    e.stopPropagation();
    setHoveredEvent(null);
    setEditingEvent(event);
    setSelectedDateStr(event.date);
    setIsModalOpen(true);
  };

  const handleSaveEvent = (newEvent) => {
    if (editingEvent) {
      setEvents(events.map(ev => ev.id === newEvent.id ? newEvent : ev));
    } else {
      setEvents([...events, newEvent]);
    }
  };

  const handleDeleteEvent = (eventId) => {
    setEvents(events.filter(ev => ev.id !== eventId));
  };

  const getEventStyle = (type, completed) => {
    let colors = {};
    switch (type) {
      case 'red': colors = { bg: '#fee2e2', text: '#b91c1c' }; break;
      case 'blue': colors = { bg: '#dbeafe', text: '#1d4ed8' }; break;
      case 'green': colors = { bg: '#dcfce7', text: '#15803d' }; break;
      case 'orange': colors = { bg: '#ffedd5', text: '#c2410c' }; break;
      default: colors = { bg: '#f3f4f6', text: '#374151' }; break;
    }
    if (completed) {
      return { 
        backgroundColor: colors.bg, 
        color: colors.text, 
        textDecoration: 'line-through', 
        opacity: 0.5,
        borderLeft: `3px solid ${colors.text}`
      };
    }
    return { 
      backgroundColor: colors.bg, 
      color: colors.text,
      borderLeft: `3px solid ${colors.text}`
    };
  };

  const handleMouseEnterEvent = (e, event) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredEvent(event);
    setHoverPos({
      top: rect.top - 125 + window.scrollY,
      left: rect.left + rect.width / 2 - 110 + window.scrollX
    });
  };

  // Generate Header text based on current view (Dynamic text color based on system theme variable)
  const getHeaderLabel = () => {
    if (view === 'month') {
      return (
        <div className={styles.selectGroup}>
          <select value={year} onChange={handleYearChange} className={styles.dateSelect}>
            {Array.from({ length: 31 }, (_, i) => 2020 + i).map(y => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
          <select value={month} onChange={handleMonthChange} className={styles.dateSelect}>
            {Array.from({length: 12}).map((_, i) => <option key={i} value={i}>{i + 1}月</option>)}
          </select>
        </div>
      );
    } else if (view === 'week') {
      const weekDays = getWeekDays();
      const first = weekDays[0].date;
      const last = weekDays[6].date;
      return (
        <span style={{ 
          fontSize: 'var(--text-h2)', 
          fontWeight: '600', 
          color: 'var(--color-text-main)',
          marginRight: '8px'
        }}>
          {first.getFullYear()}年 {first.getMonth() + 1}月{first.getDate()}日 - {last.getMonth() + 1}月{last.getDate()}日
        </span>
      );
    } else {
      return (
        <span style={{ 
          fontSize: 'var(--text-h2)', 
          fontWeight: '600', 
          color: 'var(--color-text-main)',
          marginRight: '8px'
        }}>
          {year}年 {month + 1}月{currentDate.getDate()}日
        </span>
      );
    }
  };

  return (
    <>
      <div className={styles.calendarContainer} style={{ position: 'relative' }}>
        <div className={styles.calendarHeader}>
          <div className={styles.monthNav}>
            {getHeaderLabel()}
            <div className={styles.navArrows}>
              <button className={styles.arrowBtn} onClick={() => changeDate(-1)}><ChevronLeft size={16} /></button>
              <button className={styles.arrowBtn} onClick={() => changeDate(1)}><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className={styles.viewToggle}>
            <button 
              className={`${styles.viewBtn} ${view === 'day' ? styles.active : ''}`}
              onClick={() => setView('day')}
            >
              日
            </button>
            <button 
              className={`${styles.viewBtn} ${view === 'week' ? styles.active : ''}`}
              onClick={() => setView('week')}
            >
              週
            </button>
            <button 
              className={`${styles.viewBtn} ${view === 'month' ? styles.active : ''}`}
              onClick={() => setView('month')}
            >
              月
            </button>
          </div>
        </div>

        {/* Conditional View Rendering */}
        {view === 'month' && (
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
                      className={styles.event}
                      onClick={(e) => handleEventClick(e, event)}
                      onMouseEnter={(e) => handleMouseEnterEvent(e, event)}
                      onMouseLeave={() => setHoveredEvent(null)}
                      style={{ 
                        cursor: 'pointer',
                        borderRadius: '4px',
                        padding: '3px 6px',
                        fontWeight: '500',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        ...getEventStyle(event.type, event.completed)
                      }}
                    >
                      {getDisplayTitle(event.title)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'week' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', minHeight: '300px' }}>
            {getWeekDays().map((d, index) => (
              <div 
                key={index} 
                onClick={() => handleDayClick(d.dateStr)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.015)',
                  border: `1px solid ${d.today ? 'rgba(59, 130, 246, 0.3)' : 'var(--color-border)'}`,
                  borderRadius: '10px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  minHeight: '260px',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.02)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.015)';
                  e.currentTarget.style.borderColor = d.today ? 'rgba(59, 130, 246, 0.3)' : 'var(--color-border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '600', marginBottom: '4px' }}>{d.dayName}</span>
                <span style={{ 
                  width: '26px', 
                  height: '26px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '13px', 
                  fontWeight: 'bold',
                  backgroundColor: d.today ? 'var(--color-primary)' : 'transparent',
                  color: d.today ? '#ffffff' : 'var(--color-text-main)',
                  marginBottom: '8px',
                  boxShadow: d.today ? '0 2px 6px rgba(59, 130, 246, 0.3)' : 'none'
                }}>
                  {d.dayNum}
                </span>
                
                {d.events.length === 0 ? (
                  <div 
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px dashed var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-text-muted)',
                      opacity: 0.35,
                      marginTop: '4px',
                      width: '100%',
                      minHeight: '120px',
                      fontSize: '18px',
                      fontWeight: '300',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = 0.8;
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.color = 'var(--color-primary)';
                      e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = 0.35;
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                      e.currentTarget.style.color = 'var(--color-text-muted)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span>+</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', overflowY: 'auto', flex: 1 }}>
                    {d.events.map((event, i) => (
                      <div
                        key={i}
                        onClick={(e) => handleEventClick(e, event)}
                        onMouseEnter={(e) => handleMouseEnterEvent(e, event)}
                        onMouseLeave={() => setHoveredEvent(null)}
                        style={{
                          fontSize: '10px',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          fontWeight: '500',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease',
                          ...getEventStyle(event.type, event.completed)
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.03)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
                          handleMouseEnterEvent(e, event);
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                          setHoveredEvent(null);
                        }}
                      >
                        {getDisplayTitle(event.title)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {view === 'day' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '300px', padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#a0a0a0' }}>當日共有 {getDayEvents().length} 個行程</span>
              <button 
                onClick={() => handleDayClick(`${year}-${String(month + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`)}
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '6px',
                  color: 'var(--color-primary)',
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
                }}
              >
                + 新增當日日程
              </button>
            </div>
            
            {getDayEvents().length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--color-text-muted)', gap: '8px', paddingTop: '40px' }}>
                <span style={{ fontSize: '32px' }}>🍃</span>
                <span style={{ fontSize: '13px', fontWeight: '500' }}>今天沒有排定任何行程喔！</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '280px' }}>
                {getDayEvents().sort((a,b) => (a.time || '00:00').localeCompare(b.time || '00:00')).map((event, i) => {
                  const style = getEventStyle(event.type, event.completed);
                  return (
                    <div 
                      key={i}
                      onClick={(e) => handleEventClick(e, event)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        transition: 'all 0.2s ease',
                        backgroundColor: 'rgba(255,255,255,0.015)',
                        borderLeft: style.borderLeft,
                        border: '1px solid var(--color-border)',
                        borderLeftWidth: '4px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.02)';
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.15)';
                        e.currentTarget.style.transform = 'translateX(2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.015)';
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: style.color }}>
                          {event.time ? event.time : '全天'}
                        </span>
                        <span style={{ 
                          fontSize: '10px', 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          backgroundColor: style.backgroundColor, 
                          color: style.color,
                          fontWeight: '600'
                        }}>
                          {filterTypes.find(f => f.type === event.type)?.label}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '14px', margin: 0, fontWeight: '600', color: 'var(--color-text-main)', textDecoration: event.completed ? 'line-through' : 'none', opacity: event.completed ? 0.6 : 1 }}>
                        {event.title}
                      </h4>
                      {event.notes && (
                        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                          {event.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* AI 智慧每日金句點綴 (增加畫面質感與功能性) */}
            <div style={{
              marginTop: '16px',
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(168, 85, 247, 0.06) 100%)',
              border: '1px dashed rgba(59, 130, 246, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb size={14} color="var(--color-primary)" />
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  AI 智慧每日學習箴言
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0, lineHeight: '1.5', fontWeight: '500', fontStyle: 'italic' }}>
                {getDailyQuote(currentDate.getDate())}
              </p>
            </div>
          </div>
        )}

        <div className={styles.legend} style={{ flexWrap: 'wrap', gap: '8px' }}>
          <div className={styles.legendItems} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {filterTypes.map(f => (
              <div 
                key={f.type} 
                className={styles.legendItem} 
                onClick={() => toggleFilter(f.type)}
                style={{ 
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: activeFilters.includes(f.type) ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: `1px solid ${activeFilters.includes(f.type) ? f.dotColor : 'transparent'}`,
                  transition: 'all 0.2s ease',
                  opacity: activeFilters.includes(f.type) ? 1 : 0.4
                }}
              >
                <span 
                  className={styles.dot} 
                  style={{ 
                    backgroundColor: f.dotColor,
                    boxShadow: activeFilters.includes(f.type) ? `0 0 6px ${f.dotColor}` : 'none'
                  }}
                /> 
                <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-main)' }}>{f.label}</span>
              </div>
            ))}
          </div>
          <button 
            className={styles.addBtn} 
            onClick={() => handleDayClick(`${year}-${String(month + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`)}
            style={{ fontWeight: '600', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--color-primary)' }}
          >
            + 新增日程
          </button>
        </div>

        {/* Hover card Detail (Tooltip) */}
        {hoveredEvent && (
          <div 
            style={{
              position: 'absolute',
              top: `${hoverPos.top - 120}px`,
              left: `${hoverPos.left}px`,
              width: '220px',
              backgroundColor: 'var(--color-bg-sidebar)',
              border: `1px solid ${
                hoveredEvent.type === 'red' ? '#ef4444' :
                hoveredEvent.type === 'blue' ? '#3b82f6' :
                hoveredEvent.type === 'green' ? '#22c55e' : '#f97316'
              }`,
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
              padding: '12px',
              zIndex: 9999,
              pointerEvents: 'none',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s ease-in-out',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 
                  hoveredEvent.type === 'red' ? 'rgba(239, 68, 68, 0.2)' :
                  hoveredEvent.type === 'blue' ? 'rgba(59, 130, 246, 0.2)' :
                  hoveredEvent.type === 'green' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                color: 
                  hoveredEvent.type === 'red' ? '#b91c1c' :
                  hoveredEvent.type === 'blue' ? '#1d4ed8' :
                  hoveredEvent.type === 'green' ? '#15803d' : '#c2410c',
              }}>
                {
                  hoveredEvent.type === 'red' ? '考試/截止' :
                  hoveredEvent.type === 'blue' ? '課程' :
                  hoveredEvent.type === 'green' ? '活動' : '個人備忘'
                }
              </span>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                {hoveredEvent.time ? hoveredEvent.time : '全天'}
              </span>
            </div>
            <h4 style={{ fontSize: '13px', margin: 0, fontWeight: '600', color: 'var(--color-text-main)' }}>
              {hoveredEvent.title}
            </h4>
            {hoveredEvent.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--color-text-muted)' }}>
                <MapPin size={10} />
                <span>{hoveredEvent.location}</span>
              </div>
            )}
            {hoveredEvent.notes && (
              <p style={{ 
                fontSize: '11px', 
                margin: '4px 0 0 0', 
                color: 'var(--color-text-muted)', 
                lineHeight: '1.4',
                borderTop: '1px solid var(--color-border)',
                paddingTop: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                {hoveredEvent.notes}
              </p>
            )}
          </div>
        )}
      </div>

      <EventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        initialDate={selectedDateStr}
        existingEvent={editingEvent}
      />
    </>
  );
};

export default CalendarWidget;
