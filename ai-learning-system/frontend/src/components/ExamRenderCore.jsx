import React, { useRef, useEffect, useState } from 'react';
import { Bookmark, Volume2, HelpCircle, FileText, CheckCircle2 } from 'lucide-react';
import styles from './ExamRenderCore.module.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const renderLatexInHtml = (html) => {
  if (!html) return '';
  return html.replace(/\$\$(.*?)\$\$/g, (match, p1) => {
    try {
      // 1. Clean formatting HTML tags inside formula (e.g. <span>)
      //    This is robust so that it does not match < or > math relations.
      let cleanFormula = p1.replace(/<\/?[a-zA-Z][^>]*>/g, '');
      
      // 2. Decode standard HTML entities for KaTeX
      cleanFormula = cleanFormula
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');

      return katex.renderToString(cleanFormula, { throwOnError: false });
    } catch (e) {
      console.error("KaTeX rendering error:", e);
      return match;
    }
  });
};

const ExamRenderCore = ({
  questions = [],
  currentIndex = 0,
  setCurrentIndex = () => {},
  selectedAnswers = {},
  onAnswerSelect = () => {},
  markedQuestions = [],
  onToggleMark = () => {},
  isPreview = false,
  deviceType = 'desktop' // 'phone', 'tablet', 'desktop'
}) => {
  const [localAnswers, setLocalAnswers] = useState({});
  const [zoomImageSrc, setZoomImageSrc] = useState(null);
  const questionRefs = useRef({});

  // 處理管理員預覽時的本地點擊狀態，維持即時預覽高質感互動
  const answers = isPreview ? localAnswers : selectedAnswers;
  const handleSelect = (qId, optionId, isMultiple = false, isSubQ = false, subQId = null) => {
    if (isPreview) {
      setLocalAnswers(prev => {
        const currentQAns = prev[qId] || { selectedOptions: [], subQuestionAnswers: [] };
        if (isSubQ) {
          const currentSubAnswers = [...(currentQAns.subQuestionAnswers || [])];
          const subIndex = currentSubAnswers.findIndex(sa => sa.subQuestionId === subQId);
          let subAns = subIndex > -1 ? { ...currentSubAnswers[subIndex] } : { subQuestionId: subQId, selectedOptions: [] };
          
          if (isMultiple) {
            const index = subAns.selectedOptions.indexOf(optionId);
            if (index > -1) {
              subAns.selectedOptions = subAns.selectedOptions.filter(o => o !== optionId);
            } else {
              subAns.selectedOptions = [...subAns.selectedOptions, optionId];
            }
          } else {
            subAns.selectedOptions = [optionId];
          }

          if (subIndex > -1) {
            currentSubAnswers[subIndex] = subAns;
          } else {
            currentSubAnswers.push(subAns);
          }
          return {
            ...prev,
            [qId]: { ...currentQAns, subQuestionAnswers: currentSubAnswers }
          };
        } else {
          let selected = [...(currentQAns.selectedOptions || [])];
          if (isMultiple) {
            const index = selected.indexOf(optionId);
            if (index > -1) {
              selected = selected.filter(o => o !== optionId);
            } else {
              selected = [...selected, optionId];
            }
          } else {
            selected = [optionId];
          }
          return {
            ...prev,
            [qId]: { ...currentQAns, selectedOptions: selected }
          };
        }
      });
    } else {
      onAnswerSelect(qId, optionId, isMultiple, isSubQ, subQId);
    }
  };

  const handleTextChange = (qId, text) => {
    if (isPreview) {
      setLocalAnswers(prev => ({
        ...prev,
        [qId]: { ...(prev[qId] || {}), answerText: text }
      }));
    } else {
      onAnswerSelect(qId, text, false, false, null, true);
    }
  };

  const activeQuestion = questions[currentIndex] || null;

  // 判斷題型是否為「標準題型」（單選、複選、是非），應採一頁到底清單渲染
  const isStandardType = (q) => {
    if (!q) return true;
    return q.type === 'single' || q.type === 'multiple' || q.type === 'tf';
  };

  const standardQuestions = questions.filter(isStandardType);
  const activeIsStandard = activeQuestion ? isStandardType(activeQuestion) : true;

  // 自動平滑滾動定位至標準題位置
  useEffect(() => {
    if (activeIsStandard && activeQuestion && questionRefs.current[activeQuestion._id]) {
      questionRefs.current[activeQuestion._id].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentIndex, activeIsStandard, activeQuestion]);

  // 圖片點擊放大預覽 (Click to Zoom Lightbox)
  useEffect(() => {
    const handleImageClick = (e) => {
      if (e.target.tagName === 'IMG') {
        if (e.target.src && !e.target.classList.contains(styles.markerBadge)) {
          setZoomImageSrc(e.target.src);
        }
      }
    };

    const container = document.querySelector(`.${styles.contentCol}`);
    if (container) {
      container.addEventListener('click', handleImageClick);
    }
    return () => {
      if (container) {
        container.removeEventListener('click', handleImageClick);
      }
    };
  }, [currentIndex, questions]);

  if (questions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <FileText size={48} className={styles.emptyIcon} />
        <h3>考卷中目前沒有任何題目</h3>
        <p>請前往編輯區建立題目以供預覽。</p>
      </div>
    );
  }

  // 統計作答狀態
  const getQStatus = (q) => {
    if (!q) return 'unanswered';
    const ans = answers[q._id];
    if (q.type === 'group') {
      const subCount = q.subQuestions?.length || 0;
      const answeredSubCount = ans?.subQuestionAnswers?.filter(sa => sa.selectedOptions?.length > 0).length || 0;
      if (answeredSubCount === 0) return 'unanswered';
      if (answeredSubCount < subCount) return 'selected'; // 已選但未填完
      return 'answered';
    }
    
    if (q.type === 'fill' || q.type === 'short') {
      return ans?.answerText?.trim() ? 'answered' : 'unanswered';
    }

    const hasSelected = ans?.selectedOptions?.length > 0;
    return hasSelected ? 'answered' : 'unanswered';
  };

  const totalAnswered = questions.filter(q => getQStatus(q) === 'answered').length;
  const totalSelected = questions.filter(q => getQStatus(q) === 'selected').length;
  const totalUnanswered = questions.length - totalAnswered - totalSelected;

  return (
    <div className={`${styles.coreWrapper} ${styles[deviceType]}`}>
      {/* 左欄題號面板 (僅在電腦版寬度顯示) */}
      {deviceType === 'desktop' && (
        <div className={styles.navigatorCol}>
          <div className={styles.navHeader}>
            <h3>題號</h3>
            <span className={styles.totalCount}>共 {questions.length} 題</span>
          </div>

          <div className={styles.statsGauge}>
            <div className={styles.gaugeItem}>
              <span className={styles.dotGreen}></span>
              <span>已答 {totalAnswered}</span>
            </div>
            <div className={styles.gaugeItem}>
              <span className={styles.dotYellow}></span>
              <span>已選 {totalSelected}</span>
            </div>
            <div className={styles.gaugeItem}>
              <span className={styles.dotGrey}></span>
              <span>未答 {totalUnanswered}</span>
            </div>
          </div>

          <div className={styles.questionGrid}>
            {questions.map((q, idx) => {
              const status = getQStatus(q);
              const isMarked = markedQuestions.includes(q._id);
              const isActive = currentIndex === idx;
              
              let btnClass = styles.gridBtn;
              if (isActive) btnClass += ` ${styles.gridActive}`;
              else if (status === 'answered') btnClass += ` ${styles.gridAnswered}`;
              else if (status === 'selected') btnClass += ` ${styles.gridSelected}`;
              
              return (
                <button
                  key={q._id}
                  className={btnClass}
                  onClick={() => setCurrentIndex(idx)}
                >
                  {idx + 1}
                  {isMarked && <span className={styles.markerBadge}>★</span>}
                </button>
              );
            })}
          </div>

          {!isPreview && (
            <button className={styles.submitBtn} onClick={() => onToggleMark('submit')}>
              交卷
            </button>
          )}
        </div>
      )}

      {/* 右欄主作答區 */}
      <div className={styles.contentCol}>
        {/* 手機/平板頂部控制項：題號下拉選單與計數 */}
        {deviceType !== 'desktop' && (
          <div className={styles.mobileNavHeader}>
            <div className={styles.selectWrapper}>
              <select 
                value={currentIndex} 
                onChange={(e) => setCurrentIndex(Number(e.target.value))}
                className={styles.mobileSelect}
              >
                {questions.map((q, idx) => (
                  <option key={q._id} value={idx}>
                    第 {idx + 1} 題 ({
                      q.type === 'single' ? '單選題' :
                      q.type === 'multiple' ? '多選題' :
                      q.type === 'tf' ? '是非題' :
                      q.type === 'group' ? '題組題' :
                      q.type === 'fill' ? '填空題' : '簡答題'
                    })
                  </option>
                ))}
              </select>
            </div>
            <span className={styles.progressText}>
              已答 {totalAnswered} / {questions.length}
            </span>
          </div>
        )}

        {/* 雙重版面動態切換：標準題列表 VS 專注題 */}
        {activeIsStandard ? (
          <div className={styles.scrollContainer}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionBadge}>第一部分</span>
              <h3>選擇題、複選題、是非題 (一頁到底捲動模式)</h3>
            </div>

            <div className={styles.scrollList}>
              {standardQuestions.map((q, sIdx) => {
                const globalIndex = questions.findIndex(item => item._id === q._id);
                const qAns = answers[q._id] || { selectedOptions: [] };
                const isMarked = markedQuestions.includes(q._id);
                
                return (
                  <div
                    key={q._id}
                    ref={el => questionRefs.current[q._id] = el}
                    className={`${styles.questionCard} ${currentIndex === globalIndex ? styles.activeCard : ''}`}
                    onClick={() => setCurrentIndex(globalIndex)}
                  >
                    <div className={styles.cardHeader}>
                      <div className={styles.cardInfo}>
                        <span className={styles.qNumber}>第 {globalIndex + 1} 題</span>
                        <span className={styles.qTypeBadge}>
                          {q.type === 'single' && '單選題'}
                          {q.type === 'multiple' && '多選題'}
                          {q.type === 'tf' && '是非題'}
                        </span>
                        <span className={styles.qScore}>{q.score || 2} 分</span>
                      </div>
                      
                      {!isPreview && (
                        <button 
                          className={`${styles.markBtn} ${isMarked ? styles.marked : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleMark(q._id);
                          }}
                        >
                          <Bookmark size={14} /> 標記待查
                        </button>
                      )}
                    </div>

                    <div className={styles.qTextContainer}>
                      {/* 富文本題目主幹 (支援圖片及 HTML/LaTeX 效果) */}
                      <div className={styles.qHtml} dangerouslySetInnerHTML={{ __html: renderLatexInHtml(q.html) }} />
                    </div>

                    {/* 選項卡片渲染 */}
                    <div className={styles.optionsList}>
                      {q.options?.map(opt => {
                        const isSelected = qAns.selectedOptions?.includes(opt.id);
                        return (
                          <div
                            key={opt.id}
                            className={`${styles.optionItem} ${isSelected ? styles.selectedOption : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(q._id, opt.id, q.type === 'multiple');
                            }}
                          >
                            <span className={styles.optionLetter}>{opt.id}</span>
                            <span className={styles.optionText} dangerouslySetInnerHTML={{ __html: renderLatexInHtml(opt.text) }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* 專注單題作答模式 (題組、填空、簡答) */
          <div className={styles.focusContainer}>
            <div className={styles.focusHeader}>
              <div className={styles.focusTitleInfo}>
                <span className={styles.sectionBadge}>第二部分</span>
                <h3>第 {currentIndex + 1} 題 - 專注答題模式</h3>
              </div>
              {!isPreview && (
                <button 
                  className={`${styles.markBtn} ${markedQuestions.includes(activeQuestion._id) ? styles.marked : ''}`}
                  onClick={() => onToggleMark(activeQuestion._id)}
                >
                  <Bookmark size={14} /> 標記待查
                </button>
              )}
            </div>

            {/* 題組題特規處理：左右雙欄分割捲動 */}
            {activeQuestion.type === 'group' ? (
              <div className={styles.groupSplitLayout}>
                {/* 左側：長篇閱讀材料 */}
                <div className={styles.groupLeftPane}>
                  <div className={styles.paneTitle}>
                    <FileText size={16} /> 閱讀測驗引文材料
                  </div>
                  <div className={styles.paneContent} dangerouslySetInnerHTML={{ __html: renderLatexInHtml(activeQuestion.html) }} />
                </div>

                {/* 右側：子題作答 */}
                <div className={styles.groupRightPane}>
                  <div className={styles.paneTitle}>
                    <CheckCircle2 size={16} /> 子題填答區
                  </div>
                  <div className={styles.subQuestionsList}>
                    {activeQuestion.subQuestions?.map((subQ, subIdx) => {
                      const qAns = answers[activeQuestion._id] || { subQuestionAnswers: [] };
                      const subQAns = qAns.subQuestionAnswers?.find(sa => sa.subQuestionId === subQ._id) || { selectedOptions: [] };
                      const isSubSelected = (optId) => subQAns.selectedOptions?.includes(optId);

                      return (
                        <div key={subQ._id} className={styles.subQuestionCard}>
                          <div className={styles.subQHeader}>
                            <span className={styles.subQNumber}>{currentIndex + 1}-{subIdx + 1} 小題</span>
                            <span className={styles.subQType}>
                              {subQ.type === 'single' ? '單選題' : '複選題'}
                            </span>
                          </div>
                          <div className={styles.subQHtml} dangerouslySetInnerHTML={{ __html: renderLatexInHtml(subQ.html) }} />
                          
                          <div className={styles.optionsList}>
                            {subQ.options?.map(opt => (
                              <div
                                key={opt.id}
                                className={`${styles.optionItem} ${isSubSelected(opt.id) ? styles.selectedOption : ''}`}
                                onClick={() => handleSelect(activeQuestion._id, opt.id, subQ.type === 'multiple', true, subQ._id)}
                              >
                                <span className={styles.optionLetter}>{opt.id}</span>
                                <span className={styles.optionText} dangerouslySetInnerHTML={{ __html: renderLatexInHtml(opt.text) }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* 填空、簡答主觀題 */
              <div className={styles.subjectiveLayout}>
                <div className={styles.subjectiveQCard}>
                  <div className={styles.subTitleBadge}>
                    {activeQuestion.type === 'fill' ? '填空題' : '簡答題'} (配分: {activeQuestion.score || 2} 分)
                  </div>
                  <div className={styles.qHtml} dangerouslySetInnerHTML={{ __html: renderLatexInHtml(activeQuestion.html) }} />
                </div>

                <div className={styles.answerArea}>
                  <h4>請在下方輸入您的解答內容：</h4>
                  {activeQuestion.type === 'fill' ? (
                    <input 
                      type="text" 
                      className={styles.fillInput}
                      placeholder="請輸入填空答案..."
                      value={answers[activeQuestion._id]?.answerText || ''}
                      onChange={(e) => handleTextChange(activeQuestion._id, e.target.value)}
                    />
                  ) : (
                    <div className={styles.textareaWrapper}>
                      <textarea
                        className={styles.shortTextarea}
                        rows={6}
                        placeholder="請在此處輸入您的簡答內容..."
                        value={answers[activeQuestion._id]?.answerText || ''}
                        onChange={(e) => handleTextChange(activeQuestion._id, e.target.value)}
                      />
                      <div className={styles.textareaStats}>
                        字數統計: {(answers[activeQuestion._id]?.answerText || '').length} 字
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 底部導航分頁條（複雜題型或手機/平板標準題時顯示） */}
        {(deviceType !== 'desktop' || !activeIsStandard) && (
          <div className={styles.footerNav}>
            <button
              className={styles.footerNavBtn}
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            >
              ← 上一題
            </button>
            <span className={styles.footerProgress}>
              第 {currentIndex + 1} 題 / 共 {questions.length} 題
            </span>
            <button
              className={styles.footerNavBtn}
              disabled={currentIndex === questions.length - 1}
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
            >
              下一題 →
            </button>
          </div>
        )}
      </div>

      {/* 圖片點擊放大高質感 Lightbox 彈窗 */}
      {zoomImageSrc && (
        <div className={styles.lightboxOverlay} onClick={() => setZoomImageSrc(null)}>
          <button className={styles.lightboxClose} onClick={() => setZoomImageSrc(null)}>&times;</button>
          <img src={zoomImageSrc} alt="Zoomed View" className={styles.lightboxImg} onClick={(e) => e.stopPropagation()} />
          <div className={styles.lightboxTip}>💡 提示：點擊任何空白處可關閉預覽</div>
        </div>
      )}
    </div>
  );
};

export default ExamRenderCore;
