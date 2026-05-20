import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, RotateCcw, BarChart2, XCircle, CheckCircle2, Bot, Lightbulb,
  ArrowRight, Folder, Globe, BookOpen, Zap, AlertCircle, ChevronDown, ChevronUp,
  Sparkles, Brain, Target, TrendingUp, Filter, RefreshCw
} from 'lucide-react';
import styles from './ErrorAnalysis.module.css';
import {
  fetchWrongQuestions, fetchMasteryStats, fetchAIExplain, fetchQuizGenerate, fetchUserExamProgress
} from '../services/examService';

// ── 輕量化數學渲染（與 ExamRenderCore 共用邏輯）──
let katexLoaded = false;
let katex = null;
const renderHtml = (html) => {
  if (!html) return '';
  if (katex) {
    return html.replace(/\$\$(.*?)\$\$/g, (match, p1) => {
      try {
        let c = p1.replace(/<\/?[a-zA-Z][^>]*>/g, '')
          .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
        return katex.renderToString(c, { throwOnError: false });
      } catch { return match; }
    });
  }
  return html;
};

// ── 選項對比徽章 ──
const OptionBadge = ({ optionId, isStudent, isCorrect, label }) => {
  const cls = isCorrect ? styles.optionBadgeCorrect : isStudent ? styles.optionBadgeWrong : styles.optionBadgeNeutral;
  return (
    <div className={cls}>
      {isCorrect ? <CheckCircle2 size={12} /> : isStudent ? <XCircle size={12} /> : null}
      <span>{label || optionId}</span>
    </div>
  );
};

