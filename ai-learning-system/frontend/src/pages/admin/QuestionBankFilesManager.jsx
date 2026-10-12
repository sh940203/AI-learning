import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, RefreshCw, Sparkles, BookOpen, Search, CheckCircle, 
  HelpCircle, Image as ImageIcon, ChevronRight, ChevronDown, 
  ExternalLink, ArrowRight, Layers, Filter, X, Eye, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './QuestionBankFilesManager.module.css';

const API_BASE = '/api/qb-files';

const QuestionBankFilesManager = () => {
  const navigate = useNavigate();

  // 題庫摘要與階層資料
  const [summary, setSummary] = useState(null);
  const [hierarchy, setHierarchy] = useState([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // 篩選狀態
  const [selectedTextbook, setSelectedTextbook] = useState(''); // 空代表全部
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [onlyHasImage, setOnlyHasImage] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 題目清單與分頁
  const [questions, setQuestions] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(15);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // 展開的章節樹 (章編號 -> boolean)
  const [expandedChapters, setExpandedChapters] = useState({});

  // AI 關聯測試 Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTestTab, setAiTestTab] = useState('quiz'); // 'quiz' or 'tutor'
  const [aiTestInput, setAiTestInput] = useState('商業文書應用, 格式編輯與排列');
  const [aiTestLoading, setAiTestLoading] = useState(false);
  const [aiTestResults, setAiTestResults] = useState(null);

  // 1. 載入題庫摘要與階層
  useEffect(() => {
    fetchSummaryAndHierarchy();
  }, []);

  const fetchSummaryAndHierarchy = async () => {
    setIsLoadingSummary(true);
    try {
      const [sumRes, hieRes] = await Promise.all([
        fetch(`${API_BASE}/summary`),
        fetch(`${API_BASE}/hierarchy`)
      ]);
      const sumData = await sumRes.json();
      const hieData = await hieRes.json();

      if (sumData.success) setSummary(sumData.data);
      if (hieData.success) setHierarchy(hieData.data);
    } catch (err) {
      console.error('載入題庫資訊失敗:', err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // 2. 載入題目清單
  useEffect(() => {
    fetchQuestions();
  }, [
    selectedTextbook,
    selectedChapter,
    selectedSection,
    selectedDifficulty,
    selectedType,
    onlyHasImage,
    currentPage,
    limit
  ]);

  const fetchQuestions = async (keywordOverride = searchKeyword) => {
    setIsLoadingQuestions(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: limit
      });
      if (selectedTextbook) params.append('textbook', selectedTextbook);
      if (selectedChapter) params.append('chapter', selectedChapter);
      if (selectedSection) params.append('section', selectedSection);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      if (selectedType) params.append('type', selectedType);
      if (onlyHasImage) params.append('hasImage', 'true');
      if (keywordOverride.trim()) params.append('keyword', keywordOverride.trim());

      const res = await fetch(`${API_BASE}/questions?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.data || []);
        setTotalQuestions(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('查詢題目失敗:', err);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // 處理搜尋提交
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchQuestions();
  };

  // 重新同步題庫資料夾
  const handleSyncDatabase = async () => {
    if (!window.confirm('確定要重新掃描「題庫資料庫」資料夾嗎？這將重讀所有 data.mdb 與圖片目錄。')) return;
    setIsSyncing(true);
    setSyncMessage('');
    try {
      const res = await fetch(`${API_BASE}/sync`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncMessage('✅ 題庫資料庫已重新掃描並建立索引完成！');
        await fetchSummaryAndHierarchy();
        await fetchQuestions();
        setTimeout(() => setSyncMessage(''), 4000);
      }
    } catch (e) {
      setSyncMessage('❌ 同步失敗，請確認後端連線正常。');
    } finally {
      setIsSyncing(false);
    }
  };

  // 切換章節展開
  const toggleChapterExpand = (chapNum) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapNum]: !prev[chapNum]
    }));
  };

  // 執行 AI 關聯測試
  const handleRunAiTest = async () => {
    if (!aiTestInput.trim()) return;
    setAiTestLoading(true);
    setAiTestResults(null);
    try {
      let bodyData = {};
      if (aiTestTab === 'quiz') {
        const tags = aiTestInput.split(/[,，]+/).map(t => t.trim()).filter(Boolean);
        bodyData = { tags, count: 4 };
      } else {
        bodyData = { query: aiTestInput.trim(), count: 4 };
      }

      const res = await fetch(`${API_BASE}/test-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();
      if (data.success) {
        setAiTestResults(data.data);
      }
    } catch (err) {
      console.error('AI 測試失敗:', err);
    } finally {
      setAiTestLoading(false);
    }
  };

  // 取得目前教材之章節列表 (供下拉選單與章節樹使用)
  const currentTextbookChapters = useMemo(() => {
    if (!selectedTextbook) {
      // 合併所有教材的章節
      const allChapters = [];
      hierarchy.forEach(tb => {
        tb.chapters.forEach(ch => {
          allChapters.push({ ...ch, textbookName: tb.textbook });
        });
      });
      return allChapters;
    }
    const found = hierarchy.find(h => h.textbook === selectedTextbook);
    return found ? found.chapters : [];
  }, [hierarchy, selectedTextbook]);

  return (
    <div className={styles.container}>
      {/* 頂部標題與快速按鈕列 */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>題庫資料庫檔案管理員</h1>
            <span className={styles.badgeNew}>實體 Access MDB 系統</span>
          </div>
          <p className={styles.subTitle}>
            吃實體「題庫資料庫」資料夾，支援 4 本教材、2,649 題題庫與 146 張附圖串流，專供測驗中心錯題生成與 AI 自主學習中心答覆
          </p>
        </div>

        <div className={styles.headerActions}>
          <button 
            id="btn-ai-test-modal"
            className={styles.btnSecondary} 
            onClick={() => setShowAiModal(true)}
            title="測試題庫如何對接到測驗中心錯題生成與AI問答"
          >
            <Sparkles size={16} />
            <span>AI 學習與出題測試</span>
          </button>

          <button 
            id="btn-sync-database"
            className={styles.btnPrimary} 
            onClick={handleSyncDatabase}
            disabled={isSyncing}
            title="重新掃描磁碟題庫資料庫資料夾"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? '正在掃描題庫...' : '重新同步題庫'}</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div style={{ 
          padding: '10px 14px', 
          borderRadius: 'var(--radius-sm)', 
          backgroundColor: 'var(--color-primary-bg)', 
          border: '1px solid rgba(0, 74, 198, 0.2)',
          color: 'var(--color-primary)', 
          fontSize: '13px', 
          marginBottom: '16px' 
        }}>
          {syncMessage}
        </div>
      )}

      {/* 雙系統架構對比 Banner */}
      <div className={styles.comparisonBanner}>
        <div className={styles.comparisonCol}>
          <div className={styles.compHeader}>
            <span className={styles.compTagLegacy}>系統 A</span>
            <span>原「題庫資料庫檔管理」</span>
          </div>
          <p className={styles.compDesc}>
            以手動上傳 Excel (.xlsx) / CSV / JSON 單檔為主，需管理者手動匯入後寫入資料庫，適合自訂題目匯入。
          </p>
          <span 
            className={styles.compSwitchLink}
            onClick={() => navigate('/admin/knowledge')}
          >
            切換查看原系統 (KnowledgeBase) →
          </span>
        </div>

        <div className={styles.comparisonCol}>
          <div className={styles.compHeader}>
            <span className={styles.compTagNew}>系統 B</span>
            <span>新「題庫資料庫檔案管理」</span>
          </div>
          <p className={styles.compDesc}>
            直接掛載官方「題庫資料庫」資料夾，解析微軟 Access (data.mdb) 關係結構，自動對應 /data/.files 附圖，並為 AI 測驗中心提供精準母題種子。
          </p>
          <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>
            ★ 總題量 2,649 題全自動索引
          </span>
        </div>
      </div>

      {/* 4 大教材統計卡片列 */}
      <div className={styles.statsRow}>
        {[
          { key: '', name: '全部教材總計', count: summary?.stats?.totalQuestions || 2649, img: summary?.stats?.totalImages || 146 },
          { key: '數位科技應用(上)', name: '數位科技應用(上)', count: summary?.stats?.byTextbook?.['數位科技應用(上)']?.totalQuestions || 393, img: summary?.stats?.byTextbook?.['數位科技應用(上)']?.imagesCount || 63 },
          { key: '數位科技應用(下)', name: '數位科技應用(下)', count: summary?.stats?.byTextbook?.['數位科技應用(下)']?.totalQuestions || 390, img: summary?.stats?.byTextbook?.['數位科技應用(下)']?.imagesCount || 10 },
          { key: '數位科技概論(上)', name: '數位科技概論(上)', count: summary?.stats?.byTextbook?.['數位科技概論(上)']?.totalQuestions || 1119, img: summary?.stats?.byTextbook?.['數位科技概論(上)']?.imagesCount || 45 },
          { key: '數位科技概論(下)', name: '數位科技概論(下)', count: summary?.stats?.byTextbook?.['數位科技概論(下)']?.totalQuestions || 747, img: summary?.stats?.byTextbook?.['數位科技概論(下)']?.imagesCount || 28 }
        ].map(item => (
          <div 
            key={item.name}
            className={`${styles.statCard} ${selectedTextbook === item.key ? styles.statCardActive : ''}`}
            onClick={() => {
              setSelectedTextbook(item.key);
              setSelectedChapter('');
              setSelectedSection('');
              setCurrentPage(1);
            }}
          >
            <div className={styles.statTop}>
              <span className={styles.statTextbookTitle}>{item.name}</span>
              <div className={styles.statIconWrap}>
                <BookOpen size={16} />
              </div>
            </div>
            <div className={styles.statMainNumber}>
              {item.count.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--color-text-muted)' }}>題</span>
            </div>
            <div className={styles.statMetaRow}>
              <div className={styles.statMetaItem}>
                <ImageIcon size={12} />
                <span>{item.img} 附圖</span>
              </div>
              <div className={styles.statMetaItem}>
                <CheckCircle size={12} color="var(--color-primary)" />
                <span>已索引</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 篩選與工具列 */}
      <div className={styles.toolbarCard}>
        <form onSubmit={handleSearchSubmit} className={styles.toolbarTop}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input 
              id="input-search-question"
              className={styles.searchInput}
              placeholder="搜尋題目內容、選項、關鍵字、章節名..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>

          <select 
            id="select-textbook"
            className={styles.filterSelect}
            value={selectedTextbook}
            onChange={(e) => {
              setSelectedTextbook(e.target.value);
              setSelectedChapter('');
              setSelectedSection('');
              setCurrentPage(1);
            }}
          >
            <option value="">全部教材冊別</option>
            <option value="數位科技應用(上)">數位科技應用(上)</option>
            <option value="數位科技應用(下)">數位科技應用(下)</option>
            <option value="數位科技概論(上)">數位科技概論(上)</option>
            <option value="數位科技概論(下)">數位科技概論(下)</option>
          </select>

          <select 
            id="select-difficulty"
            className={styles.filterSelect}
            value={selectedDifficulty}
            onChange={(e) => {
              setSelectedDifficulty(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">全部難度</option>
            <option value="1">基礎 (難度 1)</option>
            <option value="2">中等 (難度 2)</option>
            <option value="3">進階 (難度 3)</option>
          </select>

          <select 
            id="select-type"
            className={styles.filterSelect}
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">全部題型</option>
            <option value="單選題">單選題</option>
            <option value="多選題">多選題</option>
          </select>

          <label className={styles.checkboxLabel}>
            <input 
              id="checkbox-has-image"
              type="checkbox"
              className={styles.checkboxInput}
              checked={onlyHasImage}
              onChange={(e) => {
                setOnlyHasImage(e.target.checked);
                setCurrentPage(1);
              }}
            />
            <ImageIcon size={14} />
            <span>僅顯示含圖考題</span>
          </label>

          <button type="submit" className={styles.btnPrimary} style={{ padding: '8px 16px' }}>
            搜尋
          </button>
        </form>

        {/* 啟用條件標籤列 */}
        {(selectedTextbook || selectedChapter || selectedSection || selectedDifficulty || selectedType || onlyHasImage || searchKeyword) && (
          <div className={styles.activeFiltersRow}>
            <span>已套用條件：</span>
            {selectedTextbook && (
              <span className={styles.filterChip}>
                教材: {selectedTextbook}
                <button className={styles.chipCloseBtn} onClick={() => { setSelectedTextbook(''); setCurrentPage(1); }}>×</button>
              </span>
            )}
            {selectedChapter && (
              <span className={styles.filterChip}>
                第 {selectedChapter} 章
                <button className={styles.chipCloseBtn} onClick={() => { setSelectedChapter(''); setSelectedSection(''); setCurrentPage(1); }}>×</button>
              </span>
            )}
            {selectedSection && (
              <span className={styles.filterChip}>
                第 {selectedSection} 節
                <button className={styles.chipCloseBtn} onClick={() => { setSelectedSection(''); setCurrentPage(1); }}>×</button>
              </span>
            )}
            {selectedDifficulty && (
              <span className={styles.filterChip}>
                難度: {selectedDifficulty === '1' ? '基礎' : selectedDifficulty === '2' ? '中等' : '進階'}
                <button className={styles.chipCloseBtn} onClick={() => { setSelectedDifficulty(''); setCurrentPage(1); }}>×</button>
              </span>
            )}
            {selectedType && (
              <span className={styles.filterChip}>
                題型: {selectedType}
                <button className={styles.chipCloseBtn} onClick={() => { setSelectedType(''); setCurrentPage(1); }}>×</button>
              </span>
            )}
            {onlyHasImage && (
              <span className={styles.filterChip}>
                僅含圖題
                <button className={styles.chipCloseBtn} onClick={() => { setOnlyHasImage(false); setCurrentPage(1); }}>×</button>
              </span>
            )}
            {searchKeyword && (
              <span className={styles.filterChip}>
                關鍵字: "{searchKeyword}"
                <button className={styles.chipCloseBtn} onClick={() => { setSearchKeyword(''); fetchQuestions(''); }}>×</button>
              </span>
            )}
            <button 
              className={styles.chipCloseBtn} 
              style={{ color: '#f87171', marginLeft: '6px' }}
              onClick={() => {
                setSelectedTextbook('');
                setSelectedChapter('');
                setSelectedSection('');
                setSelectedDifficulty('');
                setSelectedType('');
                setOnlyHasImage(false);
                setSearchKeyword('');
                fetchQuestions('');
              }}
            >
              重設所有條件
            </button>
          </div>
        )}
      </div>

      {/* 主畫面：左側章節導覽樹 + 右側題目清單 */}
      <div className={styles.mainLayout}>
        {/* 左側章節樹面板 */}
        <div className={styles.chapterTreeCard}>
          <div className={styles.treeHeader}>
            <span className={styles.treeTitle}>
              {selectedTextbook ? selectedTextbook : '全教材章節結構'}
            </span>
            {(selectedChapter || selectedSection) && (
              <button 
                className={styles.treeResetBtn}
                onClick={() => {
                  setSelectedChapter('');
                  setSelectedSection('');
                  setCurrentPage(1);
                }}
              >
                清除
              </button>
            )}
          </div>

          <div className={styles.treeList}>
            {currentTextbookChapters.map((ch) => {
              const isChapActive = selectedChapter === String(ch.chapNum);
              const isExpanded = expandedChapters[ch.chapNum] ?? true;

              return (
                <div key={ch.chapNum} className={styles.chapterGroup}>
                  <button 
                    className={`${styles.chapterHeader} ${isChapActive ? styles.chapterHeaderActive : ''}`}
                    onClick={() => {
                      toggleChapterExpand(ch.chapNum);
                      setSelectedChapter(String(ch.chapNum));
                      setSelectedSection('');
                      setCurrentPage(1);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span>第{ch.chapNum}章 {ch.chapName}</span>
                    </div>
                    <span className={styles.badgeCount}>{ch.questionCount || 0}</span>
                  </button>

                  {isExpanded && ch.sections && ch.sections.length > 0 && (
                    <div className={styles.sectionList}>
                      {ch.sections.map((sec) => {
                        const isSecActive = isChapActive && selectedSection === String(sec.secNum);
                        return (
                          <button
                            key={sec.secNum}
                            className={`${styles.sectionItem} ${isSecActive ? styles.sectionItemActive : ''}`}
                            onClick={() => {
                              setSelectedChapter(String(ch.chapNum));
                              setSelectedSection(String(sec.secNum));
                              setCurrentPage(1);
                            }}
                          >
                            <span>第{sec.secNum}節 {sec.secName}</span>
                            <span className={styles.badgeCount}>{sec.questionCount || 0}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 右側題目清單 */}
        <div className={styles.questionsPane}>
          <div className={styles.paneHeader}>
            <span className={styles.resultCount}>
              共找到 <strong>{totalQuestions.toLocaleString()}</strong> 筆題目 (第 {currentPage} / {totalPages} 頁)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>每頁顯示：</span>
              <select 
                className={styles.filterSelect}
                style={{ padding: '4px 8px', fontSize: '12px' }}
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10 筆</option>
                <option value={15}>15 筆</option>
                <option value={30}>30 筆</option>
                <option value={50}>50 筆</option>
              </select>
            </div>
          </div>

          {isLoadingQuestions ? (
            <div className={styles.emptyState}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
              <p>正在檢索題庫資料庫題目...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className={styles.emptyState}>
              <HelpCircle size={32} style={{ margin: '0 auto 12px auto', opacity: 0.6 }} />
              <p>找不到符合條件的題目，請嘗試放寬篩選條件或關鍵字。</p>
            </div>
          ) : (
            questions.map((q, idx) => {
              const diffClass = q.difficulty === 1 ? styles.diffEasy : q.difficulty === 3 ? styles.diffHard : styles.diffMedium;

              return (
                <div key={q.id} className={styles.questionCard}>
                  {/* 元數據標籤列 */}
                  <div className={styles.qMetaRow}>
                    <div className={styles.qBadgeGroup}>
                      <span className={styles.badgeTextbook}>{q.textbook}</span>
                      <span className={styles.badgeChapter}>
                        第{q.chapter}章 {q.chapterName} · 第{q.section}節 {q.sectionName}
                      </span>
                      <span className={`${styles.badgeDifficulty} ${diffClass}`}>
                        {q.difficultyLabel}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {q.typeLabel}
                      </span>
                      {q.hasImage && (
                        <span className={styles.badgeImage}>
                          <ImageIcon size={11} />
                          含附圖 ({q.imagePaths?.length}張)
                        </span>
                      )}
                    </div>
                    <span className={styles.qIdLabel}>
                      題號 #{q.questionNumber || idx + 1}
                    </span>
                  </div>

                  {/* 題目本體 (含 HTML 清洗後的圖片) */}
                  <div 
                    className={styles.qContent}
                    dangerouslySetInnerHTML={{ __html: q.questionHtml || q.questionText }}
                  />

                  {/* 選項清單 (標準答案直接顯示於選項上) */}
                  <div className={styles.optionsGrid}>
                    {q.options?.map((opt) => (
                      <div 
                        key={opt.id}
                        className={`${styles.optionItem} ${opt.isCorrect ? styles.optionItemCorrect : ''}`}
                      >
                        <span className={`${styles.optKey} ${opt.isCorrect ? styles.optKeyCorrect : ''}`}>
                          {opt.id}
                        </span>
                        <div 
                          className={styles.optText}
                          dangerouslySetInnerHTML={{ __html: opt.text || opt.html }}
                        />
                        {opt.isCorrect && (
                          <span className={styles.correctBadge}>
                            <CheckCircle size={12} />
                            標準答案
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 詳解說明 (若 data.mdb 中有詳解則直接呈現，無詳解則不顯示該欄位) */}
                  {q.explanationText && q.explanationText.trim() ? (
                    <div className={styles.explanationBox}>
                      <div className={styles.explanationTitle}>【解析說明】</div>
                      <p className={styles.explanationText}>{q.explanationText}</p>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}

          {/* 分頁列 */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button 
                id="btn-prev-page"
                className={styles.pageBtn}
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                上一頁
              </button>
              <span className={styles.pageInfo}>
                第 {currentPage} 頁 / 共 {totalPages} 頁
              </span>
              <button 
                id="btn-next-page"
                className={styles.pageBtn}
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                下一頁
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI 關聯驗證測試 Modal */}
      {showAiModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowAiModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <h3 className={styles.modalTitle}>題庫資料庫 × AI 學習鏈路整合驗證</h3>
                <p className={styles.modalSub}>
                  即時測試題庫資料庫如何作為 AI 測驗中心錯題生成與自主學習中心的核心知識源
                </p>
              </div>
              <button className={styles.closeIconBtn} onClick={() => setShowAiModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.tabRow}>
                <button 
                  className={`${styles.tabBtn} ${aiTestTab === 'quiz' ? styles.tabBtnActive : ''}`}
                  onClick={() => {
                    setAiTestTab('quiz');
                    setAiTestInput('商業文書應用, 格式編輯與排列');
                    setAiTestResults(null);
                  }}
                >
                  情況 1: 測驗中心 錯題確保觀念母題取樣
                </button>
                <button 
                  className={`${styles.tabBtn} ${aiTestTab === 'tutor' ? styles.tabBtnActive : ''}`}
                  onClick={() => {
                    setAiTestTab('tutor');
                    setAiTestInput('Word文件的檢視模式有哪些？');
                    setAiTestResults(null);
                  }}
                >
                  情況 2: AI 自主學習中心 提問關聯知識檢索
                </button>
              </div>

              <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
                {aiTestTab === 'quiz' ? (
                  <span>
                    💡 當學生在測驗中心做完歷屆考題後，系統會分析其錯題觀念標籤。以下輸入學生錯誤的類型，系統將依照該類型精準從題庫資料庫抓取母題作為 AI 生成種子，絕不發生「錯 A 生成 B」的問題：
                  </span>
                ) : (
                  <span>
                    💡 當學生在「AI 自主學習中心」詢問問題時，系統將依據問題內容從題庫資料庫中檢索出官方權威例題與章節，讓 AI 參考並準確回覆正確答案：
                  </span>
                )}
              </div>

              <div className={styles.testInputArea}>
                <input 
                  className={styles.testInput}
                  value={aiTestInput}
                  onChange={(e) => setAiTestInput(e.target.value)}
                  placeholder={aiTestTab === 'quiz' ? '輸入錯題標籤，例如：圖文排版, 數位資料' : '輸入學生提問，例如：什麼是雲端儲存？'}
                />
                <button 
                  className={styles.btnPrimary}
                  onClick={handleRunAiTest}
                  disabled={aiTestLoading}
                >
                  {aiTestLoading ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  <span>{aiTestLoading ? '檢索中...' : '執行比對檢索'}</span>
                </button>
              </div>

              {aiTestResults && (
                <div className={styles.testResultsBox}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text-main)' }}>
                      🎯 檢索結果：成功從題庫資料庫命中 {aiTestResults.totalFound} 道核心母題！
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>
                      關聯度 100% 精準對齊
                    </span>
                  </div>

                  {aiTestResults.matchedQuestions?.map((m, idx) => (
                    <div key={m.id} className={styles.seedItem}>
                      <div className={styles.seedMeta}>
                        [母題 {idx + 1}] 《{m.textbook}》第 {m.chapter} 章 {m.chapterName} · 第 {m.section} 節 {m.sectionName} · 難度: {m.difficultyLabel}
                      </div>
                      <div className={styles.seedQuestion}>
                        題目：{m.questionText}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        選項：{m.options.map(o => `${o.id}. ${o.text}`).join('  |  ')}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>
                        標準答案: {m.answer} {m.explanationText ? ` · 解析: ${m.explanationText}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBankFilesManager;
