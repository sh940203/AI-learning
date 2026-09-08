import React, { useState, useEffect } from 'react';
import { Calendar, Cpu, DollarSign, Activity, ActivityIcon, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Performance.module.css';

const Performance = () => {
  const [stats, setStats] = useState({
    tokenUsage: 0,
    apiCalls: 0,
    health: '100%',
    tokenUsageChange: '+0%',
    chartData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // default bars
  });

  useEffect(() => {
    fetch('http://localhost:5001/api/admin/analytics/performance')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setStats(data.data);
        }
      })
      .catch(err => console.error("Error fetching performance stats:", err));
  }, []);

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
            <span className={styles.statLabel}>今日 API 總呼叫量</span>
            <Cpu size={20} className={styles.statIconBlue} />
          </div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{stats.apiCalls.toLocaleString()}</span>
            <span className={styles.statChangePos}>最新數據</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>預估 Token 消耗</span>
            <DollarSign size={20} className={styles.statIconBlue} />
          </div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{stats.tokenUsage.toLocaleString()}</span>
            <span className={styles.statNote}>本日累計</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>API 系統健康度</span>
            <Activity size={20} className={styles.statIconGreen} />
          </div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{stats.health}</span>
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
            {stats.chartData.map((h, i) => (
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

    </div>
  );
};

export default Performance;
