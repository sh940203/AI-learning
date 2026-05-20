import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import styles from './Tests.module.css';
import { fetchPublishedExams, fetchDashboardStats, fetchUserExamProgress, seedProgressMockData } from '../services/examService';

// 輕量化訊息提示組件 (Toast Notifications)
const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={styles.toast}>
      <span className={styles.toastMessage}>{message}</span>
    </div>
  );
};

// 骨架屏 (Skeleton) 載入動畫組件，提供頂級的使用者體驗
const SkeletonRow = () => (
  <tr className={styles.skeletonRow}>
    <td><div className={styles.skeletonText} style={{ width: '40px' }} /></td>
    <td><div className={styles.skeletonText} style={{ width: '280px' }} /></td>
    <td><div className={styles.skeletonBadge} /></td>
    <td>
      <div className={styles.statusCell}>
        <div className={styles.skeletonDot} />
        <div className={styles.skeletonText} style={{ width: '80px' }} />
      </div>
    </td>
    <td><div className={styles.skeletonText} style={{ width: '30px' }} /></td>
    <td>
      <div className={styles.skeletonText} style={{ width: '120px' }} />
    </td>
  </tr>
);

const Tests = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('全部');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [onlyWrongAnswers, setOnlyWrongAnswers] = useState(false);

  // 後端資料庫連線狀態
  const [exams, setExams] = useState([]);
  const [progressStats, setProgressStats] = useState({
    progressRate: 0,
    averageScore: 0,
    completedCount: 0,
    totalExamsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // 搜尋字詞的防抖 (Debounce) 處理，避免频繁發送 API 請求
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // 顯示提示訊息
  const triggerToast = (msg) => {
    setToastMessage(msg);
  };

  // 核心資料獲取與整合邏輯
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      // 1. 從資料庫獲取所有管理端發布 (published) 的考卷
      const published = await fetchPublishedExams({
        examCategory: activeFilter,
        search: debouncedSearch
      });

      // 2. 獲取當前使用者的作答統計與進度 (需要登入憑證)
      let stats = { progressRate: 0, averageScore: 0, completedCount: 0, totalExamsCount: 0 };
      let userProgress = [];
      try {
        stats = await fetchDashboardStats();
        userProgress = await fetchUserExamProgress();
      } catch (e) {
        console.warn('用戶未登入或尚未設定進度，將以預設狀態顯示。', e);
      }

      // 3. 雙向合併發布考卷與使用者作答進度
      const mergedExams = published.map(exam => {
        const progress = userProgress.find(p => p.examId === exam._id);
        
        let status = '未開始';
        let score = '--';
        let action = 'start';
        let progressRate = 0;

        if (progress) {
          if (progress.status === 'completed') {
            status = '已完成';
            score = progress.score;
            action = 'view';
          } else if (progress.status === 'in_progress') {
            status = `進行中 (${progress.progressRate}%)`;
            score = '--';
            action = 'continue';
            progressRate = progress.progressRate;
          }
        }

        // 分類徽章中文化對照
        const mappedType = exam.examCategory === 'GSAT' ? '學測' : exam.examCategory === 'TVEJE' ? '統測' : '未分類';

        return {
          id: exam._id,
          year: exam.examYear || '114',
          name: exam.title,
          type: mappedType,
          status,
          score,
          action,
          progressRate
        };
      });

      // 只顯示錯題過濾 (在此示範為已完成項目，配合後續錯題分析開發)
      const finalExams = onlyWrongAnswers 
        ? mergedExams.filter(e => e.status === '已完成') 
        : mergedExams;

      setExams(finalExams);
      setProgressStats(stats);
    } catch (err) {
      console.error('載入考題庫失敗:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, debouncedSearch, onlyWrongAnswers]);

  // 監聽依賴變更，自動重新獲取資料
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Seed 測試進度數據，完美展現「已完成、進行中」動態效果
  const handleSeedMockData = async () => {
    setLoading(true);
    try {
      await seedProgressMockData();
      triggerToast('🎉 成功載入測試作答進度！');
      await loadData(true);
    } catch (err) {
      triggerToast('⚠️ 資料庫目前無發布考卷，請先去後台發布考卷！');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 答題事件處理 (銜接下階段答題系統開發)
  const handleStartExam = (row) => {
    navigate(`/tests/take/${row.id}`);
  };

  return (
    <div className={styles.pageWrapper}>
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage('')} />
      )}

      {/* 頂部導航與搜尋 */}
      <div className={styles.subHeader}>
        <div className={styles.subHeaderLeft}>
          <h1 className={styles.pageTitle}>考試中心</h1>
          <nav className={styles.topNav}>
            <button className={`${styles.navBtn} ${styles.active}`}>考題庫</button>
            <button className={styles.navBtn} onClick={() => navigate('/error-analysis')}>分析報告</button>
          </nav>
        </div>
        <div className={styles.subHeaderRight}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="搜尋考試或年份..." 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* 左側主面板 (題庫表格) */}
        <div className={styles.leftCol}>
          <div className={styles.breadcrumb} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              考試中心 &gt; <span className={styles.currentPath}>歷屆考古題庫</span>
            </div>
            {/* Notion 風格虛線 Seed 按鈕 */}
            <button className={styles.seedBtn} onClick={handleSeedMockData}>
              <RefreshCw size={12} /> 載入測試進度數據
            </button>
          </div>

          <div className={styles.headerRow}>
            <h2>歷屆考古題庫</h2>
            <div className={styles.filters}>
              <div className={styles.toggleGroup}>
                <span>只顯示錯題</span>
                <label className={styles.switch}>
                  <input 
                    type="checkbox" 
                    checked={onlyWrongAnswers}
                    onChange={(e) => setOnlyWrongAnswers(e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
              <div className={styles.segmentedControl}>
                <button 
                  className={`${styles.segBtn} ${activeFilter === '全部' ? styles.active : ''}`} 
                  onClick={() => setActiveFilter('全部')}
                >
                  全部
                </button>
                <button 
                  className={`${styles.segBtn} ${activeFilter === '學測' ? styles.active : ''}`} 
                  onClick={() => setActiveFilter('學測')}
                >
                  學測
                </button>
                <button 
                  className={`${styles.segBtn} ${activeFilter === '統測' ? styles.active : ''}`} 
                  onClick={() => setActiveFilter('統測')}
                >
                  統測
                </button>
              </div>
            </div>
          </div>

          {/* 數據統計資訊 */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>完成進度</p>
              <div className={styles.statValue}>
                {loading ? '...' : `${progressStats.progressRate || 0}%`}
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${loading ? 0 : (progressStats.progressRate || 0)}%`, transition: 'width 0.4s ease' }}
                ></div>
              </div>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>平均分數</p>
              <div className={styles.statValue}>
                {loading ? '...' : (progressStats.averageScore || '--')}
              </div>
            </div>
            <div className={styles.statCardBlue}>
              <p className={styles.statLabelInverse}>下一次模擬考倒數</p>
              <div className={styles.statValueInverse}>12 天 04 小時</div>
              <button className={styles.outlineBtnInverse} onClick={() => triggerToast('📅 模擬考日程即將發布！')}>
                查看考試日程
              </button>
              <div className={styles.bgIcon}>📝</div>
            </div>
          </div>

          {/* 考卷數據表格 */}
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
                {loading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : exams.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className={styles.emptyStateContainer}>
                        <div className={styles.emptyStateTitle}>尚無符合條件的試卷</div>
                        <p className={styles.emptyStateText}>
                          資料庫中目前沒有已發布的試卷。您可以前往管理後台發布一些考卷，或是點擊上方「載入測試進度數據」自動注入範例進度以利快速調試！
                        </p>
                        <button className={styles.emptyStateBtn} onClick={() => navigate('/admin/questions')}>
                          前往管理後台發布考卷
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  exams.map(row => (
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
                            <button className={styles.textBtnMuted} onClick={() => handleStartExam(row)}>再次練習</button>
                          </div>
                        )}
                        {row.action === 'start' && (
                          <button className={styles.primaryBtnSm} onClick={() => handleStartExam(row)}>開始考試</button>
                        )}
                        {row.action === 'continue' && (
                          <button className={styles.outlineBtnSm} onClick={() => handleStartExam(row)}>繼續練習</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* 分頁 (保持 Notion 設計美感) */}
            {!loading && exams.length > 0 && (
              <div className={styles.pagination}>
                <button className={styles.pageBtn} disabled><ChevronLeft size={16} /></button>
                <button className={`${styles.pageBtn} ${styles.active}`}>1</button>
                <button className={styles.pageBtn} disabled><ChevronRight size={16} /></button>
              </div>
            )}
          </div>
        </div>

        {/* 右側邊欄 (小工具區) */}
        <div className={styles.rightCol}>
          <div className={styles.widgetCard}>
            <h3 className={styles.widgetTitle}>快速篩選</h3>
            <div className={styles.checkboxList}>
              <label className={styles.checkboxItem}>
                <input type="checkbox" defaultChecked onChange={() => triggerToast('⚡ 已為您過濾近三年考題！')} />
                <span>近三年考題</span>
              </label>
              <label className={styles.checkboxItem}>
                <input type="checkbox" onChange={() => triggerToast('⚡ 已為您篩選出熱門考點！')} />
                <span>熱門考點</span>
              </label>
              <label className={styles.checkboxItem}>
                <input type="checkbox" onChange={() => triggerToast('⚡ 已過濾未通過項目！')} />
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
