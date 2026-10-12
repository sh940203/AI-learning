import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Flag, Check } from 'lucide-react';
import QuestionFeedbackModal from './QuestionFeedbackModal';

const FeedbackRatingBar = ({ question }) => {
  const [voted, setVoted] = useState(null); // 'up' | 'down' | null
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleVote = (type) => {
    if (voted === type) {
      setVoted(null);
    } else {
      setVoted(type);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: '16px',
      paddingTop: '12px',
      borderTop: '1px dashed var(--color-border)',
      fontSize: '13px',
      color: 'var(--color-text-muted)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span>這題 AI 解析是否有幫助？</span>
        <button
          onClick={() => handleVote('up')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            background: voted === 'up' ? 'rgba(16, 185, 129, 0.15)' : 'var(--color-bg-secondary)',
            color: voted === 'up' ? '#10b981' : 'var(--color-text-muted)',
            cursor: 'pointer',
            fontWeight: voted === 'up' ? 'bold' : 'normal',
            transition: 'all 0.2s'
          }}
        >
          <ThumbsUp size={14} />
          有用
        </button>

        <button
          onClick={() => handleVote('down')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            background: voted === 'down' ? 'rgba(239, 68, 68, 0.15)' : 'var(--color-bg-secondary)',
            color: voted === 'down' ? '#ef4444' : 'var(--color-text-muted)',
            cursor: 'pointer',
            fontWeight: voted === 'down' ? 'bold' : 'normal',
            transition: 'all 0.2s'
          }}
        >
          <ThumbsDown size={14} />
          需改進
        </button>

        {voted && (
          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Check size={14} /> 感謝您的評分！
          </span>
        )}
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '6px',
          border: 'none',
          background: 'transparent',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          transition: 'color 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
      >
        <Flag size={14} />
        題目有疑義 / 報錯
      </button>

      <QuestionFeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        question={question}
      />
    </div>
  );
};

export default FeedbackRatingBar;
