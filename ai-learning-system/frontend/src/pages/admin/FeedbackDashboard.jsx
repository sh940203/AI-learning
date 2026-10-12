import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, AlertCircle, CheckCircle2, Clock, Filter, Eye, Check } from 'lucide-react';
import styles from './FeedbackDashboard.module.css';

const FeedbackDashboard = () => {
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'resolved'
  const [feedbacks, setFeedbacks] = useState([
    {
      id: 'fb_101',
      questionTitle: '甲公司於 113 年底購入一部機器設備...',
      category: '標準答案或算式有誤',
      studentComment: '解析第二行的累計折舊算式寫成乘以 3，但內文說是第 2 年底，應該是乘以 2。',
      rating: 'up',
      status: 'pending',
      createdAt: '2026-10-07 14:20'
    },
    {
      id: 'fb_102',
      questionTitle: '關於會計品質特性中的「攸關性 (Relevance)」...',
      category: '題目描述不清/多義',
      studentComment: '選項 D 與選項 B 在某些舊教材有爭議，建議補充 112 年新會計準則的說明。',
      rating: 'up',
      status: 'resolved',
      createdAt: '2026-10-06 09:15'
    },
    {
      id: 'fb_103',
      questionTitle: '當市場需求彈性大於 1 時，廠商調降價格會導致...',
      category: '選項重複或無正確解',
      studentComment: '選項 A 和選項 C 敘述一模一樣！',
      rating: 'down',
      status: 'pending',
      createdAt: '2026-10-07 10:40'
    },
    {
      id: 'fb_104',
      questionTitle: '下列關於作業系統排程演算法的敘述，何者正確？',
      category: '公式符號/格式排版異常',
      studentComment: '數學符號在大螢幕上無法正常渲染。',
      rating: 'down',
      status: 'resolved',
      createdAt: '2026-10-05 16:30'
    }
  ]);

  const toggleStatus = (id) => {
    setFeedbacks(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: item.status === 'pending' ? 'resolved' : 'pending'
        };
      }
      return item;
    }));
  };

  const filteredItems = feedbacks.filter(item => {
    if (filterStatus === 'pending') return item.status === 'pending';
    if (filterStatus === 'resolved') return item.status === 'resolved';
    return true;
  });

  const totalCount = feedbacks.length;
  const pendingCount = feedbacks.filter(f => f.status === 'pending').length;
  const resolvedCount = feedbacks.filter(f => f.status === 'resolved').length;
  const satisfactionRate = 92;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <MessageSquare color="var(--color-primary)" size={26} />
          系統反饋與題目報錯中心
        </h1>
        <p className={styles.subtitle}>
          即時追蹤學生提交之題目疑義、AI 解析評估與系統報錯，持續優化題庫與 Prompt 品質
        </p>
      </div>

      {/* 統計卡片列 */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.iconWrapper} style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--color-primary)' }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <div className={styles.statVal}>{totalCount}</div>
            <div className={styles.statLabel}>總回報數量</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.iconWrapper} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div className={styles.statVal}>{pendingCount}</div>
            <div className={styles.statLabel}>待處理疑義案</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.iconWrapper} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className={styles.statVal}>{resolvedCount}</div>
            <div className={styles.statLabel}>已校對/修正完成</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.iconWrapper} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <ThumbsUp size={24} />
          </div>
          <div>
            <div className={styles.statVal}>{satisfactionRate}%</div>
            <div className={styles.statLabel}>AI 解析滿意度</div>
          </div>
        </div>
      </div>

      {/* 反饋 Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle}>學生題目疑義與錯題清單</div>
          <div className={styles.filterGroup}>
            <button 
              className={`${styles.filterBtn} ${filterStatus === 'all' ? styles.active : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              全部 ({totalCount})
            </button>
            <button 
              className={`${styles.filterBtn} ${filterStatus === 'pending' ? styles.active : ''}`}
              onClick={() => setFilterStatus('pending')}
            >
              待處理 ({pendingCount})
            </button>
            <button 
              className={`${styles.filterBtn} ${filterStatus === 'resolved' ? styles.active : ''}`}
              onClick={() => setFilterStatus('resolved')}
            >
              已解決 ({resolvedCount})
            </button>
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>狀態</th>
              <th>問題分類</th>
              <th>題目內容</th>
              <th>學生留言說明</th>
              <th>回報時間</th>
              <th>標記處理</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={item.id}>
                <td>
                  <span className={`${styles.badge} ${item.status === 'pending' ? styles.pending : styles.resolved}`}>
                    {item.status === 'pending' ? '待校對' : '已修正'}
                  </span>
                </td>
                <td style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{item.category}</td>
                <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.questionTitle}
                </td>
                <td style={{ maxWidth: '280px', color: 'var(--color-text-muted)' }}>
                  {item.studentComment}
                </td>
                <td style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{item.createdAt}</td>
                <td>
                  <button 
                    className={styles.actionBtn}
                    onClick={() => toggleStatus(item.id)}
                  >
                    {item.status === 'pending' ? (
                      <>
                        <Check size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        標記為已解決
                      </>
                    ) : (
                      '重新標為待處理'
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeedbackDashboard;
