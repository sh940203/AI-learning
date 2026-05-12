import React, { useState, useEffect } from 'react';
import { X, Users, Clock, MapPin, AlignLeft, Calendar as CalendarIcon } from 'lucide-react';
import styles from './EventModal.module.css';

const EventModal = ({ isOpen, onClose, onSave, initialDate, existingEvent }) => {
  const [title, setTitle] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [invitees, setInvitees] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

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
      } else {
        setTitle('');
        setIsAllDay(false);
        setDate(initialDate || new Date().toISOString().split('T')[0]);
        setTime('09:00');
        setInvitees('');
        setLocation('');
        setNotes('');
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
      type: existingEvent ? existingEvent.type : 'blue' // keep existing color or default blue
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
            <span className={styles.headerTitle}>{existingEvent ? '編輯活動' : 'Calendar'}</span>
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
              placeholder="新增活動" 
              className={styles.titleInput}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
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
          <button className={styles.moreOptionsBtn}>更多選項</button>
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
