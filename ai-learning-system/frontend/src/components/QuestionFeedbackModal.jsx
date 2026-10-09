import React, { useState } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import styles from './QuestionFeedbackModal.module.css';

const QuestionFeedbackModal = ({ questionId, isSystemMode = false, onClose, onSubmit }) => {
  const [type, setType] = useState(isSystemMode ? 'system_error' : 'error');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    const feedbackData = { type, content, questionId };
    if (type === 'rating') {
      feedbackData.rating = rating;
    }
    await onSubmit(feedbackData);
    setLoading(false);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3><AlertCircle size={20} /> {isSystemMode ? '系統問題與建議回饋' : '問題反饋與報錯'}</h3>
          <button className={styles.closeBtn} onClick={onClose}><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>反饋類型</label>
            <select value={type} onChange={e => setType(e.target.value)}>
              {isSystemMode ? (
                <>
                  <option value="system_error">系統錯誤回報 (如畫面異常、無法登入)</option>
                  <option value="system_suggestion">系統功能建議</option>
                </>
              ) : (
                <>
                  <option value="error">題目報錯 (如選項錯誤、錯字)</option>
                  <option value="suggestion">建議與討論</option>
                  <option value="rating">品質評分</option>
                </>
              )}
            </select>
          </div>

          {type === 'rating' && (
            <div className={styles.formGroup}>
              <label>評分 (1~5)</label>
              <div className={styles.stars}>
                {[1,2,3,4,5].map(num => (
                  <span 
                    key={num} 
                    className={`${styles.star} ${rating >= num ? styles.activeStar : ''}`}
                    onClick={() => setRating(num)}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label>反饋內容</label>
            <textarea 
              rows={4} 
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="請詳細描述您的問題或建議..."
              required
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>取消</button>
            <button type="submit" className={styles.submitBtn} disabled={loading || !content.trim()}>
              {loading ? '送出中...' : <><Send size={16}/> 提交反饋</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionFeedbackModal;
