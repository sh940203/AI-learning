import React, { useState, useRef } from 'react';
import { UploadCloud, File, CheckCircle } from 'lucide-react';
import styles from './FileUpload.module.css';

const FileUpload = () => {
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

  const simulateUpload = (file) => {
    setSelectedFile(file);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      simulateUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      simulateUpload(files[0]);
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
