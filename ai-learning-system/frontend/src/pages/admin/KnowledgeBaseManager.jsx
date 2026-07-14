import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './KnowledgeBaseManager.module.css';

const KnowledgeBaseManager = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    chapter: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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
    if (!selectedFile) {
      alert('請選擇要上傳的 PDF 檔案');
      return;
    }
    if (!formData.subject || !formData.chapter) {
      alert('請填寫科目與章節');
      return;
    }

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
        headers: {
          'Authorization': `Bearer ${user?.token}`
        },
        body: submitData
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccessMsg(`成功上傳教材並解析建檔：「${data.data.title}」`);
        setSelectedFile(null);
        setFormData({ title: '', subject: '', chapter: '' });
        if (fileInputRef.current) fileInputRef.current.value = '';
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
    </div>
  );
};

export default KnowledgeBaseManager;
