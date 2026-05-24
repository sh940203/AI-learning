import React, { useState } from 'react';
import { Circle, Check, Bot, ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react';
import styles from './TaskTimeline.module.css';

const splitTitle = (title, defaultLabel) => {
  if (!title) return { header: defaultLabel, title: '' };
  const separators = ['：', ':'];
  for (const sep of separators) {
    if (title.includes(sep)) {
      const parts = title.split(sep);
      return {
        header: parts[0].trim(),
        title: parts.slice(1).join(sep).trim()
      };
    }
  }
  // 如果沒有輸入冒號，直接將標題設定為主標頭，並將分類名稱顯示在複選框旁邊111111
  return { header: title, title: defaultLabel };
};

const TaskTimeline = ({ events, setEvents }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [aiOutline, setAiOutline] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const toggleTask = (id) => {
    setEvents(events.map(event =>
      event.id === id ? { ...event, completed: !event.completed } : event
    ));
  };

  const getCountdownLabel = (eventDateStr, eventTimeStr) => {
    const today = new Date(); // 基準系統時間
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(eventDateStr);
    eventDate.setHours(0, 0, 0, 0);

    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return eventTimeStr ? `今天 ${eventTimeStr}` : '今天';
    } else if (diffDays === 1) {
      return eventTimeStr ? `明天 ${eventTimeStr}` : '明天';
    } else if (diffDays === -1) {
      return '昨天';
    } else if (diffDays < -1) {
      return `${Math.abs(diffDays)} 天前`;
    } else {
      return `${diffDays} 天後`;
    }
  };

  const sortedEvents = [...events]
    .filter(e => !e.completed) // 只展示未完成任務
    .sort((a, b) => {
      const dateA = new Date(a.date + (a.time ? `T${a.time}` : ''));
      const dateB = new Date(b.date + (b.time ? `T${b.time}` : ''));
      return dateA - dateB;
    });

  const displayedEvents = isExpanded ? sortedEvents : sortedEvents.slice(0, 3);

  const triggerAiAssistant = async (event) => {
    const title = event.title;
    setAiLoading(true);
    setAiOutline({
      title: title,
      guide: ["🤖 AI 智慧小助手正在為您量身打造複習重點，請稍候..."]
    });

    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: event.title,
          notes: event.notes
        })
      });

      const data = await response.json();

      if (data && data.success && data.guide) {
        setAiOutline({
          title: title,
          guide: data.guide
        });
      } else {
        throw new Error("Failed to generate suggestion");
      }
    } catch (error) {
      console.warn("⚠️ Failed to fetch AI suggestion, falling back to local simulation.", error);
      let guide = [];
      if (title.includes('計算機概論')) {
        guide = [
          "🔍 本次專案考核重點為資料結構演算法之「時間與空間複雜度分析」。",
          "📂 請確保您的 PDF 報告中附帶了 Big-O 的理論推導與執行時間圖表對照。",
          "💡 檢查程式碼：記憶體配置與洩漏（Memory Leak）檢驗，變數命名是否符合規範。"
        ];
      } else if (title.includes('深度學習')) {
        guide = [
          "🧠 核心觀念提示：深入理解 CNN 卷積層（特徵提取）與池化層（降維）的運作機制。",
          "⚖️ 常見考點：梯度消失（Vanishing Gradient）的解決方案，諸如引入 ReLU 激活函數與殘差連接。",
          "📝 自我評測：試著在紙上不看書推導一次 Backpropagation 反向傳播鏈鎖法則。"
        ];
      } else if (title.includes('資料結構') || title.includes('演算法')) {
        guide = [
          "🌲 重點複習：紅黑樹（Red-Black Tree）的五大核心性質（紅色節點其子必為黑、根為黑、任一路徑黑高度相同等）。",
          "🔄 必考實作：熟練掌握 LL、RR、LR、RL 四大旋轉操作（Rotation）。",
          "⚖️ 對比分析：紅黑樹相較於 AVL 樹，在頻繁插入與刪除場景下的效能優勢（旋轉次數更少）。"
        ];
      } else {
        guide = [
          "💡 AI 小建議：將複雜的任務切割成 20 分鐘的番茄鐘區間進行高專注力研讀。",
          "🤖 AI 重點複習：利用『費曼學習法』嘗試在心中對自己解釋一次這個主題，可以迅速揪出觀念盲區。",
          "🧪 實戰大師：自己設計一至兩個範例，動手實作寫出來，遠比光讀書吸收快 3 倍！"
        ];
      }
      setAiOutline({ title, guide });
    } finally {
      setAiLoading(false);
    }
  };

  const getPriorityInfo = (type) => {
    switch (type) {
      case 'red': return { label: '考試/截止', color: '#ef4444', class: styles.priorityHigh };
      case 'blue': return { label: '學術課程', color: '#3b82f6', class: styles.priorityMedium };
      case 'green': return { label: '課外活動', color: '#22c55e', class: styles.priorityLow };
      case 'orange': return { label: '個人待辦', color: '#f97316', class: styles.priorityLow };
      default: return { label: '普通任務', color: '#6b7280', class: styles.priorityLow };
    }
  };

  if (sortedEvents.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🎉</div>
        <p>目前沒有即將到期的任務，真棒！</p>
        <button className={styles.viewAllBtn} onClick={() => setEvents(events.map(ev => ({ ...ev, completed: false })))}>
          還原所有任務 (進行測試)
        </button>
      </div>
    );
  }

  return (
    <div className={styles.timeline} style={{ position: 'relative' }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        maxHeight: isExpanded ? '1000px' : '450px',
        overflow: 'hidden',
        transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {displayedEvents.map((task) => {
          const prio = getPriorityInfo(task.type);
          const parsed = splitTitle(task.title, prio.label);
          return (
            <div
              key={task.id}
              className={`${styles.taskItem} ${task.completed ? styles.taskCompleted : ''}`}
              style={{
                borderLeft: `3px solid ${prio.color}`,
                backgroundColor: 'rgba(255,255,255,0.02)',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '8px',
                transition: 'all 0.3s ease',
                display: 'flex',
                gap: '12px',
                position: 'relative'
              }}
            >
              <div className={styles.taskIcon} style={{ marginTop: '2px' }}>
                <Circle
                  size={16}
                  strokeWidth={3}
                  style={{ color: prio.color }}
                />
              </div>

              <div className={styles.taskContent} style={{ flex: 1 }}>
                <div className={styles.taskHeader} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <h4
                    className={prio.class}
                    style={{ fontSize: '11px', fontWeight: 'bold', margin: 0 }}
                  >
                    {parsed.header}
                  </h4>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '500' }}>
                    {getCountdownLabel(task.date, task.time)}
                  </span>
                </div>

                <div className={styles.titleRow} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <button
                    className={`${styles.checkboxBtn} ${task.completed ? styles.checked : ''}`}
                    onClick={() => toggleTask(task.id)}
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: '1px solid #555555',
                      backgroundColor: task.completed ? '#0078d4' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    {task.completed && <Check size={10} strokeWidth={4} color="white" />}
                  </button>
                  <p className={styles.taskTitle} style={{ fontSize: '13px', fontWeight: '600', margin: 0, color: '#ffffff' }}>
                    {parsed.title}
                  </p>
                </div>

                {task.notes && (
                  <p className={styles.taskDesc} style={{ fontSize: '12px', margin: '4px 0 0 0', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                    {task.notes}
                  </p>
                )}

                {(task.type === 'red' || task.type === 'blue') && (
                  <button
                    onClick={() => triggerAiAssistant(task)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '8px',
                      backgroundColor: 'rgba(168, 85, 247, 0.1)',
                      border: '1px dashed rgba(168, 85, 247, 0.4)',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      color: '#d8b4fe',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.1)';
                    }}
                  >
                    <Sparkles size={11} />
                    <span>AI 智慧學習小助手</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {sortedEvents.length > 3 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '6px',
            padding: '8px',
            color: '#a0a0a0',
            fontSize: '12px',
            cursor: 'pointer',
            marginTop: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'}
        >
          {isExpanded ? (
            <>
              <span>收合任務</span>
              <ChevronUp size={14} />
            </>
          ) : (
            <>
              <span>顯示更多 ({sortedEvents.length - 3} 個待辦項目)</span>
              <ChevronDown size={14} />
            </>
          )}
        </button>
      )}

      {aiOutline && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            width: '90%',
            maxWidth: '420px',
            backgroundColor: '#1e1e1e',
            borderRadius: '12px',
            border: '1px solid rgba(168, 85, 247, 0.6)',
            boxShadow: '0 12px 40px rgba(168, 85, 247, 0.25)',
            padding: '20px',
            position: 'relative'
          }}>
            <button
              onClick={() => setAiOutline(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
                border: 'none',
                color: '#a0a0a0',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Bot size={24} color="#a855f7" />
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>
                AI 智慧考前/學習大綱
              </h3>
            </div>
            <h4 style={{ fontSize: '13px', color: '#d8b4fe', margin: '0 0 16px 0', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
              標題：{aiOutline.title}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {aiOutline.guide.map((point, index) => (
                <div key={index} style={{ fontSize: '12px', color: '#e0e0e0', lineHeight: '1.5', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span>👉</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setAiOutline(null)}
              style={{
                width: '100%',
                backgroundColor: '#a855f7',
                border: 'none',
                borderRadius: '6px',
                padding: '8px',
                color: '#white',
                fontWeight: '600',
                fontSize: '12px',
                cursor: 'pointer',
                marginTop: '20px',
                boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)'
              }}
            >
              關閉 AI 大綱
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTimeline;
