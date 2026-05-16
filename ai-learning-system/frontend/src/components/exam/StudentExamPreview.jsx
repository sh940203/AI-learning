import React, { useState } from 'react';
import styles from './StudentExamPreview.module.css';

/**
 * StudentExamPreview — 真實考試 UI 預覽容器
 * 
 * 用於管理端預覽，未來也用於學生端實際考試頁面。
 * 根據 previewMode 切換三種設備佈局。
 */

// ─── ExamTopBar ───
const ExamTopBar = ({ examName, timeLimit, mode }) => {
  const timeDisplay = timeLimit > 0 ? `${timeLimit}:00` : '不限時';
  
  if (mode === 'mobile') {
    return (
      <div className={styles.topBar}>
        <span className={styles.topBarBack}>← 返回</span>
        <span className={styles.topBarTitle}>{examName || '考試名稱'}</span>
        <span className={styles.topBarTimer}>⏱ {timeDisplay}</span>
      </div>
    );
  }
  
  return (
    <div className={`${styles.topBar} ${mode === 'desktop' ? styles.topBarDesktop : ''}`}>
      <span className={styles.topBarBack}>← 返回題庫</span>
      <span className={styles.topBarTitle}>{examName || '考試名稱'}</span>
      <span className={styles.topBarTimer}>⏱ 答題截止 {timeDisplay}</span>
    </div>
  );
};

