import React, { useState, useEffect } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import styles from './KnowledgeBaseManager.module.css';

const UnansweredLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/admin/logs/unanswered');
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除這筆紀錄嗎？')) return;
    try {
      const res = await fetch(`http://localhost:5001/api/admin/logs/unanswered/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchLogs();
      } else {
        alert(data.message);
      }
    } catch (e) {
      console.error(e);
      alert('刪除失敗');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>超綱問題追蹤</h1>
      </div>

      <div className={styles.listCard}>
        <h2 className={styles.listTitle}>學生詢問但超出教材範圍的紀錄</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
          系統記錄了被 AI 守門員機制阻擋的問題。您可以參考這些問題來評估是否需要上傳新的補充教材。
        </p>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 className={styles.spinner} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>詢問時間</th>
                  <th>裝置 ID</th>
                  <th>詢問內容</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>
                      目前沒有超綱問題紀錄。
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log._id}>
                      <td>{new Date(log.createdAt).toLocaleString()}</td>
                      <td>{log.deviceId.substring(0, 15)}...</td>
                      <td style={{ whiteSpace: 'pre-wrap' }}>{log.question}</td>
                      <td className={styles.actions}>
                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(log._id)} title="標記為已處理 / 刪除">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnansweredLogs;
