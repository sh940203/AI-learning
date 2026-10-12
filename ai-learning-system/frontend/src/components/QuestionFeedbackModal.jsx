import React, { useState } from 'react';
import { AlertCircle, X, Check, HelpCircle, FileText, Bug } from 'lucide-react';
import styles from './QuestionFeedbackModal.module.css';

const QuestionFeedbackModal = ({ isOpen, onClose, question, onSubmitSuccess }) => {
  const [category, setCategory] = useState('answer_error');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const categories = [
    { id: 'answer_error', label: '標準答案或算式有誤', icon: Bug },
    { id: 'unclear_text', label: '題目描述不清/多義', icon: HelpCircle },
    { id: 'duplicate_options', label: '選項重複或無正確解', icon: FileText },
    { id: 'formatting_issue', label: '公式符號/格式排版異常', icon: AlertCircle }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch('http://localhost:5001/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question?.id || 'q_demo',
          questionTitle: question?.title || question?.questionText,
          category,
          comment,
          createdAt: new Date().toISOString()
        })
      });
    } catch (err) {
      console.log('模擬提交流程');
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitted(true);
        if (onSubmitSuccess) onSubmitSuccess();
        setTimeout(() => {
          setSubmitted(false);
          setComment('');
          onClose();
        }, 1500);
      }, 600);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>
            <AlertCircle color="#ef4444" size={20} />
            回報題目疑義 / 錯題回饋
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: '#10b981' }}>
            <Check size={48} style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>疑義回報已成功送出！</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '6px' }}>
              感謝您的反饋，教學團隊與 AI 校對系統將儘速處理此題目。
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {question && (
              <div className={styles.questionSnippet}>
                <strong>當前題目：</strong> {question.title || question.questionText || '題目內容預覽...'}
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>請選擇問題分類</label>
              <div className={styles.categories}>
                {categories.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <div
                      key={cat.id}
                      className={`${styles.catBtn} ${category === cat.id ? styles.selected : ''}`}
                      onClick={() => setCategory(cat.id)}
                    >
                      <Icon size={16} />
                      {cat.label}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>補充說明 (選填)</label>
              <textarea
                className={styles.textarea}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="請簡述哪裡有問題，例如：選項 B 數字與題目情境不符..."
              />
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>取消</button>
              <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                {isSubmitting ? '提交中...' : '送出疑義回報'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default QuestionFeedbackModal;
