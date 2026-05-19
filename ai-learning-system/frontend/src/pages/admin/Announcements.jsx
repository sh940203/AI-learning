import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './Announcements.module.css';

const Announcements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', tag: '一般', isVisible: true, isPinned: false });
  
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/announcements', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setIsEditing(true);
      setCurrentId(item._id);
      setFormData({
        title: item.title,
        content: item.content,
        tag: item.tag || '一般',
        isVisible: item.isVisible !== false,
        isPinned: item.isPinned || false
      });
    } else {
      setIsEditing(false);
      setCurrentId(null);
      setFormData({ title: '', content: '', tag: '一般', isVisible: true, isPinned: false });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) return alert('請填寫標題與內容');
    
    try {
      const token = localStorage.getItem('token');
      const method = isEditing ? 'PUT' : 'POST';
      const endpoint = isEditing ? `/api/announcements/${currentId}` : '/api/announcements';
      
      const res = await fetch(endpoint, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        fetchAnnouncements();
        setShowModal(false);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`儲存失敗: ${errorData.message || '請確認您已登入'}`);
        console.error('Save failed:', errorData);
      }
    } catch (err) {
      console.error(err);
      alert('發生網路錯誤，請稍後再試');
    }
  };

  const toggleVisibility = async (item) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/announcements/${item._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isVisible: !item.isVisible })
      });
      if (res.ok) {
        fetchAnnouncements();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/announcements/${deleteConfirm}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAnnouncements();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>公告系統管理</h2>
        <button className={styles.addBtn} onClick={() => handleOpenModal()}>
          <Plus size={16} /> 新增公告
        </button>
      </div>

      <div className={styles.list}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>發布時間</th>
              <th>標籤</th>
              <th>標題</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center' }}>載入中...</td></tr>
            ) : announcements.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center' }}>目前沒有任何公告</td></tr>
            ) : (
              announcements.map(item => (
                <tr key={item._id}>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`${styles.tag} ${styles[item.tag] || styles.一般}`}>
                      {item.tag || '一般'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.isPinned && <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 'bold' }}>[置頂]</span>}
                      {item.title}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${item.isVisible !== false ? styles.statusVisible : styles.statusHidden}`}>
                      {item.isVisible !== false ? '顯示中' : '已隱藏'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} onClick={() => toggleVisibility(item)} title={item.isVisible !== false ? "設為隱藏" : "設為顯示"}>
                        {item.isVisible !== false ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button className={styles.actionBtn} onClick={() => handleOpenModal(item)}>
                        <Edit2 size={16} />
                      </button>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => setDeleteConfirm(item._id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>{isEditing ? '編輯公告' : '新增公告'}</h3>
            
            <div className={styles.formGroup}>
              <label>標題</label>
              <input 
                type="text" 
                className={styles.modalInput} 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className={styles.formGroup}>
              <label>標籤</label>
              <select 
                className={styles.modalSelect}
                value={formData.tag}
                onChange={(e) => setFormData({...formData, tag: e.target.value})}
              >
                <option value="一般">一般</option>
                <option value="重要">重要</option>
                <option value="系統">系統</option>
                <option value="更新">更新</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>內容</label>
              <textarea 
                className={styles.modalTextarea} 
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
              />
            </div>

            <div className={styles.formGroup} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <input 
                type="checkbox" 
                id="isVisible" 
                checked={formData.isVisible}
                onChange={(e) => setFormData({...formData, isVisible: e.target.checked})}
              />
              <label htmlFor="isVisible" style={{marginBottom: 0}}>立即發布 (顯示於前端)</label>
            </div>

            <div className={styles.formGroup} style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '-8px'}}>
              <input 
                type="checkbox" 
                id="isPinned" 
                checked={formData.isPinned}
                onChange={(e) => setFormData({...formData, isPinned: e.target.checked})}
              />
              <label htmlFor="isPinned" style={{marginBottom: 0, color: '#d97706'}}>設為置頂公告</label>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>取消</button>
              <button className={styles.confirmBtn} onClick={handleSave}>儲存</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ width: '400px' }}>
            <h3>確認刪除</h3>
            <p>確定要刪除這筆公告嗎？此動作無法復原。</p>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>取消</button>
              <button className={`${styles.confirmBtn} ${styles.dangerBtn}`} onClick={confirmDelete}>刪除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
