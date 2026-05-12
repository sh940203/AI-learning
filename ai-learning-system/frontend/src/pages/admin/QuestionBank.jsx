import React, { useState, useRef, useEffect } from 'react';
import { Upload, Bold, Italic, Underline, Palette, Type, ListOrdered, List, Code, Sigma, FileAudio, Superscript as SupIcon, Subscript as SubIcon, Image as ImageIcon, Eraser, CircleDot, CheckSquare, ToggleLeft, Edit3, Layers, Smartphone, Tablet, Monitor, Eye, Check, X, Copy, ClipboardPaste, Undo as UndoIcon, Redo as RedoIcon, AlignLeft, Headphones } from 'lucide-react';
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
    else if (newType === 'single' || newType === 'multiple' || newType === 'listening') newOptions = [{ id: 'A', text: '選項 A', isCorrect: true }, { id: 'B', text: '選項 B', isCorrect: false }, { id: 'C', text: '選項 C', isCorrect: false }, { id: 'D', text: '選項 D', isCorrect: false }];
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
              <button className={`${styles.typeBtn} ${sq.type === 'listening' ? styles.active : ''}`} onClick={() => handleTypeChange('listening')}>聽力</button>
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
            <label className={styles.label}>選項設定</label>
            <div className={styles.optionsList}>
              {sq.options.map((opt) => (
                <div key={opt.id} className={styles.optionRow}>
                  <div className={`${styles.optionLabel} ${opt.isCorrect ? styles.labelCorrect : ''}`}>{opt.id}</div>
                  <input type="text" className={styles.optionInput} value={opt.text} onChange={(e) => handleOptionChange(opt.id, e.target.value)} placeholder={`輸入選項 ${opt.id} 內容...`} />
                  <button className={`${styles.checkBtn} ${opt.isCorrect ? styles.checked : ''}`} onClick={() => handleToggleCorrect(opt.id)}><Check size={16} /></button>
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
        </div>
      )}
    </div>
  );
};

