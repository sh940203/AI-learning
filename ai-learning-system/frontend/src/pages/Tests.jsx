import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Tests.module.css';

const testData = [
  { id: 1, year: '115', name: '大學入學指定科目考試 - 數學甲', type: '大學聯考', status: '已完成', score: 92, action: 'view' },
  { id: 2, year: '114', name: '學科能力測驗 - 英文', type: '學測', status: '已完成', score: 88, action: 'view' },
  { id: 3, year: '114', name: '技術士技能檢定 - 網頁設計乙級', type: '證照', status: '未開始', score: '--', action: 'start' },
  { id: 4, year: '113', name: '四技二專統一入學測驗 - 國文', type: '統測', status: '已完成', score: 76, action: 'view' },
  { id: 5, year: '113', name: '學科能力測驗 - 社會', type: '學測', status: '進行中 (45%)', score: '--', action: 'continue' },
  { id: 6, year: '112', name: '大學入學指定科目考試 - 物理', type: '大學聯考', status: '已完成', score: '--', action: 'error_analysis' },
];

const Tests = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('全部');

  const filteredData = activeFilter === '全部' 
    ? testData 
    : testData.filter(item => item.type.includes(activeFilter));

  return (
    <div className={styles.pageWrapper}>
      {/* Sub Header */}
      <div className={styles.subHeader}>
        <div className={styles.subHeaderLeft}>
          <h1 className={styles.pageTitle}>考試中心</h1>
          <nav className={styles.topNav}>
            <button className={styles.navBtn}>我的課程</button>
            <button className={`${styles.navBtn} ${styles.active}`}>考題庫</button>
            <button className={styles.navBtn} onClick={() => navigate('/error-analysis')}>分析報告</button>
          </nav>
        </div>
        <div className={styles.subHeaderRight}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input type="text" placeholder="搜尋考試或年份..." />
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Left Column (Main Table Area) */}
        <div className={styles.leftCol}>
          <div className={styles.breadcrumb}>
            考試中心 &gt; <span className={styles.currentPath}>歷屆考古題庫</span>
          </div>

          <div className={styles.headerRow}>
            <h2>歷屆考古題庫</h2>
            <div className={styles.filters}>
              <div className={styles.toggleGroup}>
                <span>只顯示錯題</span>
                <label className={styles.switch}>
                  <input type="checkbox" defaultChecked />
                  <span className={styles.slider}></span>
                </label>
              </div>
              <div className={styles.segmentedControl}>
                <button className={`${styles.segBtn} ${activeFilter === '全部' ? styles.active : ''}`} onClick={() => setActiveFilter('全部')}>全部</button>
                <button className={`${styles.segBtn} ${activeFilter === '學測' ? styles.active : ''}`} onClick={() => setActiveFilter('學測')}>學測</button>
                <button className={`${styles.segBtn} ${activeFilter === '統測' ? styles.active : ''}`} onClick={() => setActiveFilter('統測')}>統測</button>
                <button className={`${styles.segBtn} ${activeFilter === '證照' ? styles.active : ''}`} onClick={() => setActiveFilter('證照')}>證照</button>
              </div>
            </div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>完成進度</p>
              <div className={styles.statValue}>64%</div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '64%' }}></div>
              </div>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>平均分數</p>
              <div className={styles.statValue}>82.5</div>
            </div>
            <div className={styles.statCardBlue}>
              <p className={styles.statLabelInverse}>下一次模擬考倒數</p>
              <div className={styles.statValueInverse}>12 天 04 小時</div>
              <button className={styles.outlineBtnInverse}>查看考試日程</button>
              <div className={styles.bgIcon}>📝</div>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>年份</th>
                  <th>考試名稱</th>
                  <th>類型</th>
                  <th>狀態</th>
                  <th>分數</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(row => (
                  <tr key={row.id}>
                    <td>{row.year}</td>
                    <td className={styles.examName}>{row.name}</td>
                    <td>
                      <span className={styles.typeBadge}>{row.type}</span>
                    </td>
                    <td>
                      <div className={styles.statusCell}>
                        <span className={`${styles.statusDot} ${
                          row.status.includes('已完成') ? styles.dotCompleted :
                          row.status.includes('進行中') ? styles.dotProgress : styles.dotPending
                        }`}></span>
                        {row.status}
                      </div>
                    </td>
                    <td>{row.score}</td>
                    <td>
                      {row.action === 'view' && (
                        <div className={styles.actionLinks}>
                          <button className={styles.textBtn} onClick={() => navigate('/error-analysis')}>查看分析</button>
                          <button className={styles.textBtnMuted}>再次練習</button>
                        </div>
                      )}
                      {row.action === 'start' && (
                        <button className={styles.primaryBtnSm}>開始考試</button>
                      )}
                      {row.action === 'continue' && (
                        <button className={styles.outlineBtnSm}>繼續練習</button>
                      )}
                      {row.action === 'error_analysis' && (
                        <div className={styles.actionLinks}>
                          <button className={styles.textBtnDanger} onClick={() => navigate('/error-analysis')}>錯誤分析</button>
                          <button className={styles.textBtnMuted}>再次練習</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.pagination}>
              <button className={styles.pageBtn}><ChevronLeft size={16} /></button>
              <button className={`${styles.pageBtn} ${styles.active}`}>1</button>
              <button className={styles.pageBtn}>2</button>
              <button className={styles.pageBtn}>3</button>
              <span className={styles.pageEllipsis}>...</span>
              <button className={styles.pageBtn}>12</button>
              <button className={styles.pageBtn}><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar Widgets) */}
        <div className={styles.rightCol}>
          <div className={styles.widgetCard}>
            <h3 className={styles.widgetTitle}>快速篩選</h3>
            <div className={styles.checkboxList}>
              <label className={styles.checkboxItem}>
                <input type="checkbox" defaultChecked />
                <span>近三年考題</span>
              </label>
              <label className={styles.checkboxItem}>
                <input type="checkbox" />
                <span>熱門考點</span>
              </label>
              <label className={styles.checkboxItem}>
                <input type="checkbox" />
                <span>未通過項目</span>
              </label>
            </div>
          </div>

          <div className={styles.widgetCard}>
            <h3 className={styles.widgetTitle}>今日任務</h3>
            <div className={styles.taskCard}>
              <span className={styles.taskBadge}>推薦</span>
              <p>112 年數學甲 錯題重練</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tests;
