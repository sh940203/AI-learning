import React, { useState, useRef } from 'react';
import { UploadCloud, File, CheckCircle } from 'lucide-react';
import styles from './FileUpload.module.css';

const FileUpload = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const uploadFile = async (file) => {
    setSelectedFile(file);
    setUploadProgress(10);
    
    if (file.type !== 'application/pdf') {
      alert('目前僅支援上傳 PDF 檔案作為知識庫！');
      setSelectedFile(null);
      setUploadProgress(0);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5001/api/upload/document', {
        method: 'POST',
        body: formData
      });
      
      setUploadProgress(50);
      const data = await response.json();
      setUploadProgress(100);

      if (data.success && onUploadSuccess) {
        onUploadSuccess(data);
      } else if (!data.success) {
        alert('上傳失敗: ' + data.message);
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('上傳錯誤', error);
      alert('上傳發生錯誤');
      setSelectedFile(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  return (
    <div 
      className={`${styles.uploadZone} ${isDragging ? styles.dragging : ''} ${selectedFile ? styles.hasFile : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => !selectedFile && fileInputRef.current.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileSelect}
      />

      {!selectedFile ? (
        <>
          <div className={styles.iconWrapper}>
            <UploadCloud size={32} color={isDragging ? 'var(--color-primary)' : 'var(--color-outline)'} />
          </div>
          <h3>上傳您的檔案進行提問或測驗</h3>
          <p>支援 Word、PPT、PDF、圖片、純文字</p>
          <button className={styles.uploadBtn} onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}>選擇檔案</button>
        </>
      ) : (
        <div className={styles.uploadProgressView}>
          <div className={styles.fileDetails}>
            <File size={24} className={styles.fileIcon} />
            <div className={styles.fileInfoText}>
              <span className={styles.fileName}>{selectedFile.name}</span>
              <span className={styles.fileSize}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            {uploadProgress === 100 && <CheckCircle size={20} color="#22c55e" />}
          </div>
          <div className={styles.progressBarWrapper}>
            <div className={styles.progressBarFill} style={{ width: `${uploadProgress}%` }}></div>
          </div>
          <p className={styles.progressText}>
            {uploadProgress < 100 ? `上傳中... ${uploadProgress}%` : '上傳完成！準備進行 AI 分析...'}
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
