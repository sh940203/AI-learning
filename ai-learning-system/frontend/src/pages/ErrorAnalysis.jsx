import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RotateCcw, BarChart2, XCircle, CheckCircle2, Bot, Lightbulb, ArrowRight, Folder } from 'lucide-react';
import styles from './ErrorAnalysis.module.css';

const ErrorAnalysis = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.pageWrapper}>
      {/* Sub Header */}
      <div className={styles.subHeader}>
        <div className={styles.subHeaderLeft}>
          <h1 className={styles.pageTitle}>考試中心</h1>
          <span className={styles.divider}>|</span>
          <nav className={styles.topNav}>
            <button className={styles.navBtn}>我的課程</button>
            <button className={styles.navBtn} onClick={() => navigate('/tests')}>考題庫</button>
            <button className={`${styles.navBtn} ${styles.active}`}>分析報告</button>
          </nav>
        </div>
        <div className={styles.subHeaderRight}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input type="text" placeholder="搜尋題目或知識點..." />
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Top Control Bar */}
        <div className={styles.controlBar}>
          <div className={styles.controlLeft}>
            <span className={styles.modeLabel}>ANALYSIS MODE</span>
            <h2>AI 錯題深入分析</h2>
          </div>
          <div className={styles.controlRight}>
            <button className={styles.outlineBtn}>結束測驗</button>
            <button className={styles.outlineBtn}><RotateCcw size={16} /> AI 重新檢測</button>
            <button className={styles.primaryBtn}><BarChart2 size={16} /> AI 錯題分析</button>
          </div>
        </div>

        {/* Main Analysis Card */}
        <div className={styles.analysisCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <span className={styles.iconBlue}><Bot size={20} /></span> 觀念深度解析
            </h3>
            <span className={styles.questionId}>QUESTION ID: #EXAM-8842</span>
          </div>

          <div className={styles.questionSection}>
            <div className={styles.qNum}>08</div>
            <p className={styles.qText}>
              在分散式系統架構中，關於 CAP 定理的敘述，下列何者正確？若系統要求在網路分區 (Partition Tolerance) 發生時，仍需保證數據的強一致性 (Consistency)，則必須犧牲哪一項特性？
            </p>
          </div>

          <div className={styles.optionsGrid}>
            <div className={styles.optionBoxError}>
              <span className={styles.badgeError}>錯誤選項</span>
              <div className={styles.optionContent}>
                <XCircle size={20} color="#ef4444" />
                <span>A. 犧牲分區容忍性 (P)，改採 CA 架構</span>
              </div>
            </div>
            <div className={styles.optionBoxCorrect}>
              <span className={styles.badgeCorrect}>正確答案</span>
              <div className={styles.optionContent}>
                <CheckCircle2 size={20} color="#22c55e" />
                <span>C. 犧牲可用性 (Availability)，改採 CP 架構</span>
              </div>
            </div>
          </div>

          <div className={styles.aiCorrection}>
            <h4 className={styles.correctionTitle}>
              <Bot size={18} /> AI 觀念導正
            </h4>
            <p className={styles.correctionDesc}>
              你似乎將「系統架構的選擇」與「故障時的應對方案」混淆了。CAP 定理指出，在分散式系統發生網路分區 (P) 時，你只能在一致性 (C) 和可用性 (A) 之間二選一。
            </p>

            <div className={styles.insightGrid}>
              <div className={styles.insightBox}>
                <span className={styles.insightLabel}>關鍵謬誤</span>
                <p>認為 CA 架構在網路分區時可行</p>
              </div>
              <div className={styles.insightBox}>
                <span className={styles.insightLabel}>邏輯盲點</span>
                <p>忽略了 P 在現代網路環境是必然存在的</p>
              </div>
              <div className={styles.insightBox}>
                <span className={styles.insightLabel}>建議強化</span>
                <p>複習分散式數據庫的 Quorum 寫入協議</p>
              </div>
            </div>

            <div className={styles.expertTip}>
              <Lightbulb size={18} color="#eab308" className={styles.tipIcon} />
              <p>專家提醒：CAP 定理中，CA 在單機環境下成立，但在分散式 (Distributed) 情境下，「分區」是前提，因此選擇通常在 CP 或 AP 之間。</p>
            </div>
          </div>
        </div>

        {/* Bottom 2 Columns */}
        <div className={styles.bottomGrid}>
          <div className={styles.generateSection}>
            <h3 className={styles.sectionTitle}>
              <RotateCcw size={18} /> 確保觀念生成題
            </h3>
            <div className={styles.generateCards}>
              <button className={styles.genCard}>
                <div className={styles.genInfo}>
                  <h4>生成 10 題</h4>
                  <p>快速檢查基礎觀念 (預計 5 分鐘)</p>
                </div>
                <ArrowRight size={20} color="var(--color-outline)" />
              </button>
              <button className={styles.genCard}>
                <div className={styles.genInfo}>
                  <h4>生成 30 題</h4>
                  <p>標準強度模擬練習 (預計 15 分鐘)</p>
                </div>
                <ArrowRight size={20} color="var(--color-outline)" />
              </button>
              <button className={styles.genCard}>
                <div className={styles.genInfo}>
                  <h4>生成 50 題</h4>
                  <p>深度固化考題訓練 (預計 30 分鐘)</p>
                </div>
                <ArrowRight size={20} color="var(--color-outline)" />
              </button>
            </div>
          </div>

          <div className={styles.chartSection}>
            <div className={styles.chartHeader}>
              <div>
                <h3 className={styles.sectionTitle}>觀念覆蓋掌握度</h3>
                <p className={styles.chartSub}>基於本次測驗與 AI 歷史分析</p>
              </div>
              <div className={styles.chartLegend}>
                <span><span className={styles.dotBlue}></span> 當前水平</span>
                <span><span className={styles.dotGrey}></span> 目標水準</span>
              </div>
            </div>

            <div className={styles.barChart}>
              <div className={styles.barCol}>
                <div className={styles.barBg}>
                  <div className={styles.barFill} style={{ height: '25%' }}></div>
                </div>
                <span className={styles.barLabel}>分散式基礎</span>
              </div>
              <div className={styles.barCol}>
                <div className={styles.barBg} style={{ height: '100%' }}>
                  <div className={styles.barFill} style={{ height: '75%' }}></div>
                </div>
                <span className={styles.barLabel}>CAP 理論</span>
              </div>
              <div className={styles.barCol}>
                <div className={styles.barBg} style={{ height: '80%' }}>
                  <div className={styles.barFill} style={{ height: '25%' }}></div>
                </div>
                <span className={styles.barLabel}>一致性協議</span>
              </div>
              <div className={styles.barCol}>
                <div className={styles.barBg} style={{ height: '100%' }}>
                  <div className={styles.barFill} style={{ height: '100%' }}></div>
                </div>
                <span className={styles.barLabel}>數據分片</span>
              </div>
            </div>
          </div>
        </div>

        {/* Knowledge Path */}
        <div className={styles.knowledgePath}>
          <h3 className={styles.pathTitle}>相關知識點路徑</h3>
          <div className={styles.tagsGroup}>
            <button className={styles.tagBtn}><Folder size={16} /> 計算機系統結構</button>
            <button className={`${styles.tagBtn} ${styles.active}`}><Folder size={16} /> 分散式運算</button>
            <button className={styles.tagBtn}><Folder size={16} /> 資料庫管理系統</button>
            <button className={styles.tagBtn}><Folder size={16} /> 網路協議</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorAnalysis;
