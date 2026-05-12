import React from 'react';
import { Calendar, Cpu, DollarSign, Activity, Megaphone, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Performance.module.css';

const announcements = [
  { id: 1, title: 'AI 模型升級：GPT-4o 正式對全體師生開放', date: '2024-05-20', status: '已發布' },
  { id: 2, title: '系統維護通知：週六凌晨 02:00 - 05:00 進行資料庫優化', date: '2024-05-18', status: '草稿' },
  { id: 3, title: '歡迎新進教師加入：智慧教學輔助手冊', date: '2024-05-15', status: '已發布' },
  { id: 4, title: 'API 調用限制說明：為確保系統穩定性之公告', date: '2024-05-10', status: '已過期' }
];

const barHeights = [20, 40, 60, 45, 75, 70, 95, 65, 50, 48]; // Simulated heights

const Performance = () => {
  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>AI 系統效能監控</h1>
          <p className={styles.pageSubTitle}>即時分析 AI 模型調用狀態與運行成本</p>
        </div>
        <button className={styles.outlineBtn}>
          <Calendar size={16} /> 今日數據
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>今日 TOKEN 總消耗量</span>
            <Cpu size={20} className={styles.statIconBlue} />
          </div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>1,284,502</span>
            <span className={styles.statChangePos}>+12.5%</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>預估成本 (TWD)</span>
            <DollarSign size={20} className={styles.statIconBlue} />
          </div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>NT$ 1,250</span>
            <span className={styles.statNote}>本日累計</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>API 系統健康度</span>
            <Activity size={20} className={styles.statIconGreen} />
          </div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>99.98%</span>
            <span className={styles.statNote}>過去 24 小時</span>
          </div>
        </div>
      </div>

      {/* Chart Card */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.cardTitle}>Token 消耗趨勢</h3>
          <div className={styles.segmentedControl}>
            <button className={`${styles.segBtn} ${styles.active}`}>時</button>
            <button className={styles.segBtn}>日</button>
            <button className={styles.segBtn}>週</button>
          </div>
        </div>
        
        <div className={styles.chartArea}>
          <div className={styles.barsContainer}>
            {barHeights.map((h, i) => (
              <div key={i} className={styles.barCol}>
                <div className={styles.barFill} style={{ height: `${h}%` }}></div>
                {/* Simulated x-axis labels for some columns */}
                {(i === 0 || i === 2 || i === 4 || i === 6 || i === 8 || i === 9) && (
                  <span className={styles.xLabel}>
                    {i === 0 ? '08:00' : i === 2 ? '10:00' : i === 4 ? '12:00' : i === 6 ? '14:00' : i === 8 ? '16:00' : i === 9 ? '18:00' : ''}
                  </span>
                )}
                {i === 9 && <span className={styles.xLabelRight}>現在</span>}
              </div>
            ))}
          </div>
          <div className={styles.xAxisLine}></div>
        </div>
      </div>

      {/* Announcements Card */}
      <div className={styles.tableCard}>
        <div className={styles.cardHeaderFlex}>
          <h3 className={styles.cardTitleWithIcon}>
            <Megaphone size={20} className={styles.iconBlue} /> 公告系統管理
          </h3>
          <button className={styles.primaryBtn}>
            <Plus size={16} /> 發布新公告
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>公告標題</th>
                <th>發布日期</th>
                <th>狀態</th>
                <th>動作</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((item) => (
                <tr key={item.id}>
                  <td className={styles.cellTitle}>{item.title}</td>
                  <td>{item.date}</td>
                  <td>
                    <span className={`${styles.badge} ${
                      item.status === '已發布' ? styles.badgeSuccess : 
                      item.status === '草稿' ? styles.badgeDraft : styles.badgeWarning
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionBtns}>
                      <button className={styles.iconBtn}><Edit2 size={16} /></button>
                      <button className={styles.iconBtn}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className={styles.tableFooter}>
          <span className={styles.pageInfo}>顯示第 1 到 4 則公告，共 24 則</span>
          <div className={styles.pagination}>
            <button className={styles.pageBtn}><ChevronLeft size={16} /></button>
            <button className={styles.pageBtn}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Performance;
