import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import styles from './Tests.module.css';
import { fetchPublishedExams, fetchDashboardStats, fetchUserExamProgress, seedProgressMockData, fetchMasteryStats } from '../services/examService';

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
  const [selectedCategoryKey, setSelectedCategoryKey] = useState(null);

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
  const [weaknesses, setWeaknesses] = useState([]);

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
      let masteryData = null;
      try {
        stats = await fetchDashboardStats();
        userProgress = await fetchUserExamProgress();
        masteryData = await fetchMasteryStats();
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
          progressRate,
          allowRetake: exam.allowRetake || false
        };
      });

      const finalExams = mergedExams;

      setExams(finalExams);
      setProgressStats(stats);

      if (masteryData && masteryData.byCategory && masteryData.byCategory.length > 0) {
        // 取前 3 個掌握率最低且大於等於 0 的弱點 (由低到高，突顯弱點)
        const topWeaknesses = masteryData.byCategory.slice(0, 3).map(item => ({
          name: item.name,
          rate: item.masteryRate
        }));
        setWeaknesses(topWeaknesses);
      } else {
        setWeaknesses([]);
      }
    } catch (err) {
      console.error('載入考題庫失敗:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, debouncedSearch]);

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

  // 動態將考卷進行分組 (Group by Year and Type)
  const categoriesMap = {};
  exams.forEach(exam => {
    const key = `${exam.year}-${exam.type}`; // e.g. "114-統測"
    if (!categoriesMap[key]) {
      categoriesMap[key] = {
        key,
        year: exam.year,
        type: exam.type,
        exams: [],
        completedCount: 0,
        totalExams: 0,
        totalScore: 0,
        scoredCount: 0,
        averageScore: 0,
        progressRate: 0
      };
    }
    categoriesMap[key].exams.push(exam);
    categoriesMap[key].totalExams += 1;
    if (exam.status.includes('已完成')) {
      categoriesMap[key].completedCount += 1;
      if (exam.score !== '--' && exam.score !== null && exam.score !== undefined) {
        categoriesMap[key].totalScore += Number(exam.score);
        categoriesMap[key].scoredCount += 1;
      }
    }
  });

  // 計算每個分類的進度與平均分數
  Object.keys(categoriesMap).forEach(key => {
    const cat = categoriesMap[key];
    cat.progressRate = cat.totalExams > 0 ? Math.round((cat.completedCount / cat.totalExams) * 100) : 0;
    cat.averageScore = cat.scoredCount > 0 ? parseFloat((cat.totalScore / cat.scoredCount).toFixed(1)) : '--';
  });

  // 將分組轉為陣列，依年份與類型降冪排序
  const categories = Object.values(categoriesMap).sort((a, b) => {
    if (b.year !== a.year) {
      return b.year.localeCompare(a.year);
    }
    return b.type.localeCompare(a.type);
  });

  // 取得目前選取的分類詳情
  const activeCategory = selectedCategoryKey ? categoriesMap[selectedCategoryKey] : null;

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

      <div className={`${styles.mainContent} ${selectedCategoryKey ? styles.fullWidthContent : ''}`}>
        {/* 左側主面板 (題庫表格) */}
        <div className={styles.leftCol}>
          <div className={styles.breadcrumb} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              考試中心 &gt;{' '}
              {selectedCategoryKey ? (
                <>
                  <span 
                    className={styles.clickableBreadcrumb}
                    onClick={() => setSelectedCategoryKey(null)}
                  >
                    歷屆考古題庫
                  </span>
                  {' > '}
                  <span className={styles.currentPath}>{activeCategory ? `${activeCategory.year} 年 ${activeCategory.type}` : ''}</span>
                </>
              ) : (
                <span className={styles.currentPath}>歷屆考古題庫</span>
              )}
            </div>
            {/* Notion 風格虛線 Seed 按鈕 */}
            <button className={styles.seedBtn} onClick={handleSeedMockData}>
              <RefreshCw size={12} /> 載入測試進度數據
            </button>
          </div>

          {!selectedCategoryKey && (
            /* 歷屆題庫大廳歡迎看板 */
            <div className={styles.welcomeBanner}>
              <div className={styles.welcomeInfo}>
                <h2 className={styles.welcomeTitle}>🎯 歷屆學測與統測考古題庫</h2>
                <p className={styles.welcomeDesc}>
                  專為您提供最精準的模擬測驗與 AI 錯題掌握度分析。請點選下方年份與考試分類以開始練習！
                </p>
              </div>
              <div className={styles.welcomeIcon}>📚</div>
            </div>
          )}

          <div className={styles.headerRow}>
            <h2>{activeCategory ? `${activeCategory.year} 年 ${activeCategory.type} 歷屆試卷` : '歷屆考古題庫'}</h2>
            <div className={styles.filters}>
              <div className={styles.segmentedControl}>
                <button 
                  className={`${styles.segBtn} ${activeFilter === '全部' ? styles.active : ''}`} 
                  onClick={() => { setActiveFilter('全部'); setSelectedCategoryKey(null); }}
                >
                  全部
                </button>
                <button 
                  className={`${styles.segBtn} ${activeFilter === '學測' ? styles.active : ''}`} 
                  onClick={() => { setActiveFilter('學測'); setSelectedCategoryKey(null); }}
                >
                  學測
                </button>
                <button 
                  className={`${styles.segBtn} ${activeFilter === '統測' ? styles.active : ''}`} 
                  onClick={() => { setActiveFilter('統測'); setSelectedCategoryKey(null); }}
                >
                  統測
                </button>
              </div>
            </div>
          </div>

          {selectedCategoryKey && activeCategory && (
            /* 數據統計資訊 - 僅在第二層當屆詳情下顯示，且僅有當屆進度與當屆平均分兩張卡片均分 */
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>當屆完成進度</p>
                <div className={styles.statValue}>
                  {loading ? '...' : `${activeCategory.progressRate}%`}
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${loading ? 0 : activeCategory.progressRate}%`, transition: 'width 0.4s ease' }}
                  ></div>
                </div>
              </div>
              <div className={styles.statCard}>
                <p className={styles.statLabel}>當屆平均分數</p>
                <div className={styles.statValue}>
                  {loading ? '...' : (activeCategory.averageScore || '--')}
                </div>
              </div>
            </div>
          )}

          {/* 第一層分類 vs 第二層試卷列表切換 */}
          {!selectedCategoryKey ? (
            /* 第一層：年份與考試類型卡片清單 */
            <div className={styles.categoriesGrid}>
              {loading ? (
                /* 載入中骨架卡片 */
                [1, 2, 3].map(i => (
                  <div key={i} className={styles.categoryCard} style={{ opacity: 0.6 }}>
                    <div className={styles.categoryCardHeader}>
                      <div className={styles.skeletonBadge} style={{ width: '60px' }} />
                      <div className={styles.skeletonBadge} style={{ width: '40px' }} />
                    </div>
                    <div className={styles.skeletonText} style={{ width: '80%', height: '20px', margin: '20px 0' }} />
                    <div className={styles.categoryCardFooter}>
                      <div className={styles.skeletonText} style={{ width: '120px', height: '12px' }} />
                    </div>
                  </div>
                ))
              ) : categories.length === 0 ? (
                <div className={styles.emptyStateContainer}>
                  <div className={styles.emptyStateTitle}>尚無符合條件的試卷分類</div>
                  <p className={styles.emptyStateText}>
                    資料庫中目前沒有已發布的試卷。您可以前往管理後台發布一些考卷，或是點擊上方「載入測試進度數據」！
                  </p>
                </div>
              ) : (
                categories.map(cat => (
                  <div 
                    key={cat.key} 
                    className={styles.categoryCard}
                    onClick={() => setSelectedCategoryKey(cat.key)}
                  >
                    <div className={styles.categoryCardHeader}>
                      <span className={styles.yearBadge}>{cat.year} 年</span>
                      <span className={`${styles.typeBadge} ${cat.type === '學測' ? styles.badgeGsat : styles.badgeTveje}`}>
                        {cat.type}
                      </span>
                    </div>
                    <h3 className={styles.categoryCardTitle}>{cat.year} 年 {cat.type} 考古題庫</h3>
                    <div className={styles.categoryCardFooter}>
                      <span className={styles.examCountText}>包含 {cat.totalExams} 份學科試卷</span>
                      <span className={styles.enterLink}>進入練習 &rarr;</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* 第二層：選定年份下的科目試卷表格列表 */
            <div>
              <button className={styles.backBtn} onClick={() => setSelectedCategoryKey(null)}>
                &larr; 返回歷屆考古題庫
              </button>
              
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
                    ) : !activeCategory || activeCategory.exams.length === 0 ? (
                      <tr>
                        <td colSpan="6">
                          <div className={styles.emptyStateContainer}>
                            <div className={styles.emptyStateTitle}>該分類下暫無考卷</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      activeCategory.exams.map(row => (
                        <tr key={row.id}>
                          <td>{row.year}</td>
                          <td className={styles.examName}>{row.name}</td>
                          <td>
                            <span className={`${styles.typeBadge} ${row.type === '學測' ? styles.badgeGsat : styles.badgeTveje}`}>{row.type}</span>
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
                                {row.allowRetake && (
                                  <button className={styles.textBtnMuted} onClick={() => handleStartExam(row)}>再次練習</button>
                                )}
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
                {!loading && activeCategory && activeCategory.exams.length > 0 && (
                  <div className={styles.pagination}>
                    <button className={styles.pageBtn} disabled><ChevronLeft size={16} /></button>
                    <button className={`${styles.pageBtn} ${styles.active}`}>1</button>
                    <button className={styles.pageBtn} disabled><ChevronRight size={16} /></button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 右側邊欄 (小工具區 - 僅在第一層大廳顯示) */}
        {!selectedCategoryKey && (
          <div className={styles.rightCol}>
            <div className={styles.widgetCard}>
              <h3 className={styles.widgetTitle}>🧠 AI 學習弱點診斷</h3>
              {weaknesses.length > 0 ? (
                <>
                  <div className={styles.weaknessList}>
                    {weaknesses.map((item, idx) => {
                      // 根據掌握度比率動態決定進度條顏色 (掌握度越低，顏色越偏紅警示)
                      const color = item.rate < 50 ? '#ef4444' : item.rate < 75 ? '#f97316' : '#eab308';
                      return (
                        <div key={idx} className={styles.weaknessItem}>
                          <div className={styles.weaknessHeader}>
                            <span className={styles.weaknessName}>{item.name}</span>
                            <span className={styles.weaknessVal} style={{ color, fontWeight: 600 }}>{item.rate}%</span>
                          </div>
                          <div className={styles.weaknessBarContainer}>
                            <div className={styles.weaknessBar} style={{ width: `${item.rate}%`, backgroundColor: color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button className={styles.viewAnalysisBtn} onClick={() => navigate('/error-analysis')}>
                    前往錯題分析報告 &rarr;
                  </button>
                </>
              ) : (
                <div className={styles.emptyWeaknessContainer}>
                  <p className={styles.emptyWeaknessText}>
                    ✨ 尚無作答數據！當您開始進行測驗交卷後，AI 將在此為您精準診斷最需要加強的觀念與弱點！
                  </p>
                </div>
              )}
            </div>

            <div className={styles.widgetCard}>
              <h3 className={styles.widgetTitle}>📅 官方重大考試時程</h3>
              <div className={styles.calendarList}>
                <div className={styles.calendarItem}>
                  <div className={styles.calendarHeader}>
                    <span className={styles.calendarName}>115年 學測測驗</span>
                    <span className={styles.calendarDays}>倒數 244 天</span>
                  </div>
                  <div className={styles.calendarDate}>考試日期：2027年1月23日 (五)</div>
                </div>
                
                <div className={styles.calendarItem}>
                  <div className={styles.calendarHeader}>
                    <span className={styles.calendarName}>115年 四技二專統測</span>
                    <span className={styles.calendarDays}>倒數 343 天</span>
                  </div>
                  <div className={styles.calendarDate}>考試日期：2027年5月2日 (六)</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tests;
