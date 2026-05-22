import React, { useState, useEffect } from 'react';
import { X, Users, Clock, MapPin, AlignLeft, Trash2 } from 'lucide-react';
import styles from './EventModal.module.css';

const categories = [
  { type: 'red', label: '考試/截止', color: '#ef4444' },
  { type: 'blue', label: '學術課程', color: '#3b82f6' },
  { type: 'green', label: '課外活動', color: '#22c55e' },
  { type: 'orange', label: '個人備忘', color: '#f97316' }
];

const EventModal = ({ isOpen, onClose, onSave, onDelete, initialDate, existingEvent }) => {
  const [title, setTitle] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [invitees, setInvitees] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedType, setSelectedType] = useState('blue');

  useEffect(() => {
    if (isOpen) {
      if (existingEvent) {
        setTitle(existingEvent.title || '');
        setIsAllDay(existingEvent.isAllDay || false);
        setDate(existingEvent.date || '');
        setTime(existingEvent.time || '09:00');
        setInvitees(existingEvent.invitees || '');
        setLocation(existingEvent.location || '');
        setNotes(existingEvent.notes || '');
        setSelectedType(existingEvent.type || 'blue');
      } else {
        setTitle('');
        setIsAllDay(false);
        setDate(initialDate || new Date().toISOString().split('T')[0]);
        setTime('09:00');
        setInvitees('');
        setLocation('');
        setNotes('');
        setSelectedType('blue');
      }
    }
  }, [isOpen, initialDate, existingEvent]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title) {
      alert("請填寫活動名稱");
      return;
    }
    const newEvent = {
      id: existingEvent ? existingEvent.id : Date.now(),
      title,
      date,
      time: isAllDay ? null : time,
      isAllDay,
      invitees,
      location,
      notes,
      type: selectedType,
      completed: existingEvent ? existingEvent.completed : false
    };
    onSave(newEvent);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerTitle}>{existingEvent ? '編輯活動' : '新增活動'}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          {/* Title Input */}
          <div className={styles.inputGroup}>
            <div className={styles.iconPlaceholder}></div>
            <input 
              type="text" 
              placeholder="輸入活動名稱" 
              className={styles.titleInput}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Color Category Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '32px' }}>
            <span style={{ fontSize: '13px', color: '#a0a0a0' }}>活動類別色彩標籤</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              {categories.map((cat) => (
                <button
                  key={cat.type}
                  type="button"
                  title={cat.label}
                  onClick={() => setSelectedType(cat.type)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: cat.color,
                    border: selectedType === cat.type ? '3px solid #ffffff' : 'none',
                    cursor: 'pointer',
                    boxShadow: selectedType === cat.type ? '0 0 8px rgba(255,255,255,0.6)' : 'none',
                    transition: 'all 0.2s ease',
                    transform: selectedType === cat.type ? 'scale(1.15)' : 'scale(1)'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Invitees */}
          <div className={styles.inputGroup}>
            <Users size={20} className={styles.icon} />
            <input 
              type="text" 
              placeholder="邀請人員" 
              className={styles.standardInput}
              value={invitees}
              onChange={(e) => setInvitees(e.target.value)}
            />
          </div>

          {/* Date & Time Settings */}
          <div className={styles.timeSettingsGroup}>
            <div className={styles.timeSettingsRow}>
              <Clock size={20} className={styles.icon} />
              <span className={styles.label}>全天</span>
              <label className={styles.switch}>
                <input 
                  type="checkbox" 
                  checked={isAllDay} 
                  onChange={(e) => setIsAllDay(e.target.checked)} 
                />
                <span className={styles.slider}></span>
              </label>
            </div>
            
            <div className={styles.timeSettingsRow} style={{ paddingLeft: '32px' }}>
              <div className={styles.dateSelector}>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  className={styles.dateInput}
                />
              </div>
              {!isAllDay && (
                <div className={styles.dateSelector}>
                  <input 
                    type="time" 
                    value={time} 
                    onChange={(e) => setTime(e.target.value)}
                    className={styles.dateInput}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className={styles.inputGroup}>
            <MapPin size={20} className={styles.icon} />
            <input 
              type="text" 
              placeholder="位置" 
              className={styles.standardInput}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className={styles.inputGroup} style={{ alignItems: 'flex-start' }}>
            <AlignLeft size={20} className={styles.icon} style={{ marginTop: '12px' }} />
            <textarea 
              placeholder="記事" 
              className={styles.textArea}
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className={styles.footer}>
          {existingEvent ? (
            <button 
              className={styles.discardBtn} 
              style={{ borderColor: '#ef4444', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => {
                if (window.confirm("確定要刪除此活動嗎？")) {
                  onDelete(existingEvent.id);
                  onClose();
                }
              }}
            >
              <Trash2 size={16} /> 刪除活動
            </button>
          ) : (
            <div style={{ flex: 1 }}></div>
          )}
          <div className={styles.actionButtons}>
            <button className={styles.discardBtn} onClick={onClose}>捨棄</button>
            <button className={styles.saveBtn} onClick={handleSave}>儲存</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
