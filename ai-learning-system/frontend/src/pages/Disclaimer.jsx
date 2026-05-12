import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Disclaimer.module.css';

const Disclaimer = () => {
  const [isChecked, setIsChecked] = useState(false);
  const navigate = useNavigate();

  const handleAgree = () => {
    if (isChecked) {
      navigate('/dashboard');
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>系統服務聲明</h2>
          <p>在使用 AI智能輔助自主學習系統 前，請詳閱以下規範。</p>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h3>1. 隱私政策</h3>
            <p>我們極其重視您的個人隱私。本系統所收集之學習數據，包含但不限於測驗成績、學習時數、對話紀錄，皆僅用於優化您的個人化學習路徑。我們承諾不將您的個人資訊出售予第三方機構。</p>
          </div>

          <div className={styles.section}>
            <h3>2. 使用規範</h3>
            <p>使用者應遵守學術倫理，AI 建議內容僅供學習輔助參考。嚴禁利用本系統進行任何形式的考試舞弊、數據竄改或惡意攻擊系統之行為。</p>
          </div>

          <div className={styles.section}>
            <h3>3. AI 模型聲明</h3>
            <p>AI 生成之內容可能存在偶發性偏差，請學員結合教材進行判斷。系統對非預期之生成結果不承擔最終法律責任。</p>
          </div>
        </div>

        <div className={styles.footer}>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={isChecked} 
              onChange={(e) => setIsChecked(e.target.checked)} 
              className={styles.checkbox}
            />
            <span>我已閱讀並理解上述隱私政策與使用規範，並同意受其約束。</span>
          </label>
          
          <button 
            className={`${styles.agreeBtn} ${!isChecked ? styles.disabled : ''}`}
            disabled={!isChecked}
            onClick={handleAgree}
          >
            我同意
          </button>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;