// ─── ProgressBar (Mobile/Tablet) ───
const ProgressBar = ({ current, total, answeredCount, onToggleOverlay }) => {
  const percentage = total > 0 ? (answeredCount / total) * 100 : 0;
  
  return (
    <button className={styles.progressBar} onClick={onToggleOverlay}>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${percentage}%` }} />
      </div>
      <span className={styles.progressText}>{answeredCount}/{total}</span>
      <span className={styles.progressChevron}>▾</span>
    </button>
  );
};

// ─── ProgressOverlay (Immersive) ───
const ProgressOverlay = ({ questions, currentIndex, onClose, onJumpTo }) => {
  const answered = questions.filter(q => q.simStatus === 'answered').length;
  const selected = questions.filter(q => q.simStatus === 'selected').length;
  const unanswered = questions.filter(q => q.simStatus === 'unanswered').length;
  
  return (
    <div className={styles.overlayBackdrop} onClick={onClose}>
      <div className={styles.overlayPanel} onClick={e => e.stopPropagation()}>
        <div className={styles.overlayHeader}>
          <h3>答題進度總覽</h3>
          <button className={styles.overlayClose} onClick={onClose}>✕</button>
        </div>
        
        <div className={styles.overlayStats}>
          <div className={styles.overlayStat}>
            <span className={`${styles.statDot} ${styles.statGreen}`} />
            <span>已答 {answered} 題</span>
          </div>
          <div className={styles.overlayStat}>
            <span className={`${styles.statDot} ${styles.statYellow}`} />
            <span>已選未確認 {selected} 題</span>
          </div>
          <div className={styles.overlayStat}>
            <span className={`${styles.statDot} ${styles.statGray}`} />
            <span>未作答 {unanswered} 題</span>
          </div>
        </div>
        
        <div className={styles.overlayGrid}>
          {questions.map((q, idx) => (
            <button
              key={q.id}
              className={`${styles.gridCell} ${styles[`grid_${q.simStatus}`]} ${idx === currentIndex ? styles.gridCurrent : ''}`}
              onClick={() => onJumpTo(idx)}
            >
              {idx + 1}
            </button>
          ))}
        </div>
        
        <button className={styles.overlayContinueBtn} onClick={onClose}>
          繼續作答
        </button>
      </div>
    </div>
  );
};

// ─── QuestionCard ───
const QuestionCard = ({ index, type, html, score, status, renderLatex }) => {
  const typeLabels = {
    single: '單選題', multiple: '複選題', tf: '是非題',
    fill: '填空題', short: '簡答題', listening: '聽力題'
  };
  const statusLabels = {
    answered: '已作答', selected: '已選未確認', unanswered: '未作答'
  };
  const statusColors = {
    answered: styles.statusAnswered, selected: styles.statusSelected, unanswered: styles.statusUnanswered
  };
  
  return (
    <div className={styles.questionCard}>
      <div className={styles.qCardHeader}>
        <div className={styles.qCardLeft}>
          <span className={styles.qCardBadge}>{typeLabels[type] || '題型'}</span>
          {score > 0 && <span className={styles.qCardScore}>{score} 分</span>}
        </div>
        {status && (
          <span className={`${styles.qCardStatus} ${statusColors[status] || ''}`}>
            {statusLabels[status] || ''}
          </span>
        )}
      </div>
      <div className={styles.qCardBody}>
        <span className={styles.qCardNumber}>{index + 1}.</span>
        <div
          className={styles.qCardContent}
          dangerouslySetInnerHTML={{ __html: renderLatex ? renderLatex(html) : html || '<span class="placeholder">題目內容...</span>' }}
        />
      </div>
    </div>
  );
};

// ─── OptionsGroup ───
const OptionsGroup = ({ type, options, layout = 'stack' }) => {
  const [selected, setSelected] = useState(null);
  
  if (type === 'fill') {
    return (
      <div className={styles.optFillContainer}>
        <input type="text" className={styles.optFillInput} placeholder="請輸入答案..." disabled />
      </div>
    );
  }
  
  if (type === 'short') {
    return (
      <div className={styles.optFillContainer}>
        <textarea className={styles.optShortInput} placeholder="請輸入簡答內容..." disabled rows={3} />
      </div>
    );
  }
  
  if (type === 'tf') {
    return (
      <div className={`${styles.optionsGroup} ${styles.optionsTF}`}>
        <button className={`${styles.optionBtn} ${selected === 'O' ? styles.optionSelected : ''}`} onClick={() => setSelected('O')}>
          <span className={styles.optCircle}>O</span>
          <span>正確</span>
        </button>
        <button className={`${styles.optionBtn} ${selected === 'X' ? styles.optionSelected : ''}`} onClick={() => setSelected('X')}>
          <span className={styles.optCircle}>X</span>
          <span>錯誤</span>
        </button>
      </div>
    );
  }
  
  return (
    <div className={`${styles.optionsGroup} ${layout === 'grid' ? styles.optionsGrid : ''}`}>
      {(options || []).map((opt) => (
        <button
          key={opt.id}
          className={`${styles.optionBtn} ${selected === opt.id ? styles.optionSelected : ''} ${opt.isCorrect && selected === opt.id ? styles.optionCorrect : ''}`}
          onClick={() => setSelected(type === 'multiple' ? null : opt.id)}
        >
          <span className={`${styles.optLetter} ${selected === opt.id ? styles.optLetterActive : ''}`}>{opt.id}</span>
          <span className={styles.optText}>{opt.text || '選項內容...'}</span>
        </button>
      ))}
    </div>
  );
};

// ─── GroupSubQuestions ───
const GroupSubQuestions = ({ subQuestions, layout, renderLatex }) => {
  return (
    <div className={styles.groupSubQuestions} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {(subQuestions || []).map((sq, index) => (
        <div key={sq.id} className={styles.subQuestionItem} style={{ padding: '16px', backgroundColor: 'var(--color-bg-hover)', borderRadius: '8px' }}>
          <div className={styles.sqHeader} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <span className={styles.sqNumber} style={{ fontWeight: 600 }}>({index + 1})</span>
            <div 
              className={styles.sqContent}
              dangerouslySetInnerHTML={{ __html: renderLatex ? renderLatex(sq.html) : sq.html || '子題內容...' }}
            />
          </div>
          <div className={styles.sqOptions}>
            <OptionsGroup type={sq.type} options={sq.options} layout={layout} />
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── QuestionGrid (Desktop Sidebar) ───
const QuestionGrid = ({ questions, currentIndex, onSelect }) => {
  const answered = questions.filter(q => q.simStatus === 'answered').length;
  const selected = questions.filter(q => q.simStatus === 'selected').length;
  const unanswered = questions.filter(q => q.simStatus === 'unanswered').length;
  
  return (
    <div className={styles.sidePanel}>
      <div className={styles.sidePanelHeader}>
        <span>題號</span>
        <span className={styles.sidePanelCount}>共 {questions.length} 題</span>
      </div>
      
      <div className={styles.sideGrid}>
        {questions.map((q, idx) => (
          <button
            key={q.id}
            className={`${styles.sideGridCell} ${styles[`grid_${q.simStatus}`]} ${idx === currentIndex ? styles.sideGridActive : ''}`}
            onClick={() => onSelect(idx)}
          >
            {idx + 1}
          </button>
        ))}
      </div>
      
      <div className={styles.sideStats}>
        <div className={styles.sideStat}><span className={`${styles.statDot} ${styles.statGreen}`} /> 已答 {answered}</div>
        <div className={styles.sideStat}><span className={`${styles.statDot} ${styles.statYellow}`} /> 已選 {selected}</div>
        <div className={styles.sideStat}><span className={`${styles.statDot} ${styles.statGray}`} /> 未答 {unanswered}</div>
      </div>
      
      <button className={styles.sideSubmitBtn}>交卷</button>
    </div>
  );
};

// ─── NavFooter (Mobile) ───
const NavFooter = ({ current, total, onPrev, onNext }) => (
  <div className={styles.navFooter}>
    <button className={styles.navBtn} onClick={onPrev} disabled={current <= 0}>
      ◀ 上一題
    </button>
    <span className={styles.navCurrent}>第 {current + 1} 題</span>
    <button className={styles.navBtn} onClick={onNext} disabled={current >= total - 1}>
      下一題 ▶
    </button>
  </div>
);

// ═══════════════════════════════════════
// Main Component
// ═══════════════════════════════════════
const StudentExamPreview = ({
  previewMode = 'mobile',
  examConfig = {},
  questions = [],
  currentQuestionIndex = 0,
  questionHTML = '',
  activeType = 'single',
  options = [],
  subQuestions = [],
  wordLimit = 0,
  renderLatexInHtml = (html) => html,
}) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [simCurrentIndex, setSimCurrentIndex] = useState(0);

  // Build simulated question list for the grid
  const simQuestions = questions.length > 0
    ? questions.map((q, i) => ({
        ...q,
        simStatus: i === currentQuestionIndex ? 'selected' : (q.status === 'saved' ? 'answered' : 'unanswered')
      }))
    : [{ id: 1, simStatus: 'selected' }, { id: 2, simStatus: 'unanswered' }];

  const answeredCount = simQuestions.filter(q => q.simStatus === 'answered').length;
  const totalCount = simQuestions.length;

  // ─── Mobile Layout ───
  if (previewMode === 'mobile') {
    return (
      <div className={styles.mobileFrame}>
        <ExamTopBar examName={examConfig.name} timeLimit={examConfig.timeLimit || 60} mode="mobile" />
        <ProgressBar current={simCurrentIndex} total={totalCount} answeredCount={answeredCount} onToggleOverlay={() => setShowOverlay(true)} />
        
        <div className={styles.mobileBody}>
          <QuestionCard
            index={currentQuestionIndex}
            type={activeType}
            html={questionHTML}
            score={examConfig.defaultScore || 2}
            status="selected"
            renderLatex={renderLatexInHtml}
          />
          {activeType === 'group' ? (
            <GroupSubQuestions subQuestions={subQuestions} layout="stack" renderLatex={renderLatexInHtml} />
          ) : (
            <OptionsGroup type={activeType} options={options} layout="stack" />
          )}
        </div>
        
        <NavFooter current={simCurrentIndex} total={totalCount} onPrev={() => setSimCurrentIndex(Math.max(0, simCurrentIndex - 1))} onNext={() => setSimCurrentIndex(Math.min(totalCount - 1, simCurrentIndex + 1))} />
        
        {showOverlay && (
          <ProgressOverlay
            questions={simQuestions}
            currentIndex={simCurrentIndex}
            onClose={() => setShowOverlay(false)}
            onJumpTo={(idx) => { setSimCurrentIndex(idx); setShowOverlay(false); }}
          />
        )}
      </div>
    );
  }

  // ─── Tablet Layout ───
  if (previewMode === 'tablet') {
    return (
      <div className={styles.tabletFrame}>
        <ExamTopBar examName={examConfig.name} timeLimit={examConfig.timeLimit || 60} mode="tablet" />
        <ProgressBar current={simCurrentIndex} total={totalCount} answeredCount={answeredCount} onToggleOverlay={() => setShowOverlay(true)} />
        
        <div className={styles.tabletBody}>
          <QuestionCard
            index={currentQuestionIndex}
            type={activeType}
            html={questionHTML}
            score={examConfig.defaultScore || 2}
            status="selected"
            renderLatex={renderLatexInHtml}
          />
          {activeType === 'group' ? (
            <GroupSubQuestions subQuestions={subQuestions} layout="stack" renderLatex={renderLatexInHtml} />
          ) : (
            <OptionsGroup type={activeType} options={options} layout="grid" />
          )}
          
          <div className={styles.tabletNav}>
            <button className={styles.tabletNavBtn} disabled={simCurrentIndex <= 0}>◀ 上一題</button>
            <button className={styles.tabletNavBtn} disabled={simCurrentIndex >= totalCount - 1}>下一題 ▶</button>
          </div>
        </div>
        
        {showOverlay && (
          <ProgressOverlay
            questions={simQuestions}
            currentIndex={simCurrentIndex}
            onClose={() => setShowOverlay(false)}
            onJumpTo={(idx) => { setSimCurrentIndex(idx); setShowOverlay(false); }}
          />
        )}
      </div>
    );
  }

  // ─── Desktop Layout (Full Paper) ───
  return (
    <div className={styles.desktopFrame}>
      <ExamTopBar examName={examConfig.name} timeLimit={examConfig.timeLimit || 60} mode="desktop" />
      
      <div className={styles.desktopLayout}>
        <QuestionGrid
          questions={simQuestions}
          currentIndex={currentQuestionIndex}
          onSelect={(idx) => setSimCurrentIndex(idx)}
        />
        
        <div className={styles.desktopContent}>
          {/* Full paper mode: show all questions */}
          {simQuestions.map((q, idx) => (
            <div key={q.id} className={styles.desktopQuestion}>
              <QuestionCard
                index={idx}
                type={idx === currentQuestionIndex ? activeType : (q.type || 'single')}
                html={idx === currentQuestionIndex ? questionHTML : (q.html || '<span style="color:#94a3b8">此題目尚未編輯...</span>')}
                score={q.score || examConfig.defaultScore || 2}
                status={q.simStatus}
                renderLatex={renderLatexInHtml}
              />
              {idx === currentQuestionIndex && activeType === 'group' && (
                <GroupSubQuestions subQuestions={subQuestions} layout="stack" renderLatex={renderLatexInHtml} />
              )}
              {idx === currentQuestionIndex && activeType !== 'group' && (
                <OptionsGroup type={activeType} options={options} layout="stack" />
              )}
              {idx !== currentQuestionIndex && (
                q.type === 'group' ? (
                  <GroupSubQuestions subQuestions={q.subQuestions} layout="stack" renderLatex={renderLatexInHtml} />
                ) : (
                  <OptionsGroup type={q.type || 'single'} options={q.options || [{id:'A',text:'選項 A'},{id:'B',text:'選項 B'},{id:'C',text:'選項 C'},{id:'D',text:'選項 D'}]} layout="stack" />
                )
              )}
              {idx < simQuestions.length - 1 && <div className={styles.desktopDivider} />}
            </div>
          ))}
          
          <button className={styles.desktopSubmitBtn}>確認送出全卷 →</button>
        </div>
      </div>
    </div>
  );
};

export default StudentExamPreview;
