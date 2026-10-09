import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';
import styles from './FeedbackManager.module.css';

const FeedbackManager = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch('/api/feedbacks');
      const json = await res.json();
      if (json.success) setFeedbacks(json.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/feedbacks/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setFeedbacks(feedbacks.map(f => f._id === id ? { ...f, status: newStatus } : f));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'resolved': return <CheckCircle size={16} color="#10b981" />;
      case 'ignored': return <XCircle size={16} color="#ef4444" />;
      default: return <Clock size={16} color="#f59e0b" />;
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'resolved': return '已解決';
      case 'ignored': return '已忽略';
      default: return '待處理';
    }
  };
  
  const getTypeLabel = (type) => {
    switch(type) {
      case 'error': return '題目報錯';
      case 'suggestion': return '題目建議';
      case 'rating': return '品質評分';
      case 'system_error': return '系統異常';
      case 'system_suggestion': return '系統建議';
      default: return type;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2><MessageSquare size={24}/> 用戶反饋與回報管理</h2>
      </div>

      {loading ? (
        <p>載入中...</p>
      ) : (
        <div className={styles.cardList}>
          {feedbacks.map(feedback => (
            <div key={feedback._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.typeBadge}>{getTypeLabel(feedback.type)}</span>
                <span className={styles.date}>{new Date(feedback.createdAt).toLocaleString()}</span>
              </div>
              <div className={styles.cardBody}>
                {feedback.questionId && (
                  <div className={styles.questionInfo}>
                    <strong>關聯題目：</strong> 
                    {feedback.questionId.topic || feedback.questionId}
                  </div>
                )}
                {feedback.type === 'rating' && (
                  <div className={styles.ratingInfo}>
                    <strong>評分：</strong> {feedback.rating} 星
                  </div>
                )}
                <div className={styles.content}>
                  <strong>內容：</strong>
                  <p>{feedback.content}</p>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <div className={styles.statusDisplay}>
                  {getStatusIcon(feedback.status)} {getStatusText(feedback.status)}
                </div>
                <div className={styles.actions}>
                  {feedback.status !== 'resolved' && (
                    <button onClick={() => handleStatusChange(feedback._id, 'resolved')} className={styles.resolveBtn}>
                      標示為已解決
                    </button>
                  )}
                  {feedback.status !== 'ignored' && (
                    <button onClick={() => handleStatusChange(feedback._id, 'ignored')} className={styles.ignoreBtn}>
                      忽略
                    </button>
                  )}
                  {feedback.status !== 'pending' && (
                    <button onClick={() => handleStatusChange(feedback._id, 'pending')} className={styles.pendingBtn}>
                      移回待處理
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {feedbacks.length === 0 && <p className={styles.empty}>目前沒有反饋紀錄。</p>}
        </div>
      )}
    </div>
  );
};

export default FeedbackManager;
