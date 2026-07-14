import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, Loader2, CheckCircle, Edit, Trash2 } from 'lucide-react';
import styles from './KnowledgeBaseManager.module.css';

const KnowledgeBaseManager = () => {
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({ title: '', subject: '', chapter: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [kbItems, setKbItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchKbItems();
  }, []);

  const fetchKbItems = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/admin/knowledge');
      const data = await res.json();
      if (data.success) setKbItems(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('請上傳 PDF 格式的教材檔案');
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name.replace('.pdf', '') }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert('請選擇要上傳的 PDF 檔案');
    if (!formData.subject || !formData.chapter) return alert('請填寫科目與章節');

    setIsUploading(true);
    setSuccessMsg('');

    const submitData = new FormData();
    submitData.append('file', selectedFile);
    submitData.append('title', formData.title);
    submitData.append('subject', formData.subject);
    submitData.append('chapter', formData.chapter);

    try {
      const response = await fetch('http://localhost:5001/api/admin/knowledge/upload', {
        method: 'POST',
        body: submitData
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg(`成功上傳教材並解析建檔：「${data.data.title}」`);
        setSelectedFile(null);
        setFormData({ title: '', subject: '', chapter: '' });
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchKbItems();
      } else {
        alert('上傳失敗: ' + data.message);
      }
    } catch (error) {
      console.error('Upload Error:', error);
      alert('網路或伺服器錯誤，上傳失敗');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除這份教材嗎？這會從中央知識庫移除。')) return;
    try {
      const res = await fetch(`http://localhost:5001/api/admin/knowledge/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) fetchKbItems();
      else alert(data.message);
    } catch (e) {
      console.error(e);
      alert('刪除失敗');
    }
  };

  const handleEditSave = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/admin/knowledge/${editingItem._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingItem)
      });
      const data = await res.json();
      if (data.success) {
        setEditingItem(null);
        fetchKbItems();
      } else alert(data.message);
    } catch (e) {
      console.error(e);
      alert('更新失敗');
    }
  };



  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>中央知識庫管理</h1>
      </div>

      <div className={styles.uploadCard}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>科目 (Subject)</label>
            <input 
              type="text" 
              name="subject" 
              value={formData.subject} 
              onChange={handleInputChange} 
              className={styles.input} 
              placeholder="例如：會計學、經濟學、數位科技"
              required 
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>章節 (Chapter)</label>
            <input 
              type="text" 
              name="chapter" 
              value={formData.chapter} 
              onChange={handleInputChange} 
              className={styles.input} 
              placeholder="例如：CH1 會計基本概念"
              required 
            />
          </div>

          <div className={styles.formGroup}>
            <label>教材標題 (Title)</label>
            <input 
              type="text" 
              name="title" 
              value={formData.title} 
              onChange={handleInputChange} 
              className={styles.input} 
              placeholder="教材名稱 (未填將預設使用檔名)"
            />
          </div>

          <div className={styles.formGroup} style={{ marginTop: '24px' }}>
            <label>上傳 PDF 講義檔案</label>
            <div className={styles.fileInputArea} onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                accept=".pdf" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
              />
              {selectedFile ? (
                <>
                  <FileText size={48} color="var(--color-primary)" />
                  <h3>{selectedFile.name}</h3>
                  <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <UploadCloud size={48} color="var(--color-text-muted)" />
                  <h3>點擊選擇 PDF 檔案</h3>
                  <p>系統將自動解析文字內容並存入中央知識庫</p>
                </>
              )}
            </div>
          </div>

          {successMsg && (
            <div className={styles.successMessage}>
              <CheckCircle size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
              {successMsg}
            </div>
          )}

          <button type="submit" className={styles.submitBtn} disabled={isUploading || !selectedFile}>
            {isUploading ? (
              <>
                <Loader2 size={20} className={styles.spinner} style={{ animation: 'spin 1s linear infinite' }} />
                解析建檔中...
              </>
            ) : (
              '上傳並加入知識庫'
            )}
          </button>
        </form>
      </div>

      <div className={styles.listCard}>
        <h2 className={styles.listTitle}>已建立的中央知識庫檔案</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>標題</th>
                <th>科目</th>
                <th>章節</th>
                <th>建立時間</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {kbItems.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '24px'}}>尚無任何教材資料</td></tr>
              ) : (
                kbItems.map(item => (
                  <tr key={item._id}>
                    <td>{item.title}</td>
                    <td>{item.subject}</td>
                    <td>{item.chapter}</td>
                    <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className={styles.actions}>
                      <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => setEditingItem(item)} title="編輯">
                        <Edit size={16} />
                      </button>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(item._id)} title="刪除">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingItem && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>編輯教材資訊</h3>
            <div className={styles.formGroup}>
              <label>標題</label>
              <input className={styles.input} value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} />
            </div>
            <div className={styles.formGroup}>
              <label>科目</label>
              <input className={styles.input} value={editingItem.subject} onChange={e => setEditingItem({...editingItem, subject: e.target.value})} />
            </div>
            <div className={styles.formGroup}>
              <label>章節</label>
              <input className={styles.input} value={editingItem.chapter} onChange={e => setEditingItem({...editingItem, chapter: e.target.value})} />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setEditingItem(null)}>取消</button>
              <button className={styles.saveBtn} onClick={handleEditSave}>儲存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBaseManager;
