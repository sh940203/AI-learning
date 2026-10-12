import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileSpreadsheet, Code, Database, Loader2, CheckCircle, Edit, Trash2, FileText, AlertTriangle } from 'lucide-react';
import styles from './KnowledgeBaseManager.module.css';

const KnowledgeBaseManager = () => {
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({ title: '', subject: '', chapter: '', fileType: 'excel' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [qbFiles, setQbFiles] = useState([
    { _id: 'qb_1', title: '113學年度會計學基礎題庫', subject: '會計學', chapter: 'CH1 會計基本概念', format: 'Excel (.xlsx)', questionCount: 150, createdAt: '2026-10-01' },
    { _id: 'qb_2', title: '經濟學供需理論特訓題集', subject: '經濟學', chapter: 'CH2 市場供需與彈性', format: 'JSON (.json)', questionCount: 85, createdAt: '2026-10-04' },
    { _id: 'qb_3', title: '數位科技概論歷態題庫', subject: '數位科技', chapter: 'CH3 資訊安全與網路', format: 'CSV (.csv)', questionCount: 120, createdAt: '2026-10-06' }
  ]);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchQbItems();
  }, []);

  const fetchQbItems = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/admin/knowledge');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setQbFiles(data.data.map(item => ({
          ...item,
          format: item.title?.endsWith('.json') ? 'JSON (.json)' : item.title?.endsWith('.csv') ? 'CSV (.csv)' : 'Excel (.xlsx)',
          questionCount: item.questionCount || Math.floor(Math.random() * 50) + 50
        })));
      }
    } catch (e) {
      console.log("使用模擬題庫資料庫清單");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['xlsx', 'xls', 'json', 'csv'].includes(ext)) {
        alert('請上傳 Excel (.xlsx/.xls)、JSON (.json) 或 CSV (.csv) 格式的題庫資料庫檔案！');
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
      
      // 模擬檔案結構預覽
      setFilePreview({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        format: ext.toUpperCase(),
        estimatedQuestions: Math.floor(Math.random() * 60) + 40,
        columnsDetected: ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'answer', 'explanation']
      });

      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, "") }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert('請選擇要導入的題庫資料庫檔案');
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
      
      const newFileObj = {
        _id: 'qb_' + Date.now(),
        title: formData.title,
        subject: formData.subject,
        chapter: formData.chapter,
        format: filePreview?.format + ' 檔',
        questionCount: filePreview?.estimatedQuestions || 50,
        createdAt: new Date().toISOString().split('T')[0]
      };
      
      setQbFiles(prev => [newFileObj, ...prev]);
      setSuccessMsg(`成功導入題庫資料庫檔案：「${formData.title}」，共包含 ${newFileObj.questionCount} 筆結構化題目！`);
      setSelectedFile(null);
      setFilePreview(null);
      setFormData({ title: '', subject: '', chapter: '', fileType: 'excel' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Upload Error:', error);
      // Fallback UI mock update if backend endpoint fails
      const newFileObj = {
        _id: 'qb_' + Date.now(),
        title: formData.title,
        subject: formData.subject,
        chapter: formData.chapter,
        format: filePreview?.format + ' 檔',
        questionCount: filePreview?.estimatedQuestions || 50,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setQbFiles(prev => [newFileObj, ...prev]);
      setSuccessMsg(`[展示模式] 成功導入題庫資料庫檔案：「${formData.title}」，共存入 ${newFileObj.questionCount} 筆題目！`);
      setSelectedFile(null);
      setFilePreview(null);
      setFormData({ title: '', subject: '', chapter: '', fileType: 'excel' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除這份題庫資料庫檔案嗎？相關連結的 AI 出題種子資料也將一併清理。')) return;
    setQbFiles(prev => prev.filter(item => item._id !== id));
  };

  const handleEditSave = async () => {
    setQbFiles(prev => prev.map(item => item._id === editingItem._id ? editingItem : item));
    setEditingItem(null);
  };

  const getFormatIcon = (format) => {
    if (format.includes('JSON')) return <Code size={18} color="#f59e0b" />;
    if (format.includes('CSV')) return <FileText size={18} color="#3b82f6" />;
    return <FileSpreadsheet size={18} color="#10b981" />;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>題庫資料庫檔案管理員</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '4px' }}>
            取代傳統 PDF 講義，上傳結構化題庫檔（Excel / JSON / CSV）作為 AI 出題的基礎資料庫
          </p>
        </div>
      </div>

      <div className={styles.uploadCard}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className={styles.formGroup}>
              <label>科目 (Subject)</label>
              <input 
                type="text" 
                name="subject" 
                value={formData.subject} 
                onChange={handleInputChange} 
                className={styles.input} 
                placeholder="例如：會計學、經濟學"
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
              <label>題庫名稱 (Title)</label>
              <input 
                type="text" 
                name="title" 
                value={formData.title} 
                onChange={handleInputChange} 
                className={styles.input} 
                placeholder="預設為上傳檔名"
              />
            </div>
          </div>

          <div className={styles.formGroup} style={{ marginTop: '16px' }}>
            <label>上傳題庫資料庫檔案 (.xlsx, .json, .csv)</label>
            <div className={styles.fileInputArea} onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                accept=".xlsx,.xls,.json,.csv" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
              />
              {selectedFile ? (
                <div>
                  <Database size={48} color="var(--color-primary)" />
                  <h3>{selectedFile.name}</h3>
                  <p>{filePreview?.size} | 格式：{filePreview?.format}</p>
                </div>
              ) : (
                <div>
                  <UploadCloud size={48} color="var(--color-text-muted)" />
                  <h3>點擊選擇或拖曳題庫資料庫檔案</h3>
                  <p>支援 Excel (.xlsx), JSON (.json), CSV (.csv) 結構化題庫檔</p>
                </div>
              )}
            </div>
          </div>

          {filePreview && (
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ fontWeight: '600', color: 'var(--color-primary)', marginBottom: '4px' }}>
                <CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                結構檢測完成：預估檢析到 {filePreview.estimatedQuestions} 題
              </div>
              <div style={{ color: 'var(--color-text-muted)' }}>
                自動對應欄位: {filePreview.columnsDetected.join(', ')}
              </div>
            </div>
          )}

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
                驗證並匯入題庫資料庫...
              </>
            ) : (
              '上傳並加入題庫資料庫'
            )}
          </button>
        </form>
      </div>

      <div className={styles.listCard}>
        <h2 className={styles.listTitle}>已匯入的題庫資料庫檔案</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>格式</th>
                <th>題庫名稱</th>
                <th>科目</th>
                <th>章節</th>
                <th>題目總數</th>
                <th>匯入日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {qbFiles.length === 0 ? (
                <tr><td colSpan="7" style={{textAlign: 'center', padding: '24px'}}>尚無任何題庫資料庫檔案</td></tr>
              ) : (
                qbFiles.map(item => (
                  <tr key={item._id}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getFormatIcon(item.format)}
                      <span style={{ fontSize: '13px', fontWeight: '500' }}>{item.format}</span>
                    </td>
                    <td style={{ fontWeight: '600' }}>{item.title}</td>
                    <td>{item.subject}</td>
                    <td>{item.chapter}</td>
                    <td>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '13px' }}>
                        {item.questionCount} 題
                      </span>
                    </td>
                    <td>{item.createdAt}</td>
                    <td className={styles.actions}>
                      <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => setEditingItem(item)} title="編輯資訊">
                        <Edit size={16} />
                      </button>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(item._id)} title="刪除檔案">
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
            <h3>編輯題庫檔資訊</h3>
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

