import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Upload, Bold, Italic, Underline, Palette, Type, ListOrdered, List, Code, Sigma, FileAudio, Superscript as SupIcon, Subscript as SubIcon, Image as ImageIcon, Eraser, CircleDot, CheckSquare, ToggleLeft, Edit3, Layers, Smartphone, Tablet, Monitor, Eye, Check, X, Copy, ClipboardPaste, Undo as UndoIcon, Redo as RedoIcon, AlignLeft, Headphones, Star } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline as TiptapUnderline } from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Superscript } from '@tiptap/extension-superscript';
import { Subscript } from '@tiptap/extension-subscript';
import { ResizableImage } from 'tiptap-extension-resizable-image';
import { Extension, Node } from '@tiptap/core';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import styles from './QuestionBank.module.css';
import MathEditorModal from '../../components/MathEditorModal';
import ExamRenderCore from '../../components/ExamRenderCore';

const renderLatexInHtml = (html) => {
  if (!html) return '';
  return html.replace(/\$\$(.*?)\$\$/g, (match, p1) => {
    try {
      return katex.renderToString(p1, { throwOnError: false });
    } catch(e) {
      return match;
    }
  });
};

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] } },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run()
      },
    }
  },
});

const AudioExt = Node.create({
  name: 'audio',
  group: 'block',
  atom: true,
  addAttributes() { return { src: { default: null } } },
  parseHTML() { return [{ tag: 'audio' }] },
  renderHTML({ HTMLAttributes }) { 
    return ['audio', { ...HTMLAttributes, controls: 'true', style: 'width:100%;max-width:300px;display:block;margin:16px 0;' }] 
  },
  addCommands() {
    return {
      setAudio: options => ({ commands }) => {
        return commands.insertContent({ type: this.name, attrs: options })
      },
    }
  }
});

const colorMap = { red: '#ef4444', blue: '#3b82f6', green: '#22c55e', orange: '#f97316', purple: '#a855f7', gray: '#6b7280' };
const sizeMap = { xl: '1.5em', lg: '1.2em', base: '1em', sm: '0.85em', xs: '0.75em' };

