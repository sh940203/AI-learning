import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Paperclip, Send, RefreshCw, Download, FileText, File, Loader2 } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import styles from './AILearning.module.css';
import { useAuth } from '../context/AuthContext';

// 移除寫死的最近檔案，因為目前還沒實作資料庫儲存，先保持空或預設
const recentFiles = [];
const keywords = ['時間複雜度', '排序演算法', '遞迴關係式', '動態規劃', 'Big O 表示法'];

const AILearning = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content: '你好！我是一位專屬商科與專業科目的 AI 學習導師。你可以上傳講義 PDF，我會根據內容幫助你學習！',
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextText, setContextText] = useState('');
  const [remainingCount, setRemainingCount] = useState(5);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleUploadSuccess = (data) => {
    setContextText(data.text);
    setMessages([{
      role: 'model',
      content: `已成功讀取講義「${data.filename}」！我現在已經完全掌握這份文件的內容了，你可以根據裡面的重點向我提問。`
    }]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    if (!user) {
      alert('請先登入系統才能使用 AI 導師功能！');
      return;
    }
    if (remainingCount <= 0) {
      alert('今日提問次數已達上限，請明天再來！');
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/ai/tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          history: messages,
          message: userMessage,
          contextText: contextText
        })
      });

      const data = await response.json();
      
      if (response.status === 403) {
        setMessages([...newMessages, { role: 'model', content: data.message }]);
        setRemainingCount(0);
      } else if (data.success) {
        setMessages([...newMessages, { role: 'model', content: data.reply }]);
        if (data.remainingCount !== undefined) {
          setRemainingCount(data.remainingCount);
        }
      } else {
        setMessages([...newMessages, { role: 'model', content: data.reply || data.message || '發生錯誤，請稍後再試。' }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages([...newMessages, { role: 'model', content: '網路錯誤，無法連接到家教系統。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={styles.container}>
      {/* Left Column: File Management */}
      <div className={styles.leftCol}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>知識庫建立 (上傳講義)</h2>
          <FileUpload onUploadSuccess={handleUploadSuccess} />
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>目前知識庫範圍</h2>
          {contextText ? (
            <div className={styles.fileItem}>
              <div className={`${styles.fileIcon} ${styles.iconPdf}`}>
                <FileText size={20} color="white" />
              </div>
              <div className={styles.fileInfo}>
                <h4>已載入上傳的講義內容</h4>
                <p>AI 回答將嚴格限制於此文件範圍</p>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>尚未上傳任何文件，AI 僅能使用基礎設定回答。</p>
          )}
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
                <h3>AI 學習導師</h3>
                <p><span className={styles.statusDot}></span> 準備就緒</p>
              </div>
            </div>
            <div className={styles.chatHeaderActions}>
              <button onClick={() => {
                setContextText('');
                setMessages([{role: 'model', content: '對話與知識庫已重置。您可以重新上傳講義，或是直接提問。'}]);
              }} title="重置對話與知識庫"><RefreshCw size={18} /></button>
            </div>
          </div>

          {/* Chat History */}
          <div className={styles.chatHistory}>
            {messages.map((msg, index) => (
              <div key={index} className={`${styles.messageRow} ${msg.role === 'user' ? styles.userRow : ''}`}>
                {msg.role === 'model' && <div className={styles.aiAvatarSmall}></div>}
                <div className={msg.role === 'user' ? styles.userBubble : styles.messageBubble}>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className={styles.messageRow}>
                <div className={styles.aiAvatarSmall}></div>
                <div className={styles.messageBubble} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader2 size={16} className={styles.spinner} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>正在思考...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className={styles.chatInputArea}>
            <div className={styles.inputWrapper}>
              <input 
                type="text" 
                placeholder={remainingCount <= 0 ? "今日額度已用盡" : "向 AI 導師提問..."} 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading || remainingCount <= 0}
              />
              <button 
                className={styles.sendBtn} 
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim() || remainingCount <= 0}
                style={{ opacity: (isLoading || !inputValue.trim() || remainingCount <= 0) ? 0.5 : 1 }}
              >
                <Send size={18} />
              </button>
            </div>
            <div className={styles.inputFooter}>
              <span>ℹ AI 僅會根據您上傳的知識庫範圍進行回答。</span>
              <span style={{ color: remainingCount <= 0 ? '#ef4444' : 'inherit', fontWeight: remainingCount <= 0 ? 'bold' : 'normal' }}>
                今日剩餘提問額度: {remainingCount} / 5
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AILearning;
