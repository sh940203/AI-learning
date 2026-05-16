import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, BookOpen, Settings, ChevronRight, FileText, Target, Calculator, Calendar, Info, AlertTriangle } from 'lucide-react';
import styles from './ExamSetup.module.css';

const GSAT_SUBJECTS = [
  { name: '國語文綜合能力測驗', time: 90 },
  { name: '英文考科', time: 100 },
  { name: '數學A考科', time: 100 },
  { name: '數學B考科', time: 100 },
  { name: '社會考科', time: 110 },
  { name: '自然考科', time: 110 },
];

const TVEJE_SUBJECTS = [
  { name: '共同科目-國文', time: 100 },
  { name: '共同科目-英文', time: 100 },
  { name: '數學(A)', time: 80 },
  { name: '數學(B)', time: 80 },
  { name: '數學(C)', time: 80 },
  { name: '專業科目(一)', time: 100 },
  { name: '專業科目(二)', time: 100 },
];

const YEARS = ['111', '112', '113', '114', '115'];

const ExamSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- Exam Config State ---
  const [examConfig, setExamConfig] = useState(() => {
    if (location.state?.examConfig) return location.state.examConfig;
    return {
      examId: location.state?.examId || null,
      title: location.state?.title || '未命名題庫',
      examCategory: 'GSAT', // 'GSAT' | 'TVEJE'
      examYear: '114',
    subject: '',
    timeLimit: 100,
    noTimeLimit: false,
    deadline: '',
    deadlineTime: '',
    displayMode: 'all', // 'all' = 全卷顯示, 'sequential' = 逐題作答
    showAnswerAfterSubmit: true,
    showScoreAfterSubmit: true,
    allowRetake: false,
    retakeLimit: 1,
    defaultScore: 2,
    maxScore: '',
    noMaxScore: true,
    scoringMode: 'standard', // 'standard' | 'penalty' | 'weighted'
    penaltyAmount: 0.5,
    };
  });

  const [currentStep, setCurrentStep] = useState(1);

  const updateConfig = (key, value) => {
    setExamConfig(prev => {
      const nextConfig = { ...prev, [key]: value };
      
      // 自動帶入科目時間
      if (key === 'subject') {
        const list = nextConfig.examCategory === 'GSAT' ? GSAT_SUBJECTS : TVEJE_SUBJECTS;
        const subjObj = list.find(s => s.name === value);
        if (subjObj) {
          nextConfig.timeLimit = subjObj.time;
        }
      }
      // 切換類別時清空科目
      if (key === 'examCategory') {
        nextConfig.subject = '';
      }
      
      return nextConfig;
    });
  };

  const handleNext = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      try {
        if (examConfig.examId) {
          // 自動生成標題：[114 學測] 英文考科
          const autoTitle = `[${examConfig.examYear} ${examConfig.examCategory === 'GSAT' ? '學測' : '統測'}] ${examConfig.subject}`;
          
          const payload = { 
            ...examConfig, 
            title: autoTitle 
          };

          // 更新至後端
          const res = await fetch(`/api/exams/${examConfig.examId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (!data.success) {
            console.error('更新考卷失敗:', data.message);
          }
        }
      } catch (err) {
        console.error('API Error:', err);
      }
      
      // Navigate to editor with config
      navigate('/admin/questions/edit', { state: { examConfig: { ...examConfig, title: `[${examConfig.examYear} ${examConfig.examCategory === 'GSAT' ? '學測' : '統測'}] ${examConfig.subject}` }, isNewExam: true } });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/admin/questions'); 
    }
  };

  const isStep1Valid = examConfig.examCategory !== '' && examConfig.examYear !== '' && examConfig.subject !== '';
  const isStep2Valid = examConfig.noTimeLimit || examConfig.timeLimit > 0;

  return (
    <div className={styles.setupPage}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack}>
          <ArrowLeft size={18} />
          <span>{currentStep > 1 ? '上一步' : '返回題庫'}</span>
        </button>
        <h1 className={styles.pageTitle}>建立新考卷</h1>
      </div>

      {/* Progress Steps */}
      <div className={styles.stepsBar}>
        {[
          { num: 1, label: '基本資訊', icon: <FileText size={16} /> },
          { num: 2, label: '考試規則', icon: <Settings size={16} /> },
          { num: 3, label: '計分設定', icon: <Calculator size={16} /> },
        ].map((step) => (
          <div
            key={step.num}
            className={`${styles.step} ${currentStep === step.num ? styles.stepActive : ''} ${currentStep > step.num ? styles.stepDone : ''}`}
            onClick={() => step.num < currentStep && setCurrentStep(step.num)}
          >
            <div className={styles.stepCircle}>
              {currentStep > step.num ? '✓' : step.num}
            </div>
            <span className={styles.stepLabel}>{step.icon} {step.label}</span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className={styles.content}>
        {currentStep === 1 && (
          <div className={styles.stepContent}>
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <BookOpen size={20} />
                <h2>基本資訊</h2>
              </div>
              <p className={styles.sectionDesc}>填寫考卷的基本資訊，這些內容會顯示在學生的考試介面上。</p>

              <div className={styles.formRow}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>考試類別 <span className={styles.required}>*</span></label>
                  <select
                    className={styles.select}
                    value={examConfig.examCategory}
                    onChange={e => updateConfig('examCategory', e.target.value)}
                  >
                    <option value="GSAT">學科能力測驗 (學測)</option>
                    <option value="TVEJE">統一入學測驗 (統測)</option>
                  </select>
                </div>
                
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>適用年份 <span className={styles.required}>*</span></label>
                  <select
                    className={styles.select}
                    value={examConfig.examYear}
                    onChange={e => updateConfig('examYear', e.target.value)}
                  >
                    {YEARS.map(y => (
                      <option key={y} value={y}>{y} 年度</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  考試科目 <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={examConfig.subject}
                  onChange={e => updateConfig('subject', e.target.value)}
                >
                  <option value="">請選擇科目</option>
                  {(examConfig.examCategory === 'GSAT' ? GSAT_SUBJECTS : TVEJE_SUBJECTS).map(s => (
                    <option key={s.name} value={s.name}>{s.name} ({s.time}分鐘)</option>
                  ))}
                </select>
                <p className={styles.muted} style={{ marginTop: '8px', fontSize: '13px' }}>
                  選擇科目後，系統會自動帶入大考中心表定的考試時限。
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className={styles.stepContent}>
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <Clock size={20} />
                <h2>時間設定</h2>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>答題時限</label>
                  <div className={styles.inputWithUnit}>
                    <input
                      type="number"
                      className={styles.input}
                      value={examConfig.timeLimit}
                      onChange={e => updateConfig('timeLimit', parseInt(e.target.value) || 0)}
                      disabled={examConfig.noTimeLimit}
                      min={1}
                    />
                    <span className={styles.unit}>分鐘</span>
                  </div>
                </div>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={examConfig.noTimeLimit}
                    onChange={e => updateConfig('noTimeLimit', e.target.checked)}
                  />
                  <span>不限時</span>
                </label>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>
                    <Calendar size={14} /> 截止日期（選填）
                  </label>
                  <input
                    type="date"
                    className={styles.input}
                    value={examConfig.deadline}
                    onChange={e => updateConfig('deadline', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>截止時間</label>
                  <input
                    type="time"
                    className={styles.input}
                    value={examConfig.deadlineTime}
                    onChange={e => updateConfig('deadlineTime', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <Settings size={20} />
                <h2>作答規則</h2>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>顯示模式</label>
                <div className={styles.radioGroup}>
                  <label className={`${styles.radioCard} ${examConfig.displayMode === 'all' ? styles.radioActive : ''}`}>
                    <input type="radio" name="displayMode" value="all" checked={examConfig.displayMode === 'all'} onChange={e => updateConfig('displayMode', e.target.value)} />
                    <div>
                      <strong>全卷顯示</strong>
                      <p>所有題目同時列出，學生可自由瀏覽跳題</p>
                    </div>
                  </label>
                  <label className={`${styles.radioCard} ${examConfig.displayMode === 'sequential' ? styles.radioActive : ''}`}>
                    <input type="radio" name="displayMode" value="sequential" checked={examConfig.displayMode === 'sequential'} onChange={e => updateConfig('displayMode', e.target.value)} />
                    <div>
                      <strong>逐題作答</strong>
                      <p>一次只顯示一題，需點擊下一題切換（手機自動啟用）</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>交卷後設定</label>
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" checked={examConfig.showAnswerAfterSubmit} onChange={e => updateConfig('showAnswerAfterSubmit', e.target.checked)} />
                    <span>顯示正確答案</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" checked={examConfig.showScoreAfterSubmit} onChange={e => updateConfig('showScoreAfterSubmit', e.target.checked)} />
                    <span>顯示得分</span>
                  </label>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>重考設定</label>
                <div className={styles.formRow}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" checked={examConfig.allowRetake} onChange={e => updateConfig('allowRetake', e.target.checked)} />
                    <span>允許重考</span>
                  </label>
                  {examConfig.allowRetake && (
                    <div className={styles.inputWithUnit}>
                      <span className={styles.unit}>上限</span>
                      <input
                        type="number"
                        className={styles.inputSmall}
                        value={examConfig.retakeLimit}
                        onChange={e => updateConfig('retakeLimit', parseInt(e.target.value) || 1)}
                        min={1}
                      />
                      <span className={styles.unit}>次</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className={styles.stepContent}>
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <Target size={20} />
                <h2>計分設定</h2>
              </div>
              <p className={styles.sectionDesc}>設定預設配分與計分方式。每道題的配分也可以在編輯器中個別調整。</p>

              <div className={styles.formRow}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>預設每題配分</label>
                  <div className={styles.inputWithUnit}>
                    <input
                      type="number"
                      className={styles.input}
                      value={examConfig.defaultScore}
                      onChange={e => updateConfig('defaultScore', parseFloat(e.target.value) || 0)}
                      min={0}
                      step={0.5}
                    />
                    <span className={styles.unit}>分</span>
                  </div>
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>滿分上限</label>
                  <div className={styles.inputWithUnit}>
                    <input
                      type="number"
                      className={styles.input}
                      value={examConfig.maxScore}
                      onChange={e => updateConfig('maxScore', e.target.value)}
                      disabled={examConfig.noMaxScore}
                      placeholder="不限"
                      min={0}
                    />
                    <span className={styles.unit}>分</span>
                  </div>
                  <label className={styles.checkboxLabel} style={{ marginTop: 6 }}>
                    <input type="checkbox" checked={examConfig.noMaxScore} onChange={e => updateConfig('noMaxScore', e.target.checked)} />
                    <span>不設上限</span>
                  </label>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>計分方式</label>
                <div className={styles.scoringOptions}>
                  <label className={`${styles.scoringCard} ${examConfig.scoringMode === 'standard' ? styles.scoringActive : ''}`}>
                    <input type="radio" name="scoringMode" value="standard" checked={examConfig.scoringMode === 'standard'} onChange={e => updateConfig('scoringMode', e.target.value)} />
                    <div className={styles.scoringContent}>
                      <div className={styles.scoringIcon}>📊</div>
                      <strong>標準計分</strong>
                      <p>答對得分，答錯 0 分</p>
                    </div>
                  </label>
                  <label className={`${styles.scoringCard} ${examConfig.scoringMode === 'penalty' ? styles.scoringActive : ''}`}>
                    <input type="radio" name="scoringMode" value="penalty" checked={examConfig.scoringMode === 'penalty'} onChange={e => updateConfig('scoringMode', e.target.value)} />
                    <div className={styles.scoringContent}>
                      <div className={styles.scoringIcon}>⚠️</div>
                      <strong>倒扣計分</strong>
                      <p>答錯扣分，未答 0 分</p>
                    </div>
                  </label>
                  <label className={`${styles.scoringCard} ${examConfig.scoringMode === 'weighted' ? styles.scoringActive : ''}`}>
                    <input type="radio" name="scoringMode" value="weighted" checked={examConfig.scoringMode === 'weighted'} onChange={e => updateConfig('scoringMode', e.target.value)} />
                    <div className={styles.scoringContent}>
                      <div className={styles.scoringIcon}>⭐</div>
                      <strong>加權計分</strong>
                      <p>依題目難度自動加權</p>
                    </div>
                  </label>
                </div>
              </div>

              {examConfig.scoringMode === 'penalty' && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <AlertTriangle size={14} /> 倒扣分數
                  </label>
                  <div className={styles.inputWithUnit}>
                    <span className={styles.unit}>每答錯一題扣</span>
                    <input
                      type="number"
                      className={styles.inputSmall}
                      value={examConfig.penaltyAmount}
                      onChange={e => updateConfig('penaltyAmount', parseFloat(e.target.value) || 0)}
                      min={0}
                      step={0.1}
                    />
                    <span className={styles.unit}>分</span>
                  </div>
                </div>
              )}

              {examConfig.scoringMode === 'weighted' && (
                <div className={styles.infoBox}>
                  <Info size={16} />
                  <p>加權計分會根據每道題目的難度等級 (★1~5) 自動調整配分比重。難度越高的題目，得分權重越大。</p>
                </div>
              )}
            </div>

            {/* Summary Preview */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <FileText size={20} />
                <h2>考卷摘要</h2>
              </div>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>考試名稱</span>
                  <span className={styles.summaryValue}>
                    {examConfig.examYear ? `${examConfig.examYear}學年度 ` : ''}
                    {examConfig.examCategory === 'GSAT' ? '學科能力測驗' : '統一入學測驗'} - {examConfig.subject || '未指定'}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>科目</span>
                  <span className={styles.summaryValue}>{examConfig.subject || '—'}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>時限</span>
                  <span className={styles.summaryValue}>{examConfig.noTimeLimit ? '不限時' : `${examConfig.timeLimit} 分鐘`}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>計分</span>
                  <span className={styles.summaryValue}>
                    {examConfig.scoringMode === 'standard' ? '標準計分' : examConfig.scoringMode === 'penalty' ? `倒扣 ${examConfig.penaltyAmount} 分` : '加權計分'}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>預設配分</span>
                  <span className={styles.summaryValue}>{examConfig.defaultScore} 分 / 題</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>顯示模式</span>
                  <span className={styles.summaryValue}>{examConfig.displayMode === 'all' ? '全卷顯示' : '逐題作答'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className={styles.footer}>
        <button className={styles.footerBackBtn} onClick={handleBack}>
          {currentStep > 1 ? '← 上一步' : '← 返回題庫'}
        </button>
        <div className={styles.stepIndicator}>
          步驟 {currentStep} / 3
        </div>
        <button
          className={styles.footerNextBtn}
          onClick={handleNext}
          disabled={
            (currentStep === 1 && !isStep1Valid) ||
            (currentStep === 2 && !isStep2Valid)
          }
        >
          {currentStep < 3 ? '下一步 →' : '開始編輯題目 →'}
        </button>
      </div>
    </div>
  );
};

export default ExamSetup;
