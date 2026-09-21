import React, { useState, useEffect } from 'react';
import { Calendar, Cpu, DollarSign, Activity, ActivityIcon, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Performance.module.css';

const Performance = () => {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [timeframe, setTimeframe] = useState('hour'); // 'hour' | 'day' | 'week'
  const [stats, setStats] = useState({
    tokenUsage: 0,
    apiCalls: 0,
    health: '100%',
    tokenUsageChange: '+0%',
    chartData: Array(24).fill(0)
  });

  useEffect(() => {
    fetch(`http://localhost:5001/api/admin/analytics/performance?date=${selectedDate}&timeframe=${timeframe}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setStats(data.data);
        }
      })
      .catch(err => console.error("Error fetching performance stats:", err));
  }, [selectedDate, timeframe]);

  // Calculate max for chart scaling
  const maxVal = Math.max(...(stats.chartData || [0]), 1); // fallback to 1 to avoid /0
  
  const getXLabel = (index, totalLength) => {
    if (timeframe === 'hour') {
      return index % 4 === 0 ? `${String(index).padStart(2, '0')}:00` : '';
    } else if (timeframe === 'day') {
      return `第 ${totalLength - index} 天前`;
    } else if (timeframe === 'week') {
      return `第 ${totalLength - index} 週前`;
    }
    return '';
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>AI 系統效能監控</h1>
          <p className={styles.pageSubTitle}>即時分析 AI 模型調用狀態與運行成本</p>
        </div>
        <div style={{ position: 'relative' }}>
          <input 
            type="date" 
            className={styles.outlineBtn} 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ fontFamily: 'inherit', color: 'var(--color-text)' }}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>
              {timeframe === 'hour' ? '當日 API 總呼叫量' : timeframe === 'day' ? '過去7天總呼叫量' : '過去4週總呼叫量'}
            </span>
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
            <span className={styles.statNote}>累計消耗</span>
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
            <button 
              className={`${styles.segBtn} ${timeframe === 'hour' ? styles.active : ''}`}
              onClick={() => setTimeframe('hour')}
            >時</button>
            <button 
              className={`${styles.segBtn} ${timeframe === 'day' ? styles.active : ''}`}
              onClick={() => setTimeframe('day')}
            >日</button>
            <button 
              className={`${styles.segBtn} ${timeframe === 'week' ? styles.active : ''}`}
              onClick={() => setTimeframe('week')}
            >週</button>
          </div>
        </div>
        
        <div className={styles.chartArea}>
          <div className={styles.barsContainer}>
            {stats.chartData.map((val, i) => {
              const heightPct = (val / maxVal) * 100;
              const isLast = i === stats.chartData.length - 1;
              return (
                <div key={i} className={styles.barCol} style={{ flex: 1, margin: '0 2px' }}>
                  <div className={styles.barFill} style={{ height: `${Math.max(heightPct, 1)}%` }} title={`${val} tokens`}></div>
                  <span className={styles.xLabel}>
                    {getXLabel(i, stats.chartData.length)}
                  </span>
                  {isLast && timeframe === 'hour' && <span className={styles.xLabelRight}>最新</span>}
                </div>
              );
            })}
          </div>
          <div className={styles.xAxisLine}></div>
        </div>
      </div>

    </div>
  );
};

export default Performance;