// ── 掌握度柱狀圖條 ──
const MasteryBar = ({ name, masteryRate, animated }) => {
  const color = masteryRate >= 75 ? '#22c55e' : masteryRate >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className={styles.barRow}>
      <span className={styles.barLabel}>{name}</span>
      <div className={styles.barTrack}>
        <div
          className={styles.barFill}
          style={{
            width: animated ? `${masteryRate}%` : '0%',
            backgroundColor: color,
            transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        />
      </div>
      <span className={styles.barPct} style={{ color }}>{masteryRate}%</span>
    </div>
  );
};

// ── 主組件 ──
const ErrorAnalysis = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ─ 模式切換：單卷 / 全局 ─
  const [mode, setMode] = useState('single'); // 'single' | 'global'
  const [selectedExamId, setSelectedExamId] = useState(searchParams.get('examId') || '');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [completedExams, setCompletedExams] = useState([]);

  // ─ 資料狀態 ─
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [filteredWrong, setFilteredWrong] = useState([]);
  const [masteryData, setMasteryData] = useState({ byCategory: [], subjects: [] });
  const [loading, setLoading] = useState(true);
  const [masteryAnimated, setMasteryAnimated] = useState(false);

  // ─ 篩選與搜尋 ─
  const [searchText, setSearchText] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState('');

  // ─ 選中錯題 ─
  const [activeQIndex, setActiveQIndex] = useState(0);

  // ─ AI 解析狀態 ─
  const [aiData, setAiData] = useState({}); // { questionId: { status, result } }
  const [expandedAI, setExpandedAI] = useState({});

  // ─ 派題生成 ─
  const [quizGenerating, setQuizGenerating] = useState(null);
  const [quizResult, setQuizResult] = useState(null);

  // 掌握度圖表動畫觸發
  const masteryRef = useRef(null);

  // ─ 載入已完成考卷列表 ─
  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchUserExamProgress();
        setCompletedExams(list.filter(p => p.status === 'completed'));
        if (!selectedExamId && list.filter(p => p.status === 'completed').length > 0) {
          setSelectedExamId(list.filter(p => p.status === 'completed')[0].examId);
        }
      } catch {}
    };
    load();
  }, []);

  // ─ 主資料載入 ─
  const loadData = useCallback(async () => {
    setLoading(true);
    setMasteryAnimated(false);
    setActiveQIndex(0);
    setActiveTagFilter('');
    try {
      const params = mode === 'single'
        ? { examId: selectedExamId }
        : { subject: selectedSubject || undefined };

      const [wq, ms] = await Promise.all([
        fetchWrongQuestions(params),
        fetchMasteryStats(params)
      ]);

      setWrongQuestions(wq);
      setFilteredWrong(wq);
      setMasteryData(ms);

      // 觸發柱狀圖動畫
      setTimeout(() => setMasteryAnimated(true), 300);
    } catch (e) {
      console.error('載入錯題分析失敗:', e);
      setWrongQuestions([]);
      setFilteredWrong([]);
    } finally {
      setLoading(false);
    }
  }, [mode, selectedExamId, selectedSubject]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─ 本地搜尋過濾 ─
  useEffect(() => {
    let result = wrongQuestions;
    if (activeTagFilter) {
      result = result.filter(q =>
        q.tags?.includes(activeTagFilter) || q.category === activeTagFilter
      );
    }
    if (searchText.trim()) {
      result = result.filter(q =>
        (q.html || '').replace(/<[^>]+>/g, '').toLowerCase().includes(searchText.toLowerCase()) ||
        (q.category || '').toLowerCase().includes(searchText.toLowerCase())
      );
    }
    setFilteredWrong(result);
    setActiveQIndex(0);
  }, [activeTagFilter, searchText, wrongQuestions]);

  // ─ 提取所有知識點標籤 ─
  const allTags = [...new Set(wrongQuestions.flatMap(q => [...(q.tags || []), q.category].filter(Boolean)))];

  const activeQ = filteredWrong[activeQIndex] || null;

  // ─ 召喚 AI 深入解析 ─
  const handleAIExplain = async (q) => {
    const qId = q.questionId;
    setAiData(prev => ({ ...prev, [qId]: { status: 'loading' } }));
    setExpandedAI(prev => ({ ...prev, [qId]: true }));
    try {
      const result = await fetchAIExplain({
        questionId: qId,
        studentSelected: q.studentSelected,
        correctOptions: q.correctOptions,
        questionHtml: q.html
      });
      setAiData(prev => ({ ...prev, [qId]: { status: 'done', result } }));
    } catch {
      setAiData(prev => ({ ...prev, [qId]: { status: 'error' } }));
    }
  };

  // ─ 生成強化微測驗 ─
  const handleGenerateQuiz = async (count) => {
    setQuizGenerating(count);
    setQuizResult(null);
    try {
      const tags = allTags.slice(0, 5);
      const result = await fetchQuizGenerate({
        tags,
        count,
        excludeExamId: mode === 'single' ? selectedExamId : undefined
      });
      setQuizResult(result);
    } catch (e) {
      setQuizResult({ questions: [], message: '生成失敗，請稍後再試。' });
    } finally {
      setQuizGenerating(null);
    }
  };

  // ─ 選項 ID → 選項內容文字 ─
  const getOptionText = (q, id) => {
    const opt = q.options?.find(o => o.id === id);
    return opt ? `${opt.id}. ${opt.text.replace(/<[^>]+>/g, '')}` : id;
  };

  return (
    <div className={styles.pageWrapper}>
      {/* ─ 頂部導航 ─ */}
      <div className={styles.subHeader}>
        <div className={styles.subHeaderLeft}>
          <h1 className={styles.pageTitle}>考試中心</h1>
          <span className={styles.divider}>|</span>
          <nav className={styles.topNav}>
            <button className={styles.navBtn} onClick={() => navigate('/tests')}>考題庫</button>
            <button className={`${styles.navBtn} ${styles.active}`}>分析報告</button>
          </nav>
        </div>
        <div className={styles.subHeaderRight}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="搜尋錯題或知識點..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ─ 控制列 ─ */}
      <div className={styles.controlBar}>
        <div className={styles.controlLeft}>
          <span className={styles.modeLabel}>ANALYSIS MODE</span>
          <h2>AI 錯題深入分析</h2>
        </div>
        <div className={styles.controlRight}>
          {/* 單卷 / 全局 切換 */}
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeBtn} ${mode === 'single' ? styles.modeBtnActive : ''}`}
              onClick={() => setMode('single')}
            >
              <BookOpen size={14} /> 單卷
            </button>
            <button
              className={`${styles.modeBtn} ${mode === 'global' ? styles.modeBtnActive : ''}`}
              onClick={() => setMode('global')}
            >
              <Globe size={14} /> 全局
            </button>
          </div>

          {/* 單卷：考卷下拉 */}
          {mode === 'single' && (
            <select
              className={styles.examSelect}
              value={selectedExamId}
              onChange={e => setSelectedExamId(e.target.value)}
            >
              <option value="">── 選擇考卷 ──</option>
              {completedExams.map(p => (
                <option key={p.examId} value={p.examId}>
                  {p.examId}
                </option>
              ))}
            </select>
          )}

          {/* 全局：科目切換器 */}
          {mode === 'global' && (
            <select
              className={styles.examSelect}
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
            >
              <option value="">全部科目</option>
              {masteryData.subjects?.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}

          <button className={styles.outlineBtn} onClick={loadData}>
            <RotateCcw size={16} /> 重新載入
          </button>
          <button className={styles.primaryBtn}>
            <BarChart2 size={16} /> AI 錯題分析
          </button>
        </div>
      </div>

      {/* ─ 主體雙欄佈局 ─ */}
      <div className={styles.mainLayout}>
        {/* ══════════════ 左欄：錯題清單與詳細解析 ══════════════ */}
        <div className={styles.leftPane}>
          {/* 知識點標籤過濾器 */}
          {allTags.length > 0 && (
            <div className={styles.tagFilterBar}>
              <Filter size={13} className={styles.tagFilterIcon} />
              <button
                className={`${styles.tagChip} ${!activeTagFilter ? styles.tagChipActive : ''}`}
                onClick={() => setActiveTagFilter('')}
              >
                全部 ({wrongQuestions.length})
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  className={`${styles.tagChip} ${activeTagFilter === tag ? styles.tagChipActive : ''}`}
                  onClick={() => setActiveTagFilter(activeTagFilter === tag ? '' : tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* 錯題卡片列表 */}
          {loading ? (
            <div className={styles.loadingState}>
              <RefreshCw size={24} className={styles.spinner} />
              <p>正在載入錯題資料...</p>
            </div>
          ) : filteredWrong.length === 0 ? (
            <div className={styles.emptyState}>
              <CheckCircle2 size={48} className={styles.emptyIcon} />
              <h3>🎉 太棒了！</h3>
              <p>{activeTagFilter ? `「${activeTagFilter}」知識點` : ''}目前沒有錯題記錄，繼續保持！</p>
            </div>
          ) : (
            <div className={styles.wrongList}>
              {filteredWrong.map((q, idx) => {
                const qId = q.questionId;
                const aiState = aiData[qId];
                const isExpanded = expandedAI[qId];
                const isActive = idx === activeQIndex;

                return (
                  <div
                    key={qId}
                    className={`${styles.wrongCard} ${isActive ? styles.wrongCardActive : ''}`}
                    onClick={() => setActiveQIndex(idx)}
                  >
                    {/* 卡片頂部資訊列 */}
                    <div className={styles.cardTopRow}>
                      <div className={styles.cardMeta}>
                        <span className={styles.qIndex}>第 {wrongQuestions.indexOf(q) + 1} 題</span>
                        {q.subject && <span className={styles.subjectTag}>{q.subject}</span>}
                        {q.category && <span className={styles.categoryTag}>{q.category}</span>}
                        <span className={`${styles.diffDot} ${
                          q.difficulty <= 2 ? styles.diffEasy :
                          q.difficulty <= 3 ? styles.diffMid : styles.diffHard
                        }`} title={`難度 ${q.difficulty}/5`} />
                      </div>
                      <span className={styles.fromExam}>{q.examTitle || q.examId || '全局'}</span>
                    </div>

                    {/* 題目主幹 */}
                    <div
                      className={styles.qHtml}
                      dangerouslySetInnerHTML={{ __html: renderHtml(q.html) }}
                    />

                    {/* 選項比對 (學生選 vs 正確) */}
                    {q.options && q.options.length > 0 && (
                      <div className={styles.optionCompare}>
                        {q.options.map(opt => {
                          const isStudentChoice = q.studentSelected?.includes(opt.id);
                          const isCorrectChoice = q.correctOptions?.includes(opt.id);
                          const highlight = isCorrectChoice || isStudentChoice;
                          if (!highlight) return null;
                          return (
                            <div
                              key={opt.id}
                              className={`${styles.compareRow} ${
                                isCorrectChoice ? styles.compareCorrect :
                                isStudentChoice ? styles.compareWrong : ''
                              }`}
                            >
                              <span className={styles.compareIcon}>
                                {isCorrectChoice ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                              </span>
                              <span className={styles.compareLabel}>
                                {isCorrectChoice && !isStudentChoice ? '正確答案' : isStudentChoice && !isCorrectChoice ? '你的選擇' : '正確 (你也選了)'}
                              </span>
                              <span className={styles.compareOptId}>{opt.id}.</span>
                              <span
                                className={styles.compareOptText}
                                dangerouslySetInnerHTML={{ __html: renderHtml(opt.text) }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 靜態詳解 */}
                    {q.explanation && (
                      <div className={styles.explanationBox}>
                        <Lightbulb size={13} /> {q.explanation}
                      </div>
                    )}

                    {/* AI 深入解析按鈕 */}
                    <div className={styles.aiSection}>
                      {!aiState && (
                        <button
                          className={styles.aiTriggerBtn}
                          onClick={e => { e.stopPropagation(); handleAIExplain(q); }}
                        >
                          <Sparkles size={14} /> 召喚 AI 深入解析此題
                        </button>
                      )}

                      {aiState?.status === 'loading' && (
                        <div className={styles.aiLoading}>
                          <Brain size={16} className={styles.aiSpinner} />
                          <span>AI 正在深度分析您的思維盲點...</span>
                        </div>
                      )}

                      {aiState?.status === 'done' && (
                        <div className={styles.aiResultBlock}>
                          <button
                            className={styles.aiCollapseBtn}
                            onClick={e => { e.stopPropagation(); setExpandedAI(prev => ({ ...prev, [qId]: !prev[qId] })); }}
                          >
                            <Bot size={14} /> AI 觀念導正
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>

                          {isExpanded && (
                            <div className={styles.aiCards}>
                              <div className={styles.aiCard} data-type="wrong">
                                <span className={styles.aiCardIcon}><AlertCircle size={13} /></span>
                                <div>
                                  <div className={styles.aiCardTitle}>關鍵謬誤</div>
                                  <div className={styles.aiCardText}>{aiState.result.misconception}</div>
                                </div>
                              </div>
                              <div className={styles.aiCard} data-type="blind">
                                <span className={styles.aiCardIcon}><Target size={13} /></span>
                                <div>
                                  <div className={styles.aiCardTitle}>觀念盲點</div>
                                  <div className={styles.aiCardText}>{aiState.result.blindspot}</div>
                                </div>
                              </div>
                              <div className={styles.aiCard} data-type="suggest">
                                <span className={styles.aiCardIcon}><TrendingUp size={13} /></span>
                                <div>
                                  <div className={styles.aiCardTitle}>建議強化</div>
                                  <div className={styles.aiCardText}>{aiState.result.suggestion}</div>
                                </div>
                              </div>
                              {aiState.result.hint && (
                                <div className={styles.aiHint}>
                                  <Lightbulb size={13} /> 導學提示：{aiState.result.hint}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {aiState?.status === 'error' && (
                        <div className={styles.aiError}>AI 解析暫時無法使用，請稍後再試。</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ══════════════ 右欄：派題 + 掌握度圖表 + 知識點路徑 ══════════════ */}
        <div className={styles.rightPane}>
          {/* ── 確保觀念生成 ── */}
          <div className={styles.widgetCard}>
            <div className={styles.widgetHeader}>
              <Zap size={15} className={styles.widgetIcon} />
              <h3>確保觀念生成題</h3>
            </div>

            {quizResult ? (
              <div className={styles.quizResult}>
                {quizResult.questions?.length > 0 ? (
                  <>
                    <div className={styles.quizSuccessBadge}>
                      ✅ 已生成 {quizResult.questions.length} 題強化微測驗
                    </div>
                    <p className={styles.quizDesc}>
                      涵蓋知識點：{quizResult.tags?.join('、') || '相關弱項'}
                    </p>
                    <button className={styles.startQuizBtn}>
                      <ArrowRight size={14} /> 開始強化練習
                    </button>
                  </>
                ) : (
                  <p className={styles.quizEmpty}>{quizResult.message}</p>
                )}
                <button className={styles.retryBtn} onClick={() => setQuizResult(null)}>
                  重新選擇
                </button>
              </div>
            ) : (
              <div className={styles.generateOptions}>
                {[
                  { count: 10, label: '生成 10 題', desc: '快速檢查薄弱觀念（約 5 分鐘）' },
                  { count: 30, label: '生成 30 題', desc: '標準強度模擬練習（約 15 分鐘）' },
                  { count: 50, label: '生成 50 題', desc: '深度高考模擬訓練（約 30 分鐘）' }
                ].map(({ count, label, desc }) => (
                  <button
                    key={count}
                    className={`${styles.generateBtn} ${quizGenerating === count ? styles.generateBtnLoading : ''}`}
                    onClick={() => handleGenerateQuiz(count)}
                    disabled={!!quizGenerating}
                  >
                    <div className={styles.generateBtnTop}>
                      {quizGenerating === count ? <RefreshCw size={13} className={styles.spinner} /> : null}
                      <span className={styles.generateBtnLabel}>{label}</span>
                    </div>
                    <span className={styles.generateBtnDesc}>{desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── 觀念覆蓋掌握度 ── */}
          <div className={styles.widgetCard} ref={masteryRef}>
            <div className={styles.widgetHeader}>
              <BarChart2 size={15} className={styles.widgetIcon} />
              <h3>觀念覆蓋掌握度</h3>
              <div className={styles.widgetMeta}>
                <span className={styles.legendDot} style={{ background: '#22c55e' }} /> 精熟水平
                <span className={styles.legendDot} style={{ background: '#f59e0b' }} /> 目標水平
              </div>
            </div>

            {loading ? (
              <div className={styles.chartLoading}>載入中...</div>
            ) : masteryData.byCategory?.length === 0 ? (
              <div className={styles.chartEmpty}>
                <p>尚無足夠的作答資料計算掌握度。</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  完成並提交考卷後，系統將自動分析您的各觀念掌握程度。
                </p>
              </div>
            ) : (
              <div className={styles.barsContainer}>
                {masteryData.byCategory.slice(0, 8).map(item => (
                  <MasteryBar
                    key={item.name}
                    name={item.name}
                    masteryRate={item.masteryRate}
                    animated={masteryAnimated}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── 相關知識點路徑 ── */}
          {allTags.length > 0 && (
            <div className={styles.widgetCard}>
              <div className={styles.widgetHeader}>
                <Folder size={15} className={styles.widgetIcon} />
                <h3>相關知識點路徑</h3>
              </div>
              <div className={styles.tagPathGrid}>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    className={`${styles.tagPathBtn} ${activeTagFilter === tag ? styles.tagPathActive : ''}`}
                    onClick={() => {
                      setActiveTagFilter(activeTagFilter === tag ? '' : tag);
                      setActiveQIndex(0);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <Folder size={11} /> {tag}
                    {activeTagFilter === tag && <ArrowRight size={11} />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorAnalysis;
