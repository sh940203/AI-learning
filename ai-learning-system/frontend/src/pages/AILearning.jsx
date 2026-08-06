import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, RefreshCw, Loader2, MessageSquare, Plus, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import 'katex/dist/katex.min.css';
import styles from './AILearning.module.css';

const DAILY_LIMIT = 5;
const STORAGE_KEY = 'ai_daily_question_records';

const generateDeviceId = () => {
  return 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
};

const getTodayDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 讀取 localStorage 紀錄 [日期]: [已發問次數]
const getDailyQuestionRecords = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

// 取得今日已發問次數
const getTodayQuestionCount = () => {
  const records = getDailyQuestionRecords();
  const today = getTodayDateStr();
  if (typeof records[today] === 'number') {
    return records[today];
  }
  const fallback = localStorage.getItem(today);
  return fallback ? parseInt(fallback, 10) : 0;
};

// 成功發送後更新 localStorage 紀錄 [日期]: [已發問次數]
const incrementTodayQuestionCount = () => {
  const records = getDailyQuestionRecords();
  const today = getTodayDateStr();
  const currentCount = typeof records[today] === 'number' ? records[today] : 0;
  const newCount = currentCount + 1;
  records[today] = newCount;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  localStorage.setItem(today, newCount.toString());
  return newCount;
};

