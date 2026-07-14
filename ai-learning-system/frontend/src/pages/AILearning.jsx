import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, RefreshCw, Loader2, MessageSquare, Plus, X } from 'lucide-react';
import styles from './AILearning.module.css';

const generateDeviceId = () => {
  return 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
};

const AILearning = () => {
  const [deviceId, setDeviceId] = useState('');
  const [remainingCount, setRemainingCount] = useState(5);
  
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

  useEffect(() => {
    // 1. Setup Device ID
    let storedDeviceId = localStorage.getItem('ai_device_id');
    if (!storedDeviceId) {
      storedDeviceId = generateDeviceId();
      localStorage.setItem('ai_device_id', storedDeviceId);
    }
    setDeviceId(storedDeviceId);

    // 2. Setup Limits
    const todayStr = new Date().toDateString();
    const storedDate = localStorage.getItem('ai_usage_date');
    if (storedDate !== todayStr) {
      localStorage.setItem('ai_usage_date', todayStr);
      localStorage.setItem('ai_usage_count', '0');
      setRemainingCount(5);
    } else {
      const count = parseInt(localStorage.getItem('ai_usage_count') || '0', 10);
      setRemainingCount(Math.max(0, 5 - count));
    }
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
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('目前僅支援圖片！');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
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
          'X-Device-Id': deviceId
        },
        body: JSON.stringify({
          sessionId: activeSessionId,
          history: messages.filter(m => !m.content.includes('你好！我是一位專屬商科')),
          message: userMessage,
          imageUrl: imageUrl
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessages([...newMessages, { role: 'model', content: data.reply }]);
        
        const currentCount = parseInt(localStorage.getItem('ai_usage_count') || '0', 10);
        localStorage.setItem('ai_usage_count', (currentCount + 1).toString());
        setRemainingCount(Math.max(0, 5 - (currentCount + 1)));

        if (data.sessionId && !activeSessionId) {
          setActiveSessionId(data.sessionId);
          fetchSessions();
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
                <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.content}</p>
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
          {imageUrl && (
            <div className={styles.imagePreviewArea}>
              <img src={imageUrl} alt="附件" className={styles.previewImg} />
              <div>
                <p>已附加圖片</p>
              </div>
              <button className={styles.removeImageBtn} onClick={() => setImageUrl('')}>
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
            />
            <button className={styles.attachBtn} onClick={() => fileInputRef.current?.click()} title="上傳圖片">
              <Paperclip size={20} />
            </button>
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
            <span>ℹ AI 會自動在中央知識庫中尋找解答。</span>
            <span style={{ color: remainingCount <= 0 ? '#ef4444' : 'inherit', fontWeight: remainingCount <= 0 ? 'bold' : 'normal' }}>
              今日剩餘提問額度: {remainingCount} / 5
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AILearning;