const SubQuestionEditor = ({ sq, index, updateSubQuestion, removeSubQuestion, onOpenMath }) => {
  const [expanded, setExpanded] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit, TiptapUnderline, Color, TextStyle, Superscript, Subscript, ResizableImage, FontSize, AudioExt
    ],
    content: sq.html || '',
    onUpdate: ({ editor }) => {
      updateSubQuestion(sq.id, { html: editor.getHTML() });
    }
  });

  const handleTypeChange = (newType) => {
    let newOptions = [];
    if (newType === 'tf') newOptions = [{ id: 'O', text: '正確 (True)', isCorrect: true }, { id: 'X', text: '錯誤 (False)', isCorrect: false }];
    else if (newType === 'single' || newType === 'multiple') newOptions = [{ id: 'A', text: '選項 A', isCorrect: true }, { id: 'B', text: '選項 B', isCorrect: false }, { id: 'C', text: '選項 C', isCorrect: false }, { id: 'D', text: '選項 D', isCorrect: false }];
    else if (newType === 'fill') newOptions = [{ id: '1', text: '標準答案', isCorrect: true }];
    else if (newType === 'short') newOptions = [{ id: '1', text: '參考解答', isCorrect: true }];
    updateSubQuestion(sq.id, { type: newType, options: newOptions });
  };

  const handleOptionChange = (optId, newText) => {
    updateSubQuestion(sq.id, { options: sq.options.map(o => o.id === optId ? { ...o, text: newText } : o) });
  };

  const handleToggleCorrect = (optId) => {
    if (sq.type === 'single' || sq.type === 'tf' || sq.type === 'fill') updateSubQuestion(sq.id, { options: sq.options.map(o => ({ ...o, isCorrect: o.id === optId })) });
    else if (sq.type === 'multiple') updateSubQuestion(sq.id, { options: sq.options.map(o => o.id === optId ? { ...o, isCorrect: !o.isCorrect } : o) });
  };

  const handleExplanationChange = (text) => {
    updateSubQuestion(sq.id, { explanation: text });
  };

  return (
    <div className={styles.sqAccordionItem}>
      <div className={styles.sqAccordionHeader} onClick={() => setExpanded(!expanded)}>
        <span style={{ fontWeight: '600', color: 'var(--color-on-surface)' }}>子題 {index + 1} ({sq.type === 'single' ? '單選' : sq.type === 'multiple' ? '複選' : sq.type === 'tf' ? '是非' : '填空'})</span>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className={styles.toolBtn} onClick={(e) => { e.stopPropagation(); removeSubQuestion(sq.id); }} style={{ color: 'var(--color-error)' }}><X size={16} /></button>
          <span style={{ color: 'var(--color-outline)' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      
      {expanded && (
        <div className={styles.sqAccordionBody}>
          <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
            <div className={styles.typeSelector} style={{ display: 'flex', gap: '8px' }}>
              <button className={`${styles.typeBtn} ${sq.type === 'single' ? styles.active : ''}`} onClick={() => handleTypeChange('single')}>單選</button>
              <button className={`${styles.typeBtn} ${sq.type === 'multiple' ? styles.active : ''}`} onClick={() => handleTypeChange('multiple')}>複選</button>
              <button className={`${styles.typeBtn} ${sq.type === 'tf' ? styles.active : ''}`} onClick={() => handleTypeChange('tf')}>是非</button>
              <button className={`${styles.typeBtn} ${sq.type === 'fill' ? styles.active : ''}`} onClick={() => handleTypeChange('fill')}>填空</button>
              <button className={`${styles.typeBtn} ${sq.type === 'short' ? styles.active : ''}`} onClick={() => handleTypeChange('short')}>簡答</button>
            </div>
          </div>
          
          <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
            <label className={styles.label}>子題敘述 (支援富文本)</label>
            <div className={styles.richTextEditor} style={{ minHeight: '120px' }}>
              <div className={styles.toolbar} style={{ padding: '4px', borderBottom: '1px solid #ddd', display: 'flex', gap: '4px' }}>
                 <button className={styles.toolBtn} onClick={() => editor?.chain().focus().toggleBold().run()} title="加粗"><Bold size={14} /></button>
                 <button className={styles.toolBtn} onClick={() => editor?.chain().focus().toggleItalic().run()} title="斜體"><Italic size={14} /></button>
                 <button className={styles.toolBtn} onClick={() => onOpenMath(editor)} title="插入公式"><Sigma size={14} /></button>
              </div>
              <div className={styles.richTextEditorContainer} style={{ minHeight: '80px', padding: '12px' }}>
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              {(sq.type === 'fill' || sq.type === 'short') ? '文字答案設定' : '選項設定'}
            </label>
            <div className={styles.optionsList}>
              {sq.options.map((opt) => (
                <div key={opt.id} className={styles.optionRow}>
                  {sq.type !== 'fill' && sq.type !== 'short' && (
                    <div className={`${styles.optionLabel} ${opt.isCorrect ? styles.labelCorrect : ''}`}>{opt.id}</div>
                  )}
                  <input type="text" className={styles.optionInput} value={opt.text} onChange={(e) => handleOptionChange(opt.id, e.target.value)} placeholder={(sq.type === 'fill' || sq.type === 'short') ? '請輸入標準答案/參考解答...' : `輸入選項 ${opt.id} 內容...`} />
                  {sq.type !== 'fill' && sq.type !== 'short' && (
                    <button className={`${styles.checkBtn} ${opt.isCorrect ? styles.checked : ''}`} onClick={() => handleToggleCorrect(opt.id)}><Check size={16} /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {(sq.type === 'fill' || sq.type === 'short') && (
            <div className={styles.formGroup} style={{ marginTop: '16px' }}>
              <label className={styles.label}>字數限制 (選填，0 表示無限制)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="number" 
                  min="0" 
                  className={styles.optionInput} 
                  style={{ width: '120px' }}
                  value={sq.wordLimit || 0} 
                  onChange={(e) => updateSubQuestion(sq.id, { wordLimit: parseInt(e.target.value) || 0 })}
                />
                <span className={styles.muted}>字</span>
              </div>
            </div>
          )}

          <div className={styles.formGroup} style={{ marginTop: '16px' }}>
            <label className={styles.label}>標準答案補充 / 題目詳解 (選填)</label>
            <textarea 
              className={styles.optionInput} 
              style={{ minHeight: '60px', padding: '10px', resize: 'vertical' }}
              placeholder="可輸入此子題的標準答案補充說明、計算過程或詳解..."
              value={sq.explanation || ''}
              onChange={(e) => handleExplanationChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const QuestionBank = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 從 ExamSetup 傳過來的設定，如果沒有則使用預設值
  const [examConfig, setExamConfig] = useState(() => {
    const config = location.state?.examConfig || {
      name: '未命名考卷',
      subject: '未分類',
      timeLimit: 60,
      defaultScore: 2,
      scoringMode: 'standard'
    };
    
    // 如果從題庫管理列表傳來，ID 會是 _id
    if (config._id && !config.examId) {
      config.examId = config._id;
    }
    
    return config;
  });

  const [activeType, setActiveType] = useState('single');
  const [wordLimit, setWordLimit] = useState(0);
  const [qScore, setQScore] = useState(examConfig.defaultScore || 2);
  const [qDifficulty, setQDifficulty] = useState(3);
  const [qCategory, setQCategory] = useState('');
  const [qExplanation, setQExplanation] = useState('');
  
  const [questionHTML, setQuestionHTML] = useState('');
  const [showArticleDrawer, setShowArticleDrawer] = useState(false);
  const [subQuestions, setSubQuestions] = useState([
    { id: 1, type: 'single', score: 2, options: [{ id: 'A', text: '選項 A', isCorrect: true }, { id: 'B', text: '選項 B', isCorrect: false }, { id: 'C', text: '選項 C', isCorrect: false }, { id: 'D', text: '選項 D', isCorrect: false }], explanation: '' },
    { id: 2, type: 'fill', score: 2, options: [{ id: '1', text: '標準答案', isCorrect: true }], explanation: '' }
  ]);
  
  const [isMathModalOpen, setIsMathModalOpen] = useState(false);
  const [activeMathEditor, setActiveMathEditor] = useState(null);

  // 新增全卷預覽 Modal 狀態
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);

  // 考卷導覽列的狀態 (三欄式)
  const [examQuestions, setExamQuestions] = useState([]);
  const [activeQuestionId, setActiveQuestionId] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapUnderline,
      Color,
      TextStyle,
      Superscript,
      Subscript,
      ResizableImage,
      FontSize,
      AudioExt
    ],
    content: '<p>這是一道包含各種格式的題目：</p><p><strong>加粗文字</strong>，<em>斜體文字</em>，以及<u>底線文字</u>。</p><p><span style="color: #ef4444">這是紅色文字</span>，<span style="font-size: 1.2em">這是大號文字</span>。</p><p>X<sup>2</sup> + Y<sub>1</sub> = 0</p><img src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=400&auto=format&fit=crop" /><ol><li>有序列表 1</li><li>有序列表 2</li></ol>',
    onUpdate: ({ editor }) => {
      setQuestionHTML(editor.getHTML());
    }
  });

  // 讀取既有題目
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!examConfig.examId) return;
      try {
        const res = await fetch(`/api/questions?examId=${examConfig.examId}`);
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          // 將後端資料轉換為導覽列格式
          const formatted = data.data.map((q, idx) => ({
            id: q._id,
            label: `第 ${idx + 1} 題`,
            type: q.type,
            status: 'saved',
            data: q // 存放完整資料
          }));
          setExamQuestions(formatted);
          setActiveQuestionId(formatted[0].id);
        } else {
          // 如果沒題目，建立一個預設的第一題
          const firstId = Date.now();
          setExamQuestions([{ id: firstId, label: '第 1 題', type: 'single', status: 'draft' }]);
          setActiveQuestionId(firstId);
        }
      } catch (err) {
        console.error('載入題目失敗:', err);
      }
    };
    fetchQuestions();
  }, [examConfig.examId]);

  // 當切換題目時，載入該題資料
  useEffect(() => {
    if (!activeQuestionId) return;
    const q = examQuestions.find(item => item.id === activeQuestionId);
    
    if (q && q.status === 'saved' && q.data) {
      // 載入已存資料
      const d = q.data;
      setActiveType(d.type);
      setQuestionHTML(d.html || '');
      if (editor) editor.commands.setContent(d.html || '');
      setOptions(d.options || []);
      setQExplanation(d.explanation || '');
      setQScore(d.score || 2);
      setQDifficulty(d.difficulty || 3);
      setWordLimit(d.wordLimit || 0);
      setSubQuestions(d.subQuestions || []);
    } else {
      // 新題目，執行重置
      setQuestionHTML('');
      if (editor) editor.commands.setContent('');
      setQExplanation('');
      setQCategory('');
      setQScore(examConfig.defaultScore || 2);
      setQDifficulty(3);
      setWordLimit(0);
      setSubQuestions([]);
      if (q) handleTypeChange(q.type || 'single');
    }
  }, [activeQuestionId, editor]);

  const openMathModal = (editorInstance) => {
    setActiveMathEditor(editorInstance);
    setIsMathModalOpen(true);
  };

  // (已移除第二個 useEffect：修復切換題目時，資料庫載入的內容瞬間被清空的 Bug)

  // 設定初始值給右側預覽
  useEffect(() => {
    if (editor) {
      setQuestionHTML(editor.getHTML());
    }
  }, [editor]);
  
  const [options, setOptions] = useState([
    { id: 'A', text: '選項 A', isCorrect: true },
    { id: 'B', text: '選項 B', isCorrect: false },
    { id: 'C', text: '選項 C', isCorrect: false },
    { id: 'D', text: '選項 D', isCorrect: false }
  ]);

  const [previewMode, setPreviewMode] = useState('mobile'); 
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);

  // 程式碼視窗狀態
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [codeLang, setCodeLang] = useState('javascript');
  const [codeText, setCodeText] = useState('');

  // 可拖拉預覽區寬度與側欄狀態
  const [previewWidth, setPreviewWidth] = useState(400);
  const [isDragging, setIsDragging] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);

  useEffect(() => {
    if (previewMode === 'mobile') {
      setPreviewWidth(400);
      setIsNavCollapsed(false);
    } else if (previewMode === 'tablet') {
      setPreviewWidth(600);
    } else if (previewMode === 'desktop') {
      setPreviewWidth(840);
      setIsNavCollapsed(true);
    }
  }, [previewMode]);

  const handleDoubleClickResizer = () => {
     if (previewMode === 'mobile') {
       setPreviewWidth(400);
       setIsNavCollapsed(false);
     } else if (previewMode === 'tablet') {
       setPreviewWidth(600);
     } else if (previewMode === 'desktop') {
       setPreviewWidth(840);
       setIsNavCollapsed(true);
     }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      // 計算側欄寬度（全域 sidebar 260px + gap）
      const sidebarWidth = 260;
      const navWidth = isNavCollapsed ? 80 : 240;
      const gaps = 80; // grid gaps + resizer + padding
      const minEditorWidth = 480; // 編輯器最小寬度保護
      
      const availableWidth = document.body.clientWidth - sidebarWidth;
      const newWidth = availableWidth - (e.clientX - sidebarWidth);
      let finalWidth = newWidth;
      
      // 磁吸效應 (Snapping)
      if (Math.abs(newWidth - 400) < 30) finalWidth = 400;
      else if (Math.abs(newWidth - 600) < 30) finalWidth = 600;
      else if (Math.abs(newWidth - 840) < 30) finalWidth = 840;
      
      // 剛性保護限制
      if (finalWidth < 320) finalWidth = 320;
      const maxAllowedWidth = availableWidth - navWidth - gaps - minEditorWidth;
      if (finalWidth > maxAllowedWidth) finalWidth = maxAllowedWidth;
      
      // 動態聯動收合導覽列
      if (finalWidth > 650 && !isNavCollapsed) {
          setIsNavCollapsed(true);
      } else if (finalWidth <= 500 && isNavCollapsed && previewMode === 'mobile') {
          setIsNavCollapsed(false);
      }
      
      setPreviewWidth(finalWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isDragging, isNavCollapsed]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);

  const handleTypeChange = useCallback((type) => {
    setActiveType(type);
    if (type === 'tf') setOptions([{ id: 'O', text: '正確 (True)', isCorrect: true }, { id: 'X', text: '錯誤 (False)', isCorrect: false }]);
    else if (type === 'single' || type === 'multiple') setOptions([{ id: 'A', text: '選項 A', isCorrect: true }, { id: 'B', text: '選項 B', isCorrect: false }, { id: 'C', text: '選項 C', isCorrect: false }, { id: 'D', text: '選項 D', isCorrect: false }]);
    else if (type === 'fill') setOptions([{ id: '1', text: '標準答案', isCorrect: true }]);
    else if (type === 'short') setOptions([{ id: '1', text: '參考解答', isCorrect: true }]);
    else setOptions([]); 
  }, []);

  const handleToggleCorrect = (id) => {
    if (activeType === 'single' || activeType === 'tf') setOptions(options.map(opt => ({ ...opt, isCorrect: opt.id === id })));
    else if (activeType === 'multiple') setOptions(options.map(opt => opt.id === id ? { ...opt, isCorrect: !opt.isCorrect } : opt));
  };

  const handleOptionTextChange = (id, newText) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, text: newText } : opt));
  };

  const handleMediaUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file || !editor) return;

    if (type === 'image') {
      try {
        const formData = new FormData();
        formData.append('image', file);
        
        const res = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        
        if (data.success) {
          editor.chain().focus().setResizableImage({ src: data.url }).run();
        } else {
          alert('圖片上傳失敗：' + data.message);
        }
      } catch (err) {
        console.error('Upload error:', err);
        alert('無法連線至上傳伺服器');
      }
    } else if (type === 'audio') {
      const url = URL.createObjectURL(file);
      editor.chain().focus().setAudio({ src: url }).run();
    }
    e.target.value = '';
  };

  const confirmCodeInsert = () => {
    if (editor) {
      editor.chain().focus().insertContent(`<pre><code class="language-${codeLang}">${codeText}</code></pre>`).run();
    }
    setIsCodeModalOpen(false);
    setCodeText('');
  };

  const renderPreviewOptions = (qType, qOptions, qWordLimit = 0) => {
    if (qType === 'fill') {
      return (
        <div className={styles.previewInputContainer}>
          <input type="text" className={styles.previewInput} placeholder={`請在空格內輸入答案...`} disabled maxLength={qWordLimit > 0 ? qWordLimit : undefined} />
          {qWordLimit > 0 && <div className={styles.wordLimitText}>0 / {qWordLimit} 字</div>}
        </div>
      );
    }
    if (qType === 'short') {
      return (
        <div className={styles.previewInputContainer}>
          <textarea className={styles.previewTextarea} placeholder="請輸入簡答內容..." disabled rows={4} maxLength={qWordLimit > 0 ? qWordLimit : undefined}></textarea>
          {qWordLimit > 0 && <div className={styles.wordLimitText}>0 / {qWordLimit} 字</div>}
        </div>
      );
    }
    return (
      <div className={styles.qOptionsPreview}>
        {qOptions.map((opt) => (
          <div key={opt.id} className={`${styles.previewOption} ${opt.isCorrect ? styles.previewOptionActive : ''}`}>
            <div className={`${styles.previewOptionLetter} ${opt.isCorrect ? styles.previewOptionLetterActive : ''}`}>{opt.id}</div>
            <span>{opt.text || '選項內容...'}</span>
          </div>
        ))}
      </div>
    );
  };

  const handleSaveQuestion = async () => {
    try {
      const payload = {
        type: activeType,
        html: questionHTML,
        options: activeType !== 'group' ? options : [],
        wordLimit: (activeType === 'fill' || activeType === 'short') ? wordLimit : 0,
        subQuestions: activeType === 'group' ? subQuestions : [],
        explanation: qExplanation,
        score: examConfig.defaultScore || 2,
        examId: examConfig.examId || null,
        status: 'draft'
      };

      const activeQ = examQuestions.find(q => q.id === activeQuestionId);
      const isExisting = activeQ?.status === 'saved' && activeQ?.data?._id;
      
      const res = await fetch(isExisting ? `/api/questions/${activeQ.data._id}` : '/api/questions', {
        method: isExisting ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert('🎉 題目儲存成功！');
        // 更新本地導覽列狀態
        setExamQuestions(prev => prev.map(q => 
          q.id === activeQuestionId 
            ? { ...q, status: 'saved', data: data.data } 
            : q
        ));
      } else {
        alert('儲存失敗：' + data.message);
      }
    } catch (error) {
      console.error('儲存錯誤:', error);
      alert('儲存失敗：' + error.message + '\n請確認後端已啟動。');
    }
  };

  const handlePublishExam = () => {
    if (!examConfig.examId) return;
    setIsPublishConfirmOpen(true);
  };

  const confirmPublishExam = async () => {
    try {
      const res = await fetch(`/api/exams/${examConfig.examId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' })
      });
      const data = await res.json();
      if (data.success) {
        alert('🎉 考卷已成功發布！');
        navigate('/admin/questions');
      } else {
        alert('發布失敗：' + data.message);
      }
    } catch (err) {
      console.error(err);
      alert('發生網路錯誤，發布失敗。');
    }
    setIsPublishConfirmOpen(false);
  };

  const flattenedQuestions = examQuestions.map(q => ({ ...q, ...(q.data || {}) }));

  const realtimeQuestions = examQuestions.map(q => {
    if (q.id === activeQuestionId) {
      return {
        ...q,
        _id: q.data?._id || q.id,
        type: activeType,
        html: questionHTML,
        options: activeType !== 'group' ? options : [],
        subQuestions: activeType === 'group' ? subQuestions : [],
        score: qScore || examConfig.defaultScore || 2,
        explanation: qExplanation,
        wordLimit: (activeType === 'fill' || activeType === 'short') ? wordLimit : 0,
      };
    }
    const base = { ...q, ...(q.data || {}) };
    return {
      ...base,
      _id: base._id || base.id,
      options: base.options || [],
      subQuestions: base.subQuestions || [],
      html: base.html || '',
      type: base.type || 'single',
      score: base.score || examConfig.defaultScore || 2
    };
  });

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.breadcrumbRow}>
        <div className={styles.breadcrumb}>
          <button className={styles.breadcrumbBtn} onClick={() => navigate('/admin/questions')}>題庫管理</button>
          <span className={styles.separator}>&gt;</span>
          <button 
            className={styles.breadcrumbBtn} 
            onClick={() => navigate('/admin/questions/exam/new', { state: { examConfig } })}
          >
            考卷基本設定
          </button>
          <span className={styles.separator}>&gt;</span>
          <span className={styles.active}>{examConfig.title || '進階編輯器'}</span>
        </div>
      </div>

      <div 
        className={styles.mainGrid}
        style={{ gridTemplateColumns: `${isNavCollapsed ? '80px' : '240px'} 1fr 16px ${previewWidth}px` }}
      >
        {/* Left Column: Navigator */}
        <div className={`${styles.navigatorSection} ${isNavCollapsed ? styles.collapsedNav : ''}`}>
          <div className={styles.navHeader}>
            {!isNavCollapsed && <span>考卷結構</span>}
            <span className={styles.navCount}>{isNavCollapsed ? examQuestions.length : `共 ${examQuestions.length} 題`}</span>
          </div>
          
          <div className={styles.navList}>
            {examQuestions.map((q, idx) => (
              <div 
                key={q.id} 
                className={`${styles.navItem} ${activeQuestionId === q.id ? styles.active : ''}`}
                onClick={() => setActiveQuestionId(q.id)}
                title={q.label}
              >
                {isNavCollapsed ? (
                  <span className={styles.navNumBadge}>{idx + 1}</span>
                ) : (
                  <span>{q.label}</span>
                )}
                <div className={`${styles.statusDot} ${q.status === 'draft' ? styles.statusDraft : styles.statusSaved}`} title={q.status === 'draft' ? '草稿' : '已儲存'} />
              </div>
            ))}
            
            <button className={styles.addQuestionBtn} onClick={() => {
              const newId = Date.now();
              setExamQuestions([...examQuestions, { id: newId, label: `第 ${examQuestions.length + 1} 題`, type: 'single', status: 'draft' }]);
              setActiveQuestionId(newId);
            }} title="新增下一題">
              {isNavCollapsed ? '+' : '+ 新增下一題'}
            </button>
          </div>
          
          <div className={styles.navFooter}>
            <button className={styles.previewAllBtn} title="預覽全卷" onClick={() => setIsPreviewModalOpen(true)}>
              {isNavCollapsed ? <Eye size={18} /> : '預覽全卷'}
            </button>
            <button className={styles.publishBtn} title="確認無誤，正式發布" onClick={handlePublishExam}>
              {isNavCollapsed ? <Upload size={18} /> : '確認無誤，正式發布'}
            </button>
          </div>
        </div>

        {/* Middle Column: Editor */}
        <div className={styles.editorSection}>
          <div className={styles.editorHeader}>
            <h2 className={styles.sectionTitle}>編輯題目 ({examQuestions.find(q => q.id === activeQuestionId)?.label})</h2>
            <button className={styles.outlineBtn} onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> 從 Excel 匯入
            </button>
            <input type="file" accept=".xlsx, .xls" ref={fileInputRef} style={{ display: 'none' }} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>選擇題型</label>
            <div className={styles.typeSelector}>
              <button className={`${styles.typeBtn} ${activeType === 'single' ? styles.active : ''}`} onClick={() => handleTypeChange('single')}><CircleDot size={20} /> 單選題</button>
              <button className={`${styles.typeBtn} ${activeType === 'multiple' ? styles.active : ''}`} onClick={() => handleTypeChange('multiple')}><CheckSquare size={20} /> 複選題</button>
              <button className={`${styles.typeBtn} ${activeType === 'tf' ? styles.active : ''}`} onClick={() => handleTypeChange('tf')}><ToggleLeft size={20} /> 是非題</button>
              <button className={`${styles.typeBtn} ${activeType === 'fill' ? styles.active : ''}`} onClick={() => handleTypeChange('fill')}><Edit3 size={20} /> 填空題</button>
              <button className={`${styles.typeBtn} ${activeType === 'short' ? styles.active : ''}`} onClick={() => handleTypeChange('short')}><AlignLeft size={20} /> 簡答題</button>
              <button className={`${styles.typeBtn} ${activeType === 'group' ? styles.active : ''}`} onClick={() => handleTypeChange('group')}><Layers size={20} /> 題組</button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>題目敘述</label>
            <div className={styles.richTextEditor}>
              {/* Toolbar */}
              <div className={styles.toolbar} style={{ flexWrap: 'wrap' }}>
                <button className={styles.toolBtn} onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can()?.undo()} style={{ opacity: !editor?.can()?.undo() ? 0.3 : 1 }} title="復原 (Ctrl+Z)"><UndoIcon size={16} /></button>
                <button className={styles.toolBtn} onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can()?.redo()} style={{ opacity: !editor?.can()?.redo() ? 0.3 : 1 }} title="重做 (Ctrl+Y)"><RedoIcon size={16} /></button>
                {/* Copy/Paste is native, but buttons use document api */}
                <button className={styles.toolBtn} onClick={() => document.execCommand('copy')} title="複製 (Ctrl+C)"><Copy size={16} /></button>
                <button className={styles.toolBtn} onClick={() => document.execCommand('paste')} title="貼上 (Ctrl+V)"><ClipboardPaste size={16} /></button>
                <button className={styles.toolBtn} onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()} title="清除格式"><Eraser size={16} /></button>
                <div className={styles.divider}></div>
                
                <button className={`${styles.toolBtn} ${editor?.isActive('bold') ? styles.activeTool : ''}`} onClick={() => editor?.chain().focus().toggleBold().run()} title="加粗 (Ctrl+B)"><Bold size={16} /></button>
                <button className={`${styles.toolBtn} ${editor?.isActive('italic') ? styles.activeTool : ''}`} onClick={() => editor?.chain().focus().toggleItalic().run()} title="斜體 (Ctrl+I)"><Italic size={16} /></button>
                <button className={`${styles.toolBtn} ${editor?.isActive('underline') ? styles.activeTool : ''}`} onClick={() => editor?.chain().focus().toggleUnderline().run()} title="底線 (Ctrl+U)"><Underline size={16} /></button>
                
                <button className={`${styles.toolBtn} ${editor?.isActive('subscript') ? styles.activeTool : ''}`} onClick={() => editor?.chain().focus().toggleSubscript().run()} title="下標"><SubIcon size={16} /></button>
                <button className={`${styles.toolBtn} ${editor?.isActive('superscript') ? styles.activeTool : ''}`} onClick={() => editor?.chain().focus().toggleSuperscript().run()} title="上標"><SupIcon size={16} /></button>
                <div className={styles.divider}></div>

                <div className={styles.toolDropdown}>
                  <button className={styles.toolBtn} onClick={() => setShowColorMenu(!showColorMenu)} title="文字顏色"><Palette size={16} /></button>
                  {showColorMenu && (
                    <div className={styles.dropdownMenu}>
                      {Object.keys(colorMap).map(color => (
                        <div key={color} className={styles.dropdownItem} onClick={() => { editor?.chain().focus().setColor(colorMap[color]).run(); setShowColorMenu(false); }}>
                          <span style={{color: colorMap[color], fontWeight: 'bold'}}>{color}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.toolDropdown}>
                  <button className={styles.toolBtn} onClick={() => setShowSizeMenu(!showSizeMenu)} title="字體大小"><Type size={16} /></button>
                  {showSizeMenu && (
                    <div className={styles.dropdownMenu}>
                      {['xl', 'lg', 'base', 'sm', 'xs'].map(size => (
                        <div key={size} className={styles.dropdownItem} onClick={() => { editor?.chain().focus().setFontSize(sizeMap[size]).run(); setShowSizeMenu(false); }}>
                          {size === 'xl' ? '超大' : size === 'lg' ? '大號' : size === 'base' ? '正常' : size === 'sm' ? '小號' : '超小'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.divider}></div>

                <button className={`${styles.toolBtn} ${editor?.isActive('orderedList') ? styles.activeTool : ''}`} onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="有序列表"><ListOrdered size={16} /></button>
                <button className={`${styles.toolBtn} ${editor?.isActive('bulletList') ? styles.activeTool : ''}`} onClick={() => editor?.chain().focus().toggleBulletList().run()} title="無序列表"><List size={16} /></button>
                <div className={styles.divider}></div>

                <button className={`${styles.toolBtn} ${editor?.isActive('codeBlock') ? styles.activeTool : ''}`} onClick={() => setIsCodeModalOpen(true)} title="插入程式碼"><Code size={16} /></button>
                <button className={styles.toolBtn} onClick={() => imageInputRef.current?.click()} title="插入圖片"><ImageIcon size={16} /></button>
                <input type="file" accept="image/*" ref={imageInputRef} style={{display:'none'}} onChange={(e) => handleMediaUpload(e, 'image')} />
                
                <button className={styles.toolBtn} onClick={() => openMathModal(editor)} title="插入公式"><Sigma size={16} /></button>
              </div>

              {/* Tiptap Editor Context */}
              <div className={styles.richTextEditorContainer}>
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>

          {(activeType === 'single' || activeType === 'multiple' || activeType === 'tf' || activeType === 'fill' || activeType === 'short') && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                {(activeType === 'fill' || activeType === 'short') ? '文字答案設定' : '選項設定'} 
                {activeType === 'multiple' && <span style={{fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 'normal'}}>(可複選)</span>}
              </label>
              <div className={styles.optionsList}>
                {options.map((opt) => (
                  <div key={opt.id} className={styles.optionRow}>
                    {activeType !== 'fill' && activeType !== 'short' && (
                      <div className={`${styles.optionLabel} ${opt.isCorrect ? styles.labelCorrect : ''}`}>{opt.id}</div>
                    )}
                    <input type="text" className={styles.optionInput} value={opt.text} onChange={(e) => handleOptionTextChange(opt.id, e.target.value)} placeholder={(activeType === 'fill' || activeType === 'short') ? '請輸入標準答案/參考解答...' : `輸入選項 ${opt.id} 內容...`} />
                    {activeType !== 'fill' && activeType !== 'short' && (
                      <button className={`${styles.checkBtn} ${opt.isCorrect ? styles.checked : ''}`} onClick={() => handleToggleCorrect(opt.id)}><Check size={16} /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeType === 'fill' || activeType === 'short') && (
            <div className={styles.formGroup} style={{ marginTop: '24px' }}>
              <label className={styles.label}>字數限制 (選填，0 表示無限制)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="number" 
                  min="0" 
                  className={styles.optionInput} 
                  style={{ width: '120px' }}
                  value={wordLimit} 
                  onChange={(e) => setWordLimit(parseInt(e.target.value) || 0)}
                />
                <span className={styles.muted}>字</span>
              </div>
            </div>
          )}

          {activeType === 'group' && (
            <div className={styles.formGroup} style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <label className={styles.label} style={{ marginBottom: 0 }}>子題管理</label>
                <button className={styles.outlineBtn} onClick={() => {
                  setSubQuestions([...subQuestions, { id: Date.now(), type: 'single', html: '', options: [{ id: 'A', text: '選項 A', isCorrect: true }, { id: 'B', text: '選項 B', isCorrect: false }, { id: 'C', text: '選項 C', isCorrect: false }, { id: 'D', text: '選項 D', isCorrect: false }] }]);
                }}>
                  + 新增子題
                </button>
              </div>
              <div className={styles.sqAccordionList}>
                {subQuestions.map((sq, index) => (
                  <SubQuestionEditor 
                    key={sq.id} 
                    sq={sq} 
                    index={index} 
                    updateSubQuestion={(id, newData) => setSubQuestions(subQuestions.map(s => s.id === id ? { ...s, ...newData } : s))}
                    removeSubQuestion={(id) => setSubQuestions(subQuestions.filter(s => s.id !== id))}
                    onOpenMath={openMathModal}
                  />
                ))}
              </div>
            </div>
          )}

          {activeType !== 'group' && (
            <div className={styles.formGroup} style={{ marginTop: '24px' }}>
              <label className={styles.label}>標準答案補充 / 題目詳解 (選填)</label>
              <textarea 
                className={styles.optionInput} 
                style={{ minHeight: '80px', padding: '12px', resize: 'vertical' }}
                placeholder="可輸入此題的標準答案補充說明、計算過程或詳解..."
                value={qExplanation}
                onChange={(e) => setQExplanation(e.target.value)}
              />
            </div>
          )}

          {/* 題目進階設定 */}
          <div className={styles.advancedSettingsSection}>
            <div className={styles.sectionDivider}></div>
            <div className={styles.formRow}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.label}>題目配分</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="number" 
                    className={styles.optionInput} 
                    style={{ width: '100px' }}
                    value={qScore} 
                    onChange={(e) => setQScore(parseFloat(e.target.value) || 0)}
                  />
                  <span className={styles.muted}>分</span>
                </div>
              </div>
              
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.label}>難度等級</label>
                <div className={styles.difficultyStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      className={`${styles.starBtn} ${qDifficulty >= star ? styles.starActive : ''}`}
                      onClick={() => setQDifficulty(star)}
                    >
                      <Star size={18} fill={qDifficulty >= star ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup} style={{ flex: 1.5 }}>
                <label className={styles.label}>分類標籤</label>
                <input 
                  type="text" 
                  className={styles.optionInput} 
                  placeholder="例如：第一章、基礎概念"
                  value={qCategory} 
                  onChange={(e) => setQCategory(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className={styles.editorFooter}>
            <button className={styles.cancelBtn}>放棄變更</button>
            <button className={styles.draftBtn} onClick={handleSaveQuestion}>💾 儲存為草稿</button>
          </div>
        </div>

        {/* Resizer Handle */}
        <div 
          className={`${styles.resizer} ${isDragging ? styles.active : ''}`}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClickResizer}
          title="拖拉調整預覽寬度，雙擊重置"
        >
          <div className={styles.resizerLine} />
        </div>

        {/* Right Column: Preview */}
        <div className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <div className={styles.deviceToggle}>
              <button className={`${styles.deviceBtn} ${previewMode === 'mobile' ? styles.active : ''}`} onClick={() => setPreviewMode('mobile')}><Smartphone size={16} /> 手機預覽</button>
              <button className={`${styles.deviceBtn} ${previewMode === 'tablet' ? styles.active : ''}`} onClick={() => setPreviewMode('tablet')}><Tablet size={16} /> 平板預覽</button>
              <button className={`${styles.deviceBtn} ${previewMode === 'desktop' ? styles.active : ''}`} onClick={() => setPreviewMode('desktop')}><Monitor size={16} /> 電腦版</button>
            </div>
            <span className={styles.syncStatus}><Eye size={14} /> 即時同步中</span>
          </div>

          <div className={styles.previewCanvas}>
            {previewMode === 'mobile' ? (
              <div className={styles.phoneFrame}>
                <div className={styles.phoneTopBar}><span className={styles.time}>9:41</span><div className={styles.cameraNotch}></div></div>
                <div className={styles.phoneContent} style={{ padding: 0, overflow: 'hidden' }}>
                  <ExamRenderCore
                    isPreview={true}
                    questions={realtimeQuestions}
                    currentIndex={Math.max(0, examQuestions.findIndex(q => q.id === activeQuestionId))}
                    setCurrentIndex={(idx) => {
                      const targetQ = examQuestions[idx];
                      if (targetQ) setActiveQuestionId(targetQ.id);
                    }}
                    deviceType="phone"
                  />
                </div>
              </div>
            ) : previewMode === 'tablet' ? (
              <div className={styles.tabletContainer}>
                <div className={styles.tabletTopBar}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#1e293b' }}>9:41</span>
                  <div className={styles.tabletCamera} />
                  <span style={{ fontSize: 11, color: '#1e293b' }}>🔋 100%</span>
                </div>
                <div className={styles.tabletContent} style={{ padding: 0, overflow: 'hidden' }}>
                  <ExamRenderCore
                    isPreview={true}
                    questions={realtimeQuestions}
                    currentIndex={Math.max(0, examQuestions.findIndex(q => q.id === activeQuestionId))}
                    setCurrentIndex={(idx) => {
                      const targetQ = examQuestions[idx];
                      if (targetQ) setActiveQuestionId(targetQ.id);
                    }}
                    deviceType="tablet"
                  />
                </div>
              </div>
            ) : (
              <div className={styles.monitorContainer}>
                <div className={styles.monitorStand}>
                  <div className={styles.monitorBase}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f87171' }} />
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fbbf24' }} />
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#34d399' }} />
                  </div>
                  <div className={styles.browserUrlBar}>
                    🔒 exam.ailearn.edu.tw/test/questions/1
                  </div>
                </div>
                <div className={styles.desktopPreviewFrame} style={{ padding: 0, overflow: 'hidden' }}>
                  <ExamRenderCore
                    isPreview={true}
                    questions={realtimeQuestions}
                    currentIndex={Math.max(0, examQuestions.findIndex(q => q.id === activeQuestionId))}
                    setCurrentIndex={(idx) => {
                      const targetQ = examQuestions[idx];
                      if (targetQ) setActiveQuestionId(targetQ.id);
                    }}
                    deviceType="desktop"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Code Modal */}
      {isCodeModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>插入程式碼</h3>
              <button className={styles.closeBtn} onClick={() => setIsCodeModalOpen(false)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.label}>選擇語言</label>
              <select className={styles.langSelect} value={codeLang} onChange={(e) => setCodeLang(e.target.value)}>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="html">HTML/CSS</option>
              </select>
              <label className={styles.label} style={{marginTop: '16px'}}>程式碼內容</label>
              <textarea 
                className={styles.codeTextarea} 
                value={codeText} 
                onChange={(e) => setCodeText(e.target.value)} 
                rows={10} 
                placeholder="// 輸入程式碼..."
              />
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.outlineBtn} onClick={() => setIsCodeModalOpen(false)}>取消</button>
              <button className={styles.saveBtn} onClick={confirmCodeInsert}>確認插入</button>
            </div>
          </div>
        </div>
      )}
      
      <MathEditorModal 
        isOpen={isMathModalOpen} 
        onClose={() => setIsMathModalOpen(false)} 
        onSave={(latex) => {
          if (activeMathEditor) {
            activeMathEditor.chain().focus().insertContent(latex).run();
          }
        }} 
      />

      {/* 自訂發布確認 Modal */}
      {isPublishConfirmOpen && (
        <div className={styles.modalOverlay} style={{ zIndex: 9999 }}>
          <div className={styles.modalContent} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h3>發布考卷確認</h3>
              <button className={styles.closeBtn} onClick={() => setIsPublishConfirmOpen(false)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody} style={{ padding: '24px 20px', fontSize: '16px', color: 'var(--color-on-surface)', lineHeight: '1.5' }}>
              確定要正式發布此考卷嗎？<br /><br />
              發布後學生即可開始進行測驗，請再次確認題目與答案內容是否皆已正確儲存。
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.outlineBtn} onClick={() => setIsPublishConfirmOpen(false)}>取消</button>
              <button className={styles.saveBtn} onClick={confirmPublishExam}>確認發布</button>
            </div>
          </div>
        </div>
      )}

      {/* 全卷預覽 Full Screen Modal */}
      {isPreviewModalOpen && (
        <div className={styles.modalOverlay} style={{ zIndex: 9999 }}>
          <div className={styles.modalContent} style={{ width: '90vw', maxWidth: '1200px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className={styles.modalHeader}>
              <h3>全卷預覽 - {examConfig.title || '未命名考卷'}</h3>
              <button className={styles.closeBtn} onClick={() => setIsPreviewModalOpen(false)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody} style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                <ExamRenderCore
                  isPreview={true}
                  questions={realtimeQuestions}
                  currentIndex={Math.max(0, examQuestions.findIndex(q => q.id === activeQuestionId))}
                  setCurrentIndex={(idx) => {
                    const targetQ = examQuestions[idx];
                    if (targetQ) setActiveQuestionId(targetQ.id);
                  }}
                  deviceType="desktop"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default QuestionBank;