const AILearning = () => {
  const [deviceId, setDeviceId] = useState('');
  const [usedCount, setUsedCount] = useState(0);
  
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content: '你好！我是一位專屬商科與專業科目的 AI 學習導師。你可以上傳題目圖片，我會根據中央知識庫幫助你解答！',
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const remainingCount = Math.max(0, DAILY_LIMIT - usedCount);
  const isLimitReached = usedCount >= DAILY_LIMIT;

  useEffect(() => {
    // 1. Setup Device ID
    let storedDeviceId = localStorage.getItem('ai_device_id');
    if (!storedDeviceId) {
      storedDeviceId = generateDeviceId();
      localStorage.setItem('ai_device_id', storedDeviceId);
    }
    setDeviceId(storedDeviceId);

    // 2. 檢查 localStorage 紀錄發問次數 [日期]: [已發問次數]
    const count = getTodayQuestionCount();
    setUsedCount(count);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    if (deviceId) {
      fetchSessions();
    }
  }, [deviceId]);
  
  const fetchSessions = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/ai/sessions', {
        headers: { 'X-Device-Id': deviceId }
      });
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (e) {
      console.error(e);
    }
  };
  
  const loadSession = async (id) => {
    try {
      const res = await fetch(`http://localhost:5001/api/ai/sessions/${id}`, {
        headers: { 'X-Device-Id': deviceId }
      });
      const data = await res.json();
      if (data.success) {
        setActiveSessionId(id);
        setMessages(data.session.messages);
        setImageUrl(data.session.imageUrl || '');
      }
    } catch (e) {
      console.error(e);
    }
  };
  
  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([{
      role: 'model',
      content: '你好！我是一位專屬商科與專業科目的 AI 學習導師。你可以上傳題目圖片，我會根據中央知識庫幫助你解答！'
    }]);
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 任務 A：前端圖片轉換為 Base64 字串並進行圖片預覽
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('目前僅支援圖片！');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target.result;
      setImageUrl(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !imageUrl) return;
    
    // 任務 B：發問次數上限檢查
    if (isLimitReached) {
      alert('今日發問額度已用盡，請明日再來！');
      return;
    }

    const userMessage = inputValue.trim();
    const currentBase64 = imageUrl;
    setInputValue('');
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    const newMessages = [
      ...messages,
      { role: 'user', content: userMessage, imageUrl: currentBase64 }
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      setIsLoading(false);
      let modelContent = '';
      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      // 任務 A：Payload 修改，將 Base64 字串與文字訊息發送給後端
      await fetchEventSource('http://localhost:5001/api/ai/tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId
        },
        body: JSON.stringify({
          sessionId: activeSessionId,
          history: messages.filter(m => !m.content.includes('你好！我是一位專屬商科')),
          message: userMessage,
          imageUrl: currentBase64
        }),
        onmessage(ev) {
          try {
            const data = JSON.parse(ev.data);
            if (data.type === 'chunk') {
              modelContent += data.text;
              setMessages(prev => {
                const newMsg = [...prev];
                newMsg[newMsg.length - 1].content = modelContent;
                return newMsg;
              });
            } else if (data.type === 'done') {
              if (data.sessionId && !activeSessionId) {
                setActiveSessionId(data.sessionId);
                fetchSessions();
              }
              // 任務 B：每次成功發送/回應後更新 localStorage 發問紀錄 [日期]: [已發問次數]
              const newCount = incrementTodayQuestionCount();
              setUsedCount(newCount);
            } else if (data.type === 'error') {
               setMessages(prev => {
                const newMsg = [...prev];
                newMsg[newMsg.length - 1].content = data.reply;
                return newMsg;
              });
            }
          } catch (e) {
            // Ignore parse errors
          }
        },
        onerror(err) {
          console.error("SSE Connection Error", err);
          throw err;
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      setMessages([...newMessages, { role: 'model', content: '網路錯誤，無法連接到家教系統。' }]);
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
      {/* Sidebar for History */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <button className={styles.newChatBtn} onClick={handleNewChat}>
            <Plus size={18} /> 新增對話
          </button>
        </div>
        <div className={styles.historyList}>
          {sessions.map(s => (
            <button 
              key={s._id} 
              className={`${styles.historyItem} ${activeSessionId === s._id ? styles.active : ''}`}
              onClick={() => loadSession(s._id)}
            >
              <MessageSquare size={16} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={styles.mainArea}>
        <div className={styles.chatHeader}>
          <div className={styles.chatTitleGroup}>
            <div className={styles.aiAvatar}>AI</div>
            <div className={styles.chatTitleInfo}>
              <h3>AI 學習導師</h3>
              <p><span className={styles.statusDot}></span> 準備就緒</p>
            </div>
          </div>
          <div className={styles.chatHeaderActions}>
             <button onClick={handleNewChat} title="重置對話與附件"><RefreshCw size={18} /></button>
          </div>
        </div>

        <div className={styles.chatHistory}>
          {messages.map((msg, index) => (
            <div key={index} className={`${styles.messageRow} ${msg.role === 'user' ? styles.userRow : ''}`}>
              {msg.role === 'model' && <div className={styles.aiAvatarSmall}></div>}
              <div className={msg.role === 'user' ? styles.userBubble : styles.messageBubble}>
                {msg.imageUrl && (
                  <img 
                    src={msg.imageUrl} 
                    alt="附加圖片預覽" 
                    style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '8px', marginBottom: '8px', display: 'block' }} 
                  />
                )}
                {msg.role === 'user' ? (
                  <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.content}</p>
                ) : (
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                  >
                    {msg.content}
                  </ReactMarkdown>
                )}
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

        <div className={styles.inputContainer}>
          {/* 任務 B：當日已達 5 次上限時顯示友善提示條 */}
          {isLimitReached && (
            <div className={styles.limitNoticeBanner}>
              <span>🚫 今日發問額度已用盡（5/5 次），請明日再來！</span>
            </div>
          )}

          {/* 任務 A：圖片預覽區塊 */}
          {imageUrl && (
            <div className={styles.imagePreviewArea}>
              <img src={imageUrl} alt="附件預覽" className={styles.previewImg} />
              <div>
                <p>已選擇圖片 (Base64)</p>
              </div>
              <button 
                className={styles.removeImageBtn} 
                onClick={() => { setImageUrl(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                title="移除圖片"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className={styles.inputWrapper}>
            <input 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              disabled={isLoading || isLimitReached}
            />
            <button 
              className={styles.attachBtn} 
              onClick={() => fileInputRef.current?.click()} 
              title={isLimitReached ? "發問額度已用盡" : "上傳圖片 (Base64)"}
              disabled={isLoading || isLimitReached}
            >
              <Paperclip size={20} />
            </button>
            <input 
              type="text" 
              placeholder={isLimitReached ? "今日發問額度已用盡，請明日再來！" : "向 AI 導師提問..."} 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || isLimitReached}
            />
            <button 
              className={styles.sendBtn} 
              onClick={handleSendMessage}
              disabled={isLoading || (!inputValue.trim() && !imageUrl) || isLimitReached}
              style={{ opacity: (isLoading || (!inputValue.trim() && !imageUrl) || isLimitReached) ? 0.5 : 1 }}
              title={isLimitReached ? "今日發問額度已用盡" : "發送訊息"}
            >
              <Send size={18} />
            </button>
          </div>

          <div className={styles.inputFooter}>
            <span>ℹ AI 會自動在中央知識庫中尋找解答。</span>
            <span style={{ color: isLimitReached ? '#ef4444' : 'inherit', fontWeight: isLimitReached ? 'bold' : 'normal' }}>
              {isLimitReached ? '今日發問額度已用盡 (0 / 5)' : `今日剩餘提問額度: ${remainingCount} / 5`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AILearning;
