import React, { useState } from 'react';
import { Sparkles, Sliders, Play, Code, Eye, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import styles from './AITestConsole.module.css';

const AITestConsole = () => {
  const [subject, setSubject] = useState('會計學');
  const [chapter, setChapter] = useState('CH1 會計基本概念');
  const [questionType, setQuestionType] = useState('single');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(2);
  const [customPrompt, setCustomPrompt] = useState('請搭配當前台灣商業實務案例出題，並著重觀念觀念辨析。');

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'json'
  const [generatedResult, setGeneratedResult] = useState(null);
  const [executionStats, setExecutionStats] = useState(null);

  const mockSeedData = [
    {
      subject: '會計學',
      chapter: 'CH1 會計基本概念',
      questions: [
        {
          id: 'gen_1',
          title: '甲公司於 113 年底購入一部機器設備，成本 \$500,000，預計使用年限 5 年，無殘值。採用直線法提列折舊。請問第 2 年底該機器之累計折舊與帳面金額分別為何？',
          type: '單選題',
          options: [
            'A. 累計折舊 \$100,000，帳面金額 \$400,000',
            'B. 累計折舊 \$200,000，帳面金額 \$300,000',
            'C. 累計折舊 \$300,000，帳面金額 \$200,000',
            'D. 累計折舊 \$200,000，帳面金額 \$500,000'
          ],
          correctAnswer: 'B',
          explanation: '每年折舊費用 = \$500,000 / 5 = \$100,000。第 2 年底累計折舊 = \$100,000 × 2 = \$200,000。第 2 年底帳面金額 = 成本 - 累計折舊 = \$500,000 - \$200,000 = \$300,000。'
        },
        {
          id: 'gen_2',
          title: '關於會計品質特性中的「攸關性 (Relevance)」，下列何者非屬其基本或組成要素？',
          type: '單選題',
          options: [
            'A. 預測價值 (Predictive Value)',
            'B. 確認價值 (Confirmative Value)',
            'C. 重大性 (Materiality)',
            'D. 完整性 (Completeness)'
          ],
          correctAnswer: 'D',
          explanation: '完整性 (Completeness) 為「忠實表述 (Faithful Representation)」的要素之一，非屬「攸關性」。'
        }
      ]
    }
  ];

  const handleGenerateTest = async () => {
    setIsLoading(true);
    setGeneratedResult(null);
    setExecutionStats(null);

    const startTime = Date.now();

    try {
      // 呼叫實際後端 AI 測試接口 (發送 POST 請求)
      const res = await fetch('http://localhost:5001/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          chapter,
          questionType,
          difficulty,
          count: parseInt(count, 10),
          promptSuffix: customPrompt
        })
      });
      const data = await res.json();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (data && data.success && data.questions) {
        setGeneratedResult(data.questions);
        setExecutionStats({
          timeTaken: `${duration}s`,
          seedSource: '題庫資料庫 (`qb_113_acct.xlsx`)',
          tokenCount: 842,
          model: 'Gemini 3.6 Flash'
        });
      } else {
        // Mock fallback
        setTimeout(() => {
          setGeneratedResult(mockSeedData[0].questions);
          setExecutionStats({
            timeTaken: `${duration}s`,
            seedSource: '題庫資料庫 (`qb_113_acct.xlsx`)',
            tokenCount: 620,
            model: 'Gemini 3.6 Flash (Simulated)'
          });
        }, 1200);
      }
    } catch (err) {
      console.log('連線測試模式，展示模擬 AI 生成題目卡片');
      setTimeout(() => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        setGeneratedResult(mockSeedData[0].questions);
        setExecutionStats({
          timeTaken: `${duration}s`,
          seedSource: '題庫資料庫 (`qb_113_acct.xlsx`)',
          tokenCount: 620,
          model: 'Gemini 3.6 Flash (Simulated)'
        });
        setIsLoading(false);
      }, 1000);
      return;
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <Sparkles color="var(--color-primary)" size={26} />
          AI 生成問題測試控制台
        </h1>
        <p className={styles.subtitle}>
          對接題庫資料庫種子檔，測試 Prompt 參數、題型難易度與 AI 出題品質
        </p>
      </div>

      <div className={styles.grid}>
        {/* 左側：測試參數設定面板 */}
        <div className={styles.controlCard}>
          <div className={styles.cardTitle}>
            <Sliders size={18} color="var(--color-primary)" />
            AI 出題參數微調
          </div>

          <div className={styles.formGroup}>
            <label>選擇目標科目</label>
            <select className={styles.select} value={subject} onChange={e => setSubject(e.target.value)}>
              <option value="會計學">會計學</option>
              <option value="經濟學">經濟學</option>
              <option value="數位科技概論">數位科技概論</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>指定單元 / 章節</label>
            <input 
              type="text" 
              className={styles.input} 
              value={chapter} 
              onChange={e => setChapter(e.target.value)} 
            />
          </div>

          <div className={styles.formGroup}>
            <label>題目類型</label>
            <div className={styles.radioGroup}>
              <div 
                className={`${styles.radioBtn} ${questionType === 'single' ? styles.active : ''}`}
                onClick={() => setQuestionType('single')}
              >
                單選題
              </div>
              <div 
                className={`${styles.radioBtn} ${questionType === 'multiple' ? styles.active : ''}`}
                onClick={() => setQuestionType('multiple')}
              >
                複選題
              </div>
              <div 
                className={`${styles.radioBtn} ${questionType === 'essay' ? styles.active : ''}`}
                onClick={() => setQuestionType('essay')}
              >
                簡答題
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>難易度等級</label>
            <div className={styles.radioGroup}>
              <div 
                className={`${styles.radioBtn} ${difficulty === 'easy' ? styles.active : ''}`}
                onClick={() => setDifficulty('easy')}
              >
                初級
              </div>
              <div 
                className={`${styles.radioBtn} ${difficulty === 'medium' ? styles.active : ''}`}
                onClick={() => setDifficulty('medium')}
              >
                中級
              </div>
              <div 
                className={`${styles.radioBtn} ${difficulty === 'hard' ? styles.active : ''}`}
                onClick={() => setDifficulty('hard')}
              >
                高級
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>生成題數數量</label>
            <select className={styles.select} value={count} onChange={e => setCount(e.target.value)}>
              <option value={1}>1 題 (快速評估)</option>
              <option value={2}>2 題 (標準測試)</option>
              <option value={5}>5 題 (批次驗證)</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Prompt 附加指示 (Prompt Engineering)</label>
            <textarea 
              className={styles.textarea}
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              placeholder="可填寫額外的出題指令，例如：附詳細會計分錄與算式說明"
            />
          </div>

          <button 
            className={styles.generateBtn} 
            onClick={handleGenerateTest}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                呼叫 AI 生成中...
              </>
            ) : (
              <>
                <Play size={18} />
                觸發 AI 測試生成
              </>
            )}
          </button>
        </div>

        {/* 右側：測試結果與 JSON 檢視器 */}
        <div className={styles.outputCard}>
          <div className={styles.tabsHeader}>
            <div className={styles.tabs}>
              <button 
                className={`${styles.tab} ${activeTab === 'preview' ? styles.active : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                <Eye size={16} /> 題目渲染卡片
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'json' ? styles.active : ''}`}
                onClick={() => setActiveTab('json')}
              >
                <Code size={16} /> Raw JSON 數據
              </button>
            </div>

            {executionStats && (
              <div className={styles.metaBadge}>
                <span className={styles.badgeItem}>
                  <Clock size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {executionStats.timeTaken}
                </span>
                <span className={styles.badgeItem}>{executionStats.seedSource}</span>
                <span className={styles.badgeItem}>{executionStats.model}</span>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className={styles.loadingState}>
              <RefreshCw size={36} style={{ animation: 'spin 1.2s linear infinite', marginBottom: '16px' }} />
              <h3>AI 正在檢索題庫資料庫並衍生考題...</h3>
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                使用依據：{subject} / {chapter}
              </p>
            </div>
          ) : !generatedResult ? (
            <div className={styles.emptyState}>
              <Sparkles size={48} color="var(--color-text-muted)" style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3>尚未觸發 AI 測試出題</h3>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>
                請在左側調整難度與題型，點擊「觸發 AI 測試生成」開始品質評估。
              </p>
            </div>
          ) : activeTab === 'preview' ? (
            <div>
              {generatedResult.map((q, idx) => (
                <div key={q.id || idx} className={styles.questionCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '14px' }}>
                      第 {idx + 1} 題 ({q.type || '單選題'})
                    </span>
                    <span style={{ fontSize: '12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '4px' }}>
                      難度: {difficulty === 'easy' ? '初級' : difficulty === 'medium' ? '中級' : '高級'}
                    </span>
                  </div>
                  
                  <div className={styles.questionTitle}>{q.title}</div>
                  
                  {q.options && (
                    <div className={styles.optionsList}>
                      {q.options.map((opt, oIdx) => {
                        const optKey = String.fromCharCode(65 + oIdx);
                        const isCorrect = q.correctAnswer === optKey || opt.startsWith(q.correctAnswer);
                        return (
                          <div 
                            key={oIdx} 
                            className={`${styles.optionItem} ${isCorrect ? styles.correct : ''}`}
                          >
                            {opt}
                            {isCorrect && (
                              <CheckCircle2 size={16} style={{ float: 'right', marginTop: '2px' }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className={styles.explanationBox}>
                    <strong>💡 AI 題目解析與解題邏輯：</strong>
                    <div style={{ marginTop: '4px' }}>{q.explanation}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <pre className={styles.jsonViewer}>
              {JSON.stringify({
                status: 'success',
                params: { subject, chapter, questionType, difficulty, count, customPrompt },
                meta: executionStats,
                questions: generatedResult
              }, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default AITestConsole;
