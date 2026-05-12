import React from 'react';
import { MoreVertical, Paperclip, Send, RefreshCw, Download, FileText, File } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import styles from './AILearning.module.css';

const recentFiles = [
  { id: 1, name: '計算機概論_期末複習.pdf', size: '2.4 MB', status: '已完成分析', type: 'pdf' },
  { id: 2, name: '演算法基礎筆記.docx', size: '842 KB', status: '已完成分析', type: 'word' }
];

const keywords = ['時間複雜度', '排序演算法', '遞迴關係式', '動態規劃', 'Big O 表示法'];

const AILearning = () => {
  return (
    <div className={styles.container}>
      {/* Left Column: File Management */}
      <div className={styles.leftCol}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>檔案處理中心</h2>
          <FileUpload />
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>最近上傳</h2>
          <div className={styles.fileList}>
            {recentFiles.map(file => (
              <div key={file.id} className={styles.fileItem}>
                <div className={`${styles.fileIcon} ${file.type === 'pdf' ? styles.iconPdf : styles.iconWord}`}>
                  {file.type === 'pdf' ? <FileText size={20} color="white" /> : <File size={20} color="white" />}
                </div>
                <div className={styles.fileInfo}>
                  <h4>{file.name}</h4>
                  <p>{file.size} • {file.status}</p>
                </div>
                <button className={styles.moreBtn}><MoreVertical size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeaderRow}>
            <h2 className={styles.cardTitle}>學習關鍵詞</h2>
            <span className={styles.badgeAutoAI}>AUTO AI</span>
          </div>
          <div className={styles.keywordTags}>
            {keywords.map((kw, i) => (
              <span key={i} className={styles.tag}>{kw}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Chat Interface */}
      <div className={styles.rightCol}>
        <div className={styles.chatContainer}>
          {/* Chat Header */}
          <div className={styles.chatHeader}>
            <div className={styles.chatTitleGroup}>
              <div className={styles.aiAvatar}>
                <span>AI</span>
              </div>
              <div className={styles.chatTitleInfo}>
                <h3>AI 學習助手</h3>
                <p><span className={styles.statusDot}></span> 正在分析「計算機概論_期末複習.pdf」</p>
              </div>
            </div>
            <div className={styles.chatHeaderActions}>
              <button><RefreshCw size={18} /></button>
              <button><Download size={18} /></button>
            </div>
          </div>

          {/* Chat History */}
          <div className={styles.chatHistory}>
            {/* AI Message */}
            <div className={styles.messageRow}>
              <div className={styles.aiAvatarSmall}></div>
              <div className={styles.messageBubble}>
                <p>你好！我已經準備好協助你學習這份教材了。你可以嘗試以下指令：</p>
                <ul className={styles.suggestionList}>
                  <li><FileText size={14} /> 總結這份文件的 5 個核心重點</li>
                  <li><FileText size={14} /> 根據文件內容生成 10 題複習測驗</li>
                  <li><FileText size={14} /> 解釋什麼是「時間複雜度」</li>
                </ul>
              </div>
            </div>

            {/* User Message */}
            <div className={`${styles.messageRow} ${styles.userRow}`}>
              <div className={styles.userBubble}>
                請幫我摘要 PDF 第三頁關於排序演算法的部分，並用繁體中文列出優缺點比較表格。
              </div>
              <span className={styles.messageTime}>下午 2:30</span>
            </div>

            {/* AI Response with Table */}
            <div className={styles.messageRow}>
              <div className={styles.aiAvatarSmall}></div>
              <div className={styles.messageBubble}>
                <p>根據文件內容，常見的排序演算法優缺點如下：</p>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>演算法</th>
                      <th>優點</th>
                      <th>缺點</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>快速排序 (Quick Sort)</td>
                      <td>平均速度最快</td>
                      <td>最差情況為 O(n²)</td>
                    </tr>
                    <tr>
                      <td>合併排序 (Merge Sort)</td>
                      <td>穩定、時間一致</td>
                      <td>額外空間消耗大</td>
                    </tr>
                  </tbody>
                </table>
                <p>需要進一步解釋特定的演算法細節嗎？</p>
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div className={styles.chatInputArea}>
            <div className={styles.inputWrapper}>
              <button className={styles.attachBtn}><Paperclip size={20} /></button>
              <input type="text" placeholder="向 AI 助手提問，或要求生成測驗..." />
              <button className={styles.sendBtn}><Send size={18} /></button>
            </div>
            <div className={styles.inputFooter}>
              <span>ℹ AI 可能會產生錯誤訊息，請務必核對重要資訊。</span>
              <span>Token: 245 / 4000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AILearning;
