import React, { useState } from 'react';
import { AlertCircle, X, Check, Send } from 'lucide-react';
import styles from './QuestionFeedbackModal.module.css';

const QuestionFeedbackModal = ({
  isOpen,
  questionId,
  question,
  isSystemMode = false,
  onClose,
  onSubmit,
  onSubmitSuccess
}) => {
  // If isOpen is explicitly passed as false, do not render
  if (isOpen !== undefined && !isOpen) return null;

  const resolvedQuestionId = questionId || question?._id || question?.id || null;
  const questionTitle = question?.title || question?.questionText || null;

  const [type, setType] = useState(isSystemMode ? 'system_error' : 'error');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && type !== 'rating') return;
    setLoading(true);

    const feedbackData = {
      questionId: resolvedQuestionId,
      type,
      content: content.trim() || (type === 'rating' ? `評分：${rating} 星` : ''),
      rating: type === 'rating' ? rating : undefined
    };

    try {
      if (onSubmit) {
        await onSubmit(feedbackData);
      } else {
        // 預設直接呼叫後端 API
        await fetch('/api/feedbacks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feedbackData)
        });
      }

      setSubmitted(true);
      if (onSubmitSuccess) onSubmitSuccess();

      setTimeout(() => {
        setSubmitted(false);
        setContent('');
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      console.error('送出反饋失敗:', err);
      alert('送出反饋失敗，請稍後重試。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>
            <AlertCircle size={20} color="#ef4444" />
            {isSystemMode ? '系統問題與功能建議' : '題目問題回報與反饋'}
          </h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="關閉">
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div className={styles.successState}>
            <Check size={48} color="#10b981" style={{ margin: '0 auto' }} />
            <h4 className={styles.successTitle}>反饋已成功送出！</h4>
            <p className={styles.successDesc}>
              感謝您的寶貴意見，團隊將持續優化系統與題目品質。
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {questionTitle && (
              <div className={styles.questionSnippet}>
                <strong>關聯題目：</strong> {questionTitle}
              </div>
            )}

            <div className={styles.formGroup}>
              <label>反饋類型</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {isSystemMode ? (
                  <>
                    <option value="system_error">系統錯誤回報 (如畫面異常、連線中斷)</option>
                    <option value="system_suggestion">系統功能建議</option>
                  </>
                ) : (
                  <>
                    <option value="error">題目報錯 (如選項錯誤、答案有誤、錯字)</option>
                    <option value="suggestion">建議與討論 (解析優化、題目難度調整)</option>
                    <option value="rating">題目品質評分</option>
                  </>
                )}
              </select>
            </div>

            {type === 'rating' && (
              <div className={styles.formGroup}>
                <label>品質評分 (1~5 星)</label>
                <div className={styles.stars}>
                  {[1, 2, 3, 4, 5].map((num) => (
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
              <label>詳細說明</label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  isSystemMode
                    ? '請詳細描述您遇到的問題或希望新增的功能...'
                    : '請描述題目問題所在（例如：選項 B 缺少條件、題目敘述不清...）'
                }
                required={type !== 'rating'}
              />
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                取消
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading || (!content.trim() && type !== 'rating')}
              >
                {loading ? '送出中...' : (
                  <>
                    <Send size={16} /> 送出反饋
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default QuestionFeedbackModal;
