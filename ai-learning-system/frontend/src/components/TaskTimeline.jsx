import React, { useState } from 'react';
import { Circle, CheckCircle2, Link as LinkIcon, Check } from 'lucide-react';
import styles from './TaskTimeline.module.css';

const initialTasks = [
  {
    id: 1,
    priority: 'high',
    title: '計算機概論：期中專案繳交',
    time: '剩餘 2 小時',
    desc: '請確保所有的程式碼註釋完整並符合格式規範。',
    link: '專案雲端連結',
    completed: false
  },
  {
    id: 2,
    priority: 'medium',
    title: 'AI 自主學習：深度學習模組',
    time: '明天 18:00',
    desc: '完成第三單元的自我評測練習題。',
    completed: false
  },
  {
    id: 3,
    priority: 'low',
    title: '通識英語：單字複習',
    time: '5月28日',
    desc: '利用系統生成的單字卡進行 15 分鐘複習。',
    completed: false
  }
];

const TaskTimeline = () => {
  const [tasks, setTasks] = useState(initialTasks);

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  if (tasks.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🎉</div>
        <p>目前沒有任務，開始你的第一堂課吧！</p>
        <button className={styles.startBtn}>探索課程</button>
      </div>
    );
  }

  return (
    <div className={styles.timeline}>
      {tasks.map((task) => (
        <div key={task.id} className={`${styles.taskItem} ${task.completed ? styles.taskCompleted : ''}`}>
          <div className={styles.taskIcon}>
            {task.priority === 'high' && <Circle size={20} strokeWidth={3} className={styles.priorityHigh} />}
            {task.priority === 'medium' && <Circle size={20} strokeWidth={3} className={styles.priorityMedium} />}
            {task.priority === 'low' && <CheckCircle2 size={20} strokeWidth={2} className={styles.priorityLow} />}
          </div>
          <div className={styles.taskContent}>
            <div className={styles.taskHeader}>
              <h4 className={
                task.priority === 'high' ? styles.priorityHigh :
                task.priority === 'medium' ? styles.priorityMedium : styles.priorityLow
              }>
                {task.priority === 'high' ? '高優先級' : task.priority === 'medium' ? '中優先級' : '低優先級'}
              </h4>
              <span>{task.time}</span>
            </div>
            <div className={styles.titleRow}>
              <button 
                className={`${styles.checkboxBtn} ${task.completed ? styles.checked : ''}`}
                onClick={() => toggleTask(task.id)}
              >
                {task.completed && <Check size={12} strokeWidth={4} color="white" />}
              </button>
              <p className={styles.taskTitle}>{task.title}</p>
            </div>
            <p className={styles.taskDesc}>{task.desc}</p>
            {task.link && (
              <a href="#" className={styles.taskLink}>
                <LinkIcon size={12} /> {task.link}
              </a>
            )}
          </div>
        </div>
      ))}
      <button className={styles.viewAllBtn} onClick={() => setTasks([])}>
        清除所有任務 (測試 Empty State)
      </button>
    </div>
  );
};

export default TaskTimeline;