const QuestionBank = () => {
  const [activeType, setActiveType] = useState('single');
  const [wordLimit, setWordLimit] = useState(0);
  const [questionHTML, setQuestionHTML] = useState('');
  const [showArticleDrawer, setShowArticleDrawer] = useState(false);
  const [subQuestions, setSubQuestions] = useState([
    { id: 1, type: 'single', options: [{ id: 'A', text: '選項 A', isCorrect: true }, { id: 'B', text: '選項 B', isCorrect: false }, { id: 'C', text: '選項 C', isCorrect: false }, { id: 'D', text: '選項 D', isCorrect: false }] },
    { id: 2, type: 'fill', options: [{ id: '1', text: '標準答案', isCorrect: true }] }
  ]);
  
  const [isMathModalOpen, setIsMathModalOpen] = useState(false);
  const [activeMathEditor, setActiveMathEditor] = useState(null);

  const openMathModal = (editorInstance) => {
    setActiveMathEditor(editorInstance);
    setIsMathModalOpen(true);
  };
  
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

  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);

  const handleTypeChange = (type) => {
    setActiveType(type);
    if (type === 'tf') setOptions([{ id: 'O', text: '正確 (True)', isCorrect: true }, { id: 'X', text: '錯誤 (False)', isCorrect: false }]);
    else if (type === 'single' || type === 'multiple' || type === 'listening') setOptions([{ id: 'A', text: '選項 A', isCorrect: true }, { id: 'B', text: '選項 B', isCorrect: false }, { id: 'C', text: '選項 C', isCorrect: false }, { id: 'D', text: '選項 D', isCorrect: false }]);
    else if (type === 'fill') setOptions([{ id: '1', text: '標準答案...', isCorrect: true }]);
    else if (type === 'short') setOptions([{ id: '1', text: '參考解答...', isCorrect: true }]);
    else setOptions([]); 
  };

  const handleToggleCorrect = (id) => {
    if (activeType === 'single' || activeType === 'tf') setOptions(options.map(opt => ({ ...opt, isCorrect: opt.id === id })));
    else if (activeType === 'multiple') setOptions(options.map(opt => opt.id === id ? { ...opt, isCorrect: !opt.isCorrect } : opt));
  };

  const handleOptionTextChange = (id, newText) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, text: newText } : opt));
  };

  const handleMediaUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file || !editor) return;
    const url = URL.createObjectURL(file);
    if (type === 'image') editor.chain().focus().setResizableImage({ src: url }).run();
    else if (type === 'audio') editor.chain().focus().setAudio({ src: url }).run();
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

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.breadcrumbRow}>
        <div className={styles.breadcrumb}>
          <span className={styles.muted}>題庫管理</span>
          <span className={styles.separator}>&gt;</span>
          <span className={styles.active}>進階編輯器</span>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.editorSection}>
          <div className={styles.editorHeader}>
            <h2 className={styles.sectionTitle}>編輯新題目</h2>
            <button className={styles.outlineBtn} onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> 從 Excel 模板匯入
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
              <button className={`${styles.typeBtn} ${activeType === 'listening' ? styles.active : ''}`} onClick={() => handleTypeChange('listening')}><Headphones size={20} /> 聽力題</button>
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
                
                <button className={styles.toolBtn} onClick={() => audioInputRef.current?.click()} title="插入音訊"><FileAudio size={16} /></button>
                <input type="file" accept="audio/*" ref={audioInputRef} style={{display:'none'}} onChange={(e) => handleMediaUpload(e, 'audio')} />
              </div>

              {/* Tiptap Editor Context */}
              <div className={styles.richTextEditorContainer}>
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>

          {(activeType === 'single' || activeType === 'multiple' || activeType === 'tf' || activeType === 'fill') && (
            <div className={styles.formGroup}>
              <label className={styles.label}>選項設定 {activeType === 'multiple' && <span style={{fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 'normal'}}>(可複選)</span>}</label>
              <div className={styles.optionsList}>
                {options.map((opt) => (
                  <div key={opt.id} className={styles.optionRow}>
                    <div className={`${styles.optionLabel} ${opt.isCorrect ? styles.labelCorrect : ''}`}>{opt.id}</div>
                    <input type="text" className={styles.optionInput} value={opt.text} onChange={(e) => handleOptionTextChange(opt.id, e.target.value)} placeholder={`輸入選項 ${opt.id} 內容...`} />
                    <button className={`${styles.checkBtn} ${opt.isCorrect ? styles.checked : ''}`} onClick={() => handleToggleCorrect(opt.id)}><Check size={16} /></button>
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
          
          <div className={styles.editorFooter}>
            <button className={styles.cancelBtn}>取消變更</button>
            <button className={styles.saveBtn}>儲存題目</button>
          </div>
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
                <div className={styles.phoneContent}>
                  {activeType === 'group' ? (
                    <>
                      <button className={styles.drawerBtn} onClick={() => setShowArticleDrawer(!showArticleDrawer)}>
                         {showArticleDrawer ? '收起閱讀本文' : '📖 點擊查看閱讀本文'}
                      </button>
                      {showArticleDrawer && (
                         <div className={styles.articleDrawer}>
                            <div className={styles.qTitlePreview} dangerouslySetInnerHTML={{ __html: renderLatexInHtml(questionHTML) || '<span style="color:var(--color-text-muted)">請在左側輸入本文內容...</span>' }} />
                         </div>
                      )}
                      {!showArticleDrawer && (
                        <div className={styles.groupQuestionsContainer}>
                          {subQuestions.map((sq, idx) => (
                            <div key={sq.id} className={styles.subQuestionCard}>
                              <div className={styles.sqHeader}>
                                <span className={styles.sqBadge}>第 {idx + 1} 題 ({sq.type === 'single' ? '單選' : sq.type === 'multiple' ? '複選' : sq.type === 'tf' ? '是非' : '填空'})</span>
                              </div>
                              <div className={styles.qTitlePreview} dangerouslySetInnerHTML={{ __html: renderLatexInHtml(sq.html) || '<span style="color:var(--color-text-muted)">此子題尚未填寫敘述...</span>' }} />
                              {renderPreviewOptions(sq.type, sq.options, sq.wordLimit)}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className={styles.qHeader}>
                        <span className={styles.qBadge}>{activeType === 'single' ? '單選題' : activeType === 'multiple' ? '複選題' : activeType === 'tf' ? '是非題' : activeType === 'fill' ? '填空題' : '題型'}</span>
                        <span className={styles.qProgress}>Q 1/15</span>
                      </div>
                      <div className={styles.qTitlePreview} dangerouslySetInnerHTML={{ __html: renderLatexInHtml(questionHTML) || '<span style="color:var(--color-text-muted)">請在左側輸入題目內容...</span>' }} />
                      
                      {renderPreviewOptions(activeType, options, wordLimit)}
                    </>
                  )}
                  <button className={styles.submitPreviewBtn}>確認送出 &rarr;</button>
                </div>
              </div>
            ) : previewMode === 'tablet' ? (
              <div className={styles.tabletFrame}>
                 <div className={styles.qHeader}>
                    <span className={styles.qBadge}>{activeType === 'single' ? '單選題' : activeType === 'multiple' ? '複選題' : activeType === 'tf' ? '是非題' : '題型'}</span>
                  </div>
                  <div className={styles.qTitlePreview} style={{ fontSize: '18px' }} dangerouslySetInnerHTML={{ __html: renderLatexInHtml(questionHTML) || '<span style="color:var(--color-text-muted)">請在左側輸入題目內容...</span>' }} />
                  {renderPreviewOptions(activeType, options, wordLimit)}
              </div>
            ) : (
              <div className={styles.monitorContainer}>
                <div className={styles.desktopPreviewFrame}>
                   {activeType === 'group' ? (
                     <div className={styles.splitPane}>
                       <div className={styles.splitLeft}>
                         <div className={styles.qTitlePreview} style={{ fontSize: '18px' }} dangerouslySetInnerHTML={{ __html: renderLatexInHtml(questionHTML) || '<span style="color:var(--color-text-muted)">請在左側輸入本文內容...</span>' }} />
                       </div>
                       <div className={styles.splitRight}>
                         <div className={styles.groupQuestionsContainer}>
                          {subQuestions.map((sq, idx) => (
                            <div key={sq.id} className={styles.subQuestionCard}>
                              <div className={styles.sqHeader}>
                                <span className={styles.sqBadge}>第 {idx + 1} 題 ({sq.type === 'single' ? '單選' : sq.type === 'multiple' ? '複選' : sq.type === 'tf' ? '是非' : '填空'})</span>
                              </div>
                              <div className={styles.qTitlePreview} dangerouslySetInnerHTML={{ __html: renderLatexInHtml(sq.html) || '<span style="color:var(--color-text-muted)">此子題尚未填寫敘述...</span>' }} />
                              {renderPreviewOptions(sq.type, sq.options, sq.wordLimit)}
                            </div>
                          ))}
                        </div>
                       </div>
                     </div>
                   ) : (
                     <>
                       <div className={styles.qHeader}>
                          <span className={styles.qBadge}>{activeType === 'single' ? '單選題' : activeType === 'multiple' ? '複選題' : activeType === 'tf' ? '是非題' : activeType === 'fill' ? '填空題' : '題型'}</span>
                        </div>
                        <div className={styles.qTitlePreview} style={{ fontSize: '18px' }} dangerouslySetInnerHTML={{ __html: renderLatexInHtml(questionHTML) || '<span style="color:var(--color-text-muted)">請在左側輸入題目內容...</span>' }} />
                        {renderPreviewOptions(activeType, options, wordLimit)}
                     </>
                   )}
                </div>
                <div className={styles.monitorStand}></div>
                <div className={styles.monitorBase}></div>
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
    </div>
  );
};
export default QuestionBank;
