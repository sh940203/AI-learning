import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, AlertTriangle, RefreshCw, CheckCircle, CloudOff, Cloud } from 'lucide-react';
import { fetchExamById, updateExamProgress, fetchUserExamProgress } from '../services/examService';
import ExamRenderCore from '../components/ExamRenderCore';
import styles from './TakeExam.module.css';

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [examData, setExamData] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [markedQuestions, setMarkedQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // 計時器與儲存狀態
  const [timeLeft, setTimeLeft] = useState(3600); // 預設 60 分鐘
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved' | 'error'
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [unansweredList, setUnansweredList] = useState([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const mainRef = useRef(null);

  // 1. 初始化載入考卷資料與進度
  useEffect(() => {
    const loadExam = async () => {
      setLoading(true);
      try {
        const data = await fetchExamById(examId);
        setExamData(data);

        // 載入該生先前的進度 (若有)
        const progressList = await fetchUserExamProgress();
        const progress = progressList.find(p => p.examId === examId);
        
        if (progress) {
          // 還原已答選項
          const answersMap = {};
          if (progress.answers && Array.isArray(progress.answers)) {
            progress.answers.forEach(a => {
              answersMap[a.questionId] = {
                selectedOptions: a.selectedOptions || [],
                answerText: a.answerText || '',
                subQuestionAnswers: a.subQuestionAnswers || []
              };
            });
          }
          setSelectedAnswers(answersMap);
          
          if (progress.status === 'completed') {
            if (data.allowRetake) {
              const confirmRetake = window.confirm(
                '您已經完成過此試卷。管理員已開啟「允許重考」功能，是否要重新開始挑戰一次？\n（注意：這將會清除您先前的所有作答與分數紀錄）'
              );
              if (confirmRetake) {
                // 重設後端進度
                await updateExamProgress(examId, {
                  status: 'in_progress',
                  progressRate: 0,
                  score: 0,
                  answers: []
                });
                setSelectedAnswers({}); // 清除前端選項快取
              } else {
                navigate('/error-analysis');
                return;
              }
            } else {
              alert('這份考卷已經完成，即將跳轉至分析報告！');
              navigate('/error-analysis');
              return;
            }
          }
        }

        // 初始化倒數時間
        if (data.timeLimit && !data.noTimeLimit) {
          setTimeLeft(data.timeLimit * 60);
        } else {
          setTimeLeft(3600); // 預設 60 分鐘
        }
      } catch (err) {
        console.error('載入考卷失敗:', err);
      } finally {
        setLoading(false);
      }
    };
    loadExam();
  }, [examId, navigate]);

  // 2. 倒數計時器計數邏輯
  useEffect(() => {
    if (loading || !examData) return;
    if (examData.noTimeLimit) return; // 無時間限制

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit(); // 時間截止自動交卷
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, examData]);

  // 3. 定時每 30 秒雲端自動存檔
  useEffect(() => {
    if (loading || !examData) return;

    const autoSaveTimer = setInterval(() => {
      handleSaveProgress(true);
    }, 30000);

    return () => clearInterval(autoSaveTimer);
  }, [loading, examData, selectedAnswers]);

  // 4. 監聽滾動更新 HUD 進度條
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const progress = scrollHeight > clientHeight
        ? (scrollTop / (scrollHeight - clientHeight)) * 100
        : 0;
      setScrollProgress(Math.min(100, progress));
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [loading, examData]);

  // 格式化時間為 MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 暫存作答進度到後端
  const handleSaveProgress = async (isSilent = true) => {
    if (!isSilent) setSaveStatus('saving');
    try {
      if (!examData || questionsList.length === 0) return;

      // 計算完成率
      const answeredCount = questionsList.filter(q => {
        const ans = selectedAnswers[q._id];
        if (q.type === 'group') {
          return ans?.subQuestionAnswers?.filter(sa => sa.selectedOptions?.length > 0).length > 0;
        }
        return ans?.selectedOptions?.length > 0 || ans?.answerText?.trim();
      }).length;
      
      const progressRate = Math.round((answeredCount / questionsList.length) * 100);

      // 轉換儲存格式為後端 Schema
      const formattedAnswers = Object.keys(selectedAnswers).map(qId => ({
        questionId: qId,
        selectedOptions: selectedAnswers[qId].selectedOptions || [],
        answerText: selectedAnswers[qId].answerText || '',
        subQuestionAnswers: selectedAnswers[qId].subQuestionAnswers || []
      }));

      await updateExamProgress(examId, {
        status: 'in_progress',
        progressRate,
        answers: formattedAnswers
      });
      
      setSaveStatus('saved');
      // 2 秒後自動回到安靜狀態
      setTimeout(() => setSaveStatus('saved'), 2000);
    } catch (err) {
      console.error('儲存進度失敗:', err);
      setSaveStatus('error');
    }
  };

  // 處理答題選擇事件
  const handleAnswerSelect = (qId, val, isMultiple = false, isSubQ = false, subQId = null, isText = false) => {
    setSaveStatus('unsaved');
    setSelectedAnswers(prev => {
      const currentQAns = prev[qId] || { selectedOptions: [], subQuestionAnswers: [], answerText: '' };
      
      if (isText) {
        return {
          ...prev,
          [qId]: { ...currentQAns, answerText: val }
        };
      }

      if (isSubQ) {
        const currentSubAnswers = [...(currentQAns.subQuestionAnswers || [])];
        const subIndex = currentSubAnswers.findIndex(sa => sa.subQuestionId === subQId);
        let subAns = subIndex > -1 ? { ...currentSubAnswers[subIndex] } : { subQuestionId: subQId, selectedOptions: [] };
        
        if (isMultiple) {
          const index = subAns.selectedOptions.indexOf(val);
          if (index > -1) {
            subAns.selectedOptions = subAns.selectedOptions.filter(o => o !== val);
          } else {
            subAns.selectedOptions = [...subAns.selectedOptions, val];
          }
        } else {
          subAns.selectedOptions = [val];
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
          const index = selected.indexOf(val);
          if (index > -1) {
            selected = selected.filter(o => o !== val);
          } else {
            selected = [...selected, val];
          }
        } else {
          selected = [val];
        }
        return {
          ...prev,
          [qId]: { ...currentQAns, selectedOptions: selected }
        };
      }
    });
  };

  // 標記待查切換
  const handleToggleMark = (qId) => {
    if (qId === 'submit') {
      // 觸發交卷核對確認
      checkUnansweredAndOpenDialog();
      return;
    }
    setMarkedQuestions(prev => 
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    );
  };

  // 盤點未答題目並打開確認交卷 Dialog
  const checkUnansweredAndOpenDialog = () => {
    if (!examData) return;
    const unanswered = [];
    questionsList.forEach((q, idx) => {
      const ans = selectedAnswers[q._id];
      let hasAns = false;

      if (q.type === 'group') {
        const subCount = q.subQuestions?.length || 0;
        const answeredSubCount = ans?.subQuestionAnswers?.filter(sa => sa.selectedOptions?.length > 0).length || 0;
        if (answeredSubCount === subCount) hasAns = true;
      } else if (q.type === 'fill' || q.type === 'short') {
        if (ans?.answerText?.trim()) hasAns = true;
      } else {
        if (ans?.selectedOptions?.length > 0) hasAns = true;
      }

      if (!hasAns) {
        unanswered.push(idx + 1);
      }
    });
    setUnansweredList(unanswered);
    setShowSubmitConfirm(true);
  };

  // 正式點擊交卷
  const handleSubmitExam = async () => {
    setLoading(true);
    try {
      const formattedAnswers = Object.keys(selectedAnswers).map(qId => ({
        questionId: qId,
        selectedOptions: selectedAnswers[qId].selectedOptions || [],
        answerText: selectedAnswers[qId].answerText || '',
        subQuestionAnswers: selectedAnswers[qId].subQuestionAnswers || []
      }));

      await updateExamProgress(examId, {
        status: 'completed',
        progressRate: 100,
        answers: formattedAnswers
      });
      
      setShowSubmitConfirm(false);
      navigate('/error-analysis');
    } catch (err) {
      console.error('交卷提交失敗:', err);
      alert('提交考卷失敗，請檢查網路連線後重試！');
      setLoading(false);
    }
  };

  // 時間截止自動交卷
  const handleAutoSubmit = async () => {
    setLoading(true);
    try {
      const formattedAnswers = Object.keys(selectedAnswers).map(qId => ({
        questionId: qId,
        selectedOptions: selectedAnswers[qId].selectedOptions || [],
        answerText: selectedAnswers[qId].answerText || '',
        subQuestionAnswers: selectedAnswers[qId].subQuestionAnswers || []
      }));

      await updateExamProgress(examId, {
        status: 'completed',
        progressRate: 100,
        answers: formattedAnswers
      });
      alert('⏰ 考試時間截止！系統已為您自動交卷。');
      navigate('/error-analysis');
    } catch (err) {
      console.error('自動交卷失敗:', err);
      navigate('/tests');
    }
  };

  // 離開並交卷 (原為暫存離開)
  const handleExitAndSubmit = () => {
    checkUnansweredAndOpenDialog();
  };

  if (loading && !examData) {
    return (
      <div className={styles.loadingContainer}>
        <RefreshCw size={36} className={styles.spinner} />
        <p>正在載入考卷內容，請稍候...</p>
      </div>
    );
  }

  const questionsList = examData?.questions || [];

  return (
    <div className={styles.takeExamWrapper}>
      {/* 沉浸式頂部控制列 */}
      <header className={styles.examHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.examTitle}>{examData?.title}</h1>
        </div>

        <div className={styles.headerRight}>
          {/* 雲端同步狀態動畫 Icon */}
          <div className={`${styles.saveIndicator} ${
            saveStatus === 'saving' ? styles.saveIndicatorSaving :
            saveStatus === 'unsaved' ? styles.saveIndicatorUnsaved :
            saveStatus === 'error' ? styles.saveIndicatorError : ''
          }`}>
            {saveStatus === 'saved' && <CheckCircle size={14} className={styles.saveIconSaved} />}
            {saveStatus === 'saving' && <Cloud size={14} className={styles.saveIconSyncing} />}
            {saveStatus === 'unsaved' && <Cloud size={14} className={styles.saveIconUnsaved} />}
            {saveStatus === 'error' && <CloudOff size={14} />}
            <span className={styles.saveText}>
              {saveStatus === 'saved' && '已同步'}
              {saveStatus === 'saving' && '同步中...'}
              {saveStatus === 'unsaved' && '有未儲存修改'}
              {saveStatus === 'error' && '同步失敗'}
            </span>
          </div>

          {/* 倒數計時器 */}
          {!examData?.noTimeLimit && (
            <div className={`${styles.timerBox} ${timeLeft <= 300 ? styles.timerAlert : ''}`}>
              <Clock size={16} />
              <span className={styles.timerText}>{formatTime(timeLeft)}</span>
            </div>
          )}

          <button className={styles.submitBtnHeader} onClick={checkUnansweredAndOpenDialog}>
            確認交卷
          </button>
        </div>
      </header>

      {/* 滾動進度 HUD 條 */}
      <div className={styles.scrollProgressBar}>
        <div className={styles.scrollProgressFill} style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* 主體作答渲染區 */}
      <main className={styles.examMain} ref={mainRef}>
        <ExamRenderCore
          questions={questionsList}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          selectedAnswers={selectedAnswers}
          onAnswerSelect={handleAnswerSelect}
          markedQuestions={markedQuestions}
          onToggleMark={handleToggleMark}
          isPreview={false}
          deviceType="desktop"
        />
      </main>

      {/* 交卷確認 Dialog */}
      {showSubmitConfirm && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogCard}>
            <div className={styles.dialogIconWrapper}>
              <AlertTriangle size={32} color="#eab308" />
            </div>
            
            <h3 className={styles.dialogTitle}>確定要提交考卷嗎？</h3>
            
            {unansweredList.length > 0 ? (
              <div className={styles.unansweredNotice}>
                <p>⚠️ 您尚有 <strong>{unansweredList.length}</strong> 題未完成填答：</p>
                <div className={styles.unansweredGrid}>
                  {unansweredList.map(num => (
                    <button
                      key={num}
                      className={styles.unansweredNumBtn}
                      onClick={() => {
                        setCurrentIndex(num - 1);
                        setShowSubmitConfirm(false);
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <p className={styles.clickNotice}>* 點選上方題號可立即跳轉至該題進行補答。</p>
              </div>
            ) : (
              <p className={styles.successNotice}>🎉 恭喜！您已完成所有題目的填答。</p>
            )}

            <p className={styles.dialogSubText}>交卷後系統將立即為您進行自動閱卷與錯題分析，答案將無法修改。</p>

            <div className={styles.dialogActions}>
              <button 
                className={styles.dialogCancelBtn} 
                onClick={() => setShowSubmitConfirm(false)}
                disabled={loading}
              >
                返回繼續作答
              </button>
              <button 
                className={styles.dialogConfirmBtn} 
                onClick={handleSubmitExam}
                disabled={loading}
              >
                {loading ? '提交中...' : '確認交卷'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeExam;
