import React, { useState, useEffect, useRef } from 'react';
import { X, HelpCircle, ChevronDown } from 'lucide-react';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import styles from './MathEditorModal.module.css';

const basicSymbols = [
  '\\pm', '\\infty', '=', '\\sim', '\\times', '\\div', '!', '<', '\\ll', '>', '\\gg', '\\le',
  '\\ge', '\\mp', '\\simeq', '\\equiv', '\\propto', '\\approx', '\\forall', '\\partial', '\\sqrt{}', '\\cup', '\\cap', '\\emptyset',
  '\\%', '^\\circ', '\\exists', '\\nexists', '\\in', '\\ni', '\\leftarrow', '\\uparrow', '\\rightarrow', '\\downarrow', '\\leftrightarrow', '\\therefore',
  '\\because', '+', '-', '\\neg', '*', '\\cdot', '\\vdots', '\\aleph', '\\beth', '\\blacksquare'
];

const greekLowercase = [
  '\\alpha', '\\beta', '\\gamma', '\\delta', '\\epsilon', '\\zeta', '\\eta', '\\theta', '\\iota', '\\kappa', '\\lambda',
  '\\mu', '\\nu', '\\xi', 'o', '\\pi', '\\rho', '\\sigma', '\\tau', '\\upsilon', '\\phi', '\\chi',
  '\\psi', '\\omega'
];

const greekUppercase = [
  'A', 'B', '\\Gamma', '\\Delta', 'E', 'Z', 'H', '\\Theta', 'I', 'K', '\\Lambda',
  'M', 'N', '\\Xi', 'O', '\\Pi', 'P', '\\Sigma', 'T', '\\Upsilon', '\\Phi', 'X',
  '\\Psi', '\\Omega'
];

const greekVariants = [
  '\\digamma', '\\varepsilon', '\\varkappa', '\\varphi', '\\varpi', '\\varrho', '\\varsigma', '\\vartheta'
];

const negatedRelations = [
  '\\neq', '\\nless', '\\ngtr', '\\nleq', '\\ngeq', '\\nsim', '\\lneqq', '\\gneqq', '\\nprec', '\\nsucc', '\\notin', '\\nsubseteq',
  '\\nsupseteq', '\\subsetneq', '\\supsetneq', '\\lnsim', '\\gnsim', '\\precnsim', '\\succnsim', '\\ntriangleleft', '\\ntriangleright', '\\ntrianglelefteq', '\\ntrianglerighteq', '\\nmid',
  '\\nparallel', '\\nvdash', '\\nVdash', '\\nvDash', '\\nVDash', '\\nni'
];

const letterLikeSymbols = [
  '\\aleph', '\\beth', '\\daleth', '\\gimel', '\\complement', '\\ell', '\\eth', '\\hbar', '\\hslash', '\\mho', '\\partial', '\\wp',
  '\\circledS', '\\Bbbk', '\\Finv', '\\Game', '\\Im', '\\Re'
];

const arrowSymbols = [
  '\\leftarrow', '\\rightarrow', '\\uparrow', '\\downarrow', '\\leftrightarrow', '\\updownarrow', '\\Leftarrow', '\\Rightarrow', '\\Uparrow', '\\Downarrow', '\\Leftrightarrow', '\\Updownarrow',
  '\\longleftarrow', '\\longrightarrow', '\\longleftrightarrow', '\\Longleftarrow', '\\Longrightarrow', '\\Longleftrightarrow', '\\nearrow', '\\nwarrow', '\\searrow', '\\swarrow', '\\nleftarrow', '\\nrightarrow',
  '\\nLeftarrow', '\\nRightarrow', '\\nLeftrightarrow', '\\leftharpoonup', '\\leftharpoondown', '\\rightharpoonup', '\\rightharpoondown', '\\upharpoonleft', '\\upharpoonright', '\\downharpoonleft', '\\downharpoonright', '\\rightleftharpoons',
  '\\leftrightharpoons', '\\leftrightarrows', '\\rightrightarrows', '\\upuparrows', '\\downdownarrows', '\\leftleftarrows', '\\rightleftarrows', '\\looparrowleft', '\\looparrowright', '\\hookleftarrow', '\\hookrightarrow', '\\Lsh',
  '\\Rsh', '\\Lleftarrow', '\\Rrightarrow', '\\curvearrowleft', '\\curvearrowright', '\\circlearrowleft', '\\circlearrowright', '\\multimap', '\\leftrightsquigarrow', '\\twoheadleftarrow', '\\twoheadrightarrow', '\\rightsquigarrow'
];

const uppercaseLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
const lowercaseLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

const mathcalSymbols = uppercaseLetters.map(l => `\\mathcal{${l}}`);
const mathfrakUpperSymbols = uppercaseLetters.map(l => `\\mathfrak{${l}}`);
const mathfrakLowerSymbols = lowercaseLetters.map(l => `\\mathfrak{${l}}`);
const mathbbSymbols = uppercaseLetters.map(l => `\\mathbb{${l}}`);
const mathrmUpperSymbols = uppercaseLetters.map(l => `\\mathrm{${l}}`);
const mathrmLowerSymbols = lowercaseLetters.map(l => `\\mathrm{${l}}`);

const fractionTemplates = [
  { preview: '\\frac{\\square}{\\square}', insert: '\\frac{ }{ }' },
  { preview: '\\square/\\square', insert: ' { } / { } ' }
];

const commonFractions = [
  { preview: '\\frac{dy}{dx}', insert: '\\frac{dy}{dx}' },
  { preview: '\\frac{\\Delta y}{\\Delta x}', insert: '\\frac{\\Delta y}{\\Delta x}' },
  { preview: '\\frac{\\delta y}{\\delta x}', insert: '\\frac{\\delta y}{\\delta x}' },
  { preview: '\\frac{\\pi}{2}', insert: '\\frac{\\pi}{2}' }
];

const scriptTemplates = [
  { preview: '\\square^{\\square}', insert: '^{ }' },
  { preview: '\\square_{\\square}', insert: '_{ }' },
  { preview: '\\square_{\\square}^{\\square}', insert: '_{ }^{ }' },
  { preview: '{}_{\\square}^{\\square}\\square', insert: '{}_{ }^{ }' }
];

const commonScripts = [
  { preview: 'e^x', insert: 'e^x' },
  { preview: 'x^2', insert: 'x^2' },
  { preview: 'x_i', insert: 'x_i' },
  { preview: 'e^{i\\theta}', insert: 'e^{i\\theta}' }
];

const rootTemplates = [
  { preview: '\\sqrt{\\square}', insert: '\\sqrt{ }' },
  { preview: '\\sqrt[\\square]{\\square}', insert: '\\sqrt[ ]{ }' },
  { preview: '\\sqrt[2]{\\square}', insert: '\\sqrt[2]{ }' },
  { preview: '\\sqrt[3]{\\square}', insert: '\\sqrt[3]{ }' }
];

const integralTemplates = [
  { preview: '\\int{\\square}', insert: '\\int{ }' },
  { preview: '\\int_{\\square}^{\\square}{\\square}', insert: '\\int_{ }^{ }{ }' },
  { preview: '\\iint{\\square}', insert: '\\iint{ }' },
  { preview: '\\iint_{\\square}^{\\square}{\\square}', insert: '\\iint_{ }^{ }{ }' },
  { preview: '\\iiint{\\square}', insert: '\\iiint{ }' },
  { preview: '\\iiint_{\\square}^{\\square}{\\square}', insert: '\\iiint_{ }^{ }{ }' }
];

const operatorTemplates = [
  { preview: '\\sum{\\square}', insert: '\\sum{ }' },
  { preview: '\\sum_{\\square}^{\\square}{\\square}', insert: '\\sum_{ }^{ }{ }' },
  { preview: '\\sum_{\\square}{\\square}', insert: '\\sum_{ }{ }' }
];

const bracketTemplates = [
  { preview: '\\left( \\square \\right)', insert: '\\left(  \\right)' },
  { preview: '\\left[ \\square \\right]', insert: '\\left[  \\right]' },
  { preview: '\\left\\{ \\square \\right\\}', insert: '\\left\\{  \\right\\}' },
  { preview: '\\left| \\square \\right|', insert: '\\left|  \\right|' }
];

const trigFunctionTemplates = [
  { preview: '\\sin{\\square}', insert: '\\sin{ }' },
  { preview: '\\cos{\\square}', insert: '\\cos{ }' },
  { preview: '\\tan{\\square}', insert: '\\tan{ }' },
  { preview: '\\csc{\\square}', insert: '\\csc{ }' },
  { preview: '\\sec{\\square}', insert: '\\sec{ }' },
  { preview: '\\cot{\\square}', insert: '\\cot{ }' }
];

const commonFunctionTemplates = [
  { preview: '\\sin \\theta', insert: '\\sin \\theta' },
  { preview: '\\cos 2x', insert: '\\cos 2x' },
  { preview: '\\tan \\theta = \\frac{\\sin \\theta}{\\cos \\theta}', insert: '\\tan \\theta = \\frac{\\sin \\theta}{\\cos \\theta}' }
];

const MathEditorModal = ({ isOpen, onClose, onSave }) => {
  const [latex, setLatex] = useState('');
  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const [isSymbolMenuOpen, setIsSymbolMenuOpen] = useState(false);
  const [isFractionMenuOpen, setIsFractionMenuOpen] = useState(false);
  const [isScriptMenuOpen, setIsScriptMenuOpen] = useState(false);
  const [isRootMenuOpen, setIsRootMenuOpen] = useState(false);
  const [isIntegralMenuOpen, setIsIntegralMenuOpen] = useState(false);
  const [isOperatorMenuOpen, setIsOperatorMenuOpen] = useState(false);
  const [isBracketMenuOpen, setIsBracketMenuOpen] = useState(false);
  const [isFunctionMenuOpen, setIsFunctionMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('basic');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const previewRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (previewRef.current && latex.trim() !== '') {
      try {
        katex.render(latex, previewRef.current, {
          throwOnError: false,
          displayMode: true
        });
      } catch (e) {
        console.error("KaTeX rendering error:", e);
      }
    }
  }, [latex]);

  const closeAllMenus = () => {
    setIsPresetOpen(false);
    setIsSymbolMenuOpen(false);
    setIsCategoryDropdownOpen(false);
    setIsFractionMenuOpen(false);
    setIsScriptMenuOpen(false);
    setIsRootMenuOpen(false);
    setIsIntegralMenuOpen(false);
    setIsOperatorMenuOpen(false);
    setIsBracketMenuOpen(false);
    setIsFunctionMenuOpen(false);
  };

  // Click outside to close dropdown
  useEffect(() => {
    document.addEventListener('click', closeAllMenus);
    return () => document.removeEventListener('click', closeAllMenus);
  }, []);

  if (!isOpen) return null;

  const insertLatex = (str) => {
    // Basic insertion at end for simplicity, ideally at cursor position
    const current = textareaRef.current;
    if (current) {
      const start = current.selectionStart;
      const end = current.selectionEnd;
      const newLatex = latex.substring(0, start) + str + latex.substring(end);
      setLatex(newLatex);

      // Reset focus and cursor position after React re-renders
      setTimeout(() => {
        current.focus();
        current.setSelectionRange(start + str.length, start + str.length);
      }, 0);
    } else {
      setLatex(prev => prev + str);
    }
  };

  const handleSave = () => {
    if (latex.trim() === '') {
      onClose();
      return;
    }
    // Convert to the exact format needed for Tiptap to parse or render
    onSave(`$$${latex}$$`);
    setLatex('');
    onClose();
  };

  const handlePresetClick = (e) => {
    e.stopPropagation();
    closeAllMenus();
    setIsPresetOpen(!isPresetOpen);
  };

  const handleSymbolMenuClick = (e) => {
    e.stopPropagation();
    closeAllMenus();
    setIsSymbolMenuOpen(!isSymbolMenuOpen);
  };

  const handleFractionMenuClick = (e) => {
    e.stopPropagation();
    closeAllMenus();
    setIsFractionMenuOpen(!isFractionMenuOpen);
  };

  const handleScriptMenuClick = (e) => {
    e.stopPropagation();
    closeAllMenus();
    setIsScriptMenuOpen(!isScriptMenuOpen);
  };

  const handleRootMenuClick = (e) => {
    e.stopPropagation();
    closeAllMenus();
    setIsRootMenuOpen(!isRootMenuOpen);
  };

  const handleIntegralMenuClick = (e) => {
    e.stopPropagation();
    closeAllMenus();
    setIsIntegralMenuOpen(!isIntegralMenuOpen);
  };

  const handleOperatorMenuClick = (e) => {
    e.stopPropagation();
    closeAllMenus();
    setIsOperatorMenuOpen(!isOperatorMenuOpen);
  };

  const handleBracketMenuClick = (e) => {
    e.stopPropagation();
    closeAllMenus();
    setIsBracketMenuOpen(!isBracketMenuOpen);
  };

  const handleFunctionMenuClick = (e) => {
    e.stopPropagation();
    closeAllMenus();
    setIsFunctionMenuOpen(!isFunctionMenuOpen);
  };

  const selectPreset = (latexStr) => {
    insertLatex(latexStr);
    setIsPresetOpen(false);
  };

  const renderSymbolButton = (sym, idx) => {
    let html = '';
    try {
      html = katex.renderToString(sym, { throwOnError: false, displayMode: false });
    } catch (e) {
      html = sym;
    }
    return (
      <button
        key={idx}
        className={styles.symbolBtn}
        onClick={() => { insertLatex(sym + ' '); setIsSymbolMenuOpen(false); setIsCategoryDropdownOpen(false); }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  const renderSymbolGrid = () => {
    if (activeCategory === 'basic') {
      return (
        <>
          <div className={styles.largeSymbolSubheader}>基礎數學</div>
          <div className={styles.largeSymbolGrid}>
            {basicSymbols.map((sym, idx) => renderSymbolButton(sym, idx))}
          </div>
        </>
      );
    } else if (activeCategory === 'greek') {
      return (
        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
          <div className={styles.largeSymbolSubheader}>小寫</div>
          <div className={styles.largeSymbolGrid}>
            {greekLowercase.map((sym, idx) => renderSymbolButton(sym, idx))}
          </div>
          <div className={styles.largeSymbolSubheader}>大寫</div>
          <div className={styles.largeSymbolGrid}>
            {greekUppercase.map((sym, idx) => renderSymbolButton(sym, idx))}
          </div>
          <div className={styles.largeSymbolSubheader}>變體</div>
          <div className={styles.largeSymbolGrid}>
            {greekVariants.map((sym, idx) => renderSymbolButton(sym, idx))}
          </div>
        </div>
      );
    } else if (activeCategory === 'negated') {
      return (
        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
          <div className={styles.largeSymbolSubheader}>否定關係</div>
          <div className={styles.largeSymbolGrid}>
            {negatedRelations.map((sym, idx) => renderSymbolButton(sym, idx))}
          </div>
        </div>
      );
    } else if (activeCategory === 'letter') {
      return (
        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
          <div className={styles.largeSymbolSubheader}>似字母符號</div>
          <div className={styles.largeSymbolGrid}>
            {letterLikeSymbols.map((sym, idx) => renderSymbolButton(sym, idx))}
          </div>
        </div>
      );
    } else if (activeCategory === 'arrows') {
      return (
        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
          <div className={styles.largeSymbolSubheader}>箭號</div>
          <div className={styles.largeSymbolGrid}>
            {arrowSymbols.map((sym, idx) => renderSymbolButton(sym, idx))}
          </div>
        </div>
      );
    } else if (activeCategory === 'fonts') {
      return (
        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
          <div className={styles.largeSymbolSubheader}>手寫體</div>
          <div className={styles.largeSymbolGrid}>
            {mathcalSymbols.map((sym, idx) => renderSymbolButton(sym, idx))}
          </div>
          <div className={styles.largeSymbolSubheader}>歌德體</div>
          <div className={styles.largeSymbolGrid}>
            {mathfrakUpperSymbols.map((sym, idx) => renderSymbolButton(sym, idx))}
            {mathfrakLowerSymbols.map((sym, idx) => renderSymbolButton(sym, idx + 26))}
          </div>
          <div className={styles.largeSymbolSubheader}>粗體</div>
          <div className={styles.largeSymbolGrid}>
            {mathbbSymbols.map((sym, idx) => renderSymbolButton(sym, idx))}
          </div>
          <div className={styles.largeSymbolSubheader}>羅馬體</div>
          <div className={styles.largeSymbolGrid}>
            {mathrmUpperSymbols.map((sym, idx) => renderSymbolButton(sym, idx))}
            {mathrmLowerSymbols.map((sym, idx) => renderSymbolButton(sym, idx + 26))}
          </div>
        </div>
      );
    }
  };

  const renderTemplateButton = (template, idx, onCloseMenu) => {
    let html = '';
    try {
      html = katex.renderToString(template.preview, { throwOnError: false, displayMode: true });
    } catch (e) {
      html = template.preview;
    }
    return (
      <button
        key={idx}
        className={styles.templateBtn}
        onClick={() => { insertLatex(template.insert); onCloseMenu(); }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onMouseDown={handleOverlayMouseDown}>
      <div className={styles.modalContent} onClick={closeAllMenus}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.title}>公式編輯器</div>
          <button className={styles.closeBtn} onClick={onClose}><X size={24} /></button>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarSection}>
            <div className={styles.dropdownContainer}>
              <button className={styles.presetBtn} onClick={handlePresetClick}>
                <span className={styles.presetIcon}>f(x)</span>
                <span className={styles.presetText}>方程式 <ChevronDown size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /></span>
              </button>
              {isPresetOpen && (
                <div className={styles.dropdownMenu}>
                  <button className={styles.dropdownItem} onClick={() => selectPreset('x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}')}>
                    二次方程式
                    <span>x = (-b ± √(b² - 4ac)) / 2a</span>
                  </button>
                  <button className={styles.dropdownItem} onClick={() => selectPreset('(x+a)^n = \\sum_{k=0}^{n} \\binom{n}{k} x^k a^{n-k}')}>
                    二項式定理
                    <span>(x+a)ⁿ = Σ(n,k) xᵏ aⁿ⁻ᵏ</span>
                  </button>
                  <button className={styles.dropdownItem} onClick={() => selectPreset('a^2 + b^2 = c^2')}>
                    畢氏定理
                    <span>a² + b² = c²</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={styles.toolbarSection}>
            <div className={styles.symbolDropdownContainer}>
              <button className={styles.symbolCategoryBtn} onClick={handleSymbolMenuClick}>
                {activeCategory === 'basic' ? '基礎數學' : activeCategory === 'greek' ? '希臘字母' : activeCategory === 'negated' ? '否定關係' : activeCategory === 'letter' ? '似字母符號' : activeCategory === 'arrows' ? '箭號' : '手寫體'} <ChevronDown size={14} />
              </button>
              {isSymbolMenuOpen && (
                <div className={styles.largeSymbolDropdown} onClick={e => e.stopPropagation()}>
                  <div
                    className={styles.largeSymbolHeader}
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    style={{ position: 'relative' }}
                  >
                    {activeCategory === 'basic' ? '基礎數學' : activeCategory === 'greek' ? '希臘字母' : activeCategory === 'negated' ? '否定關係' : activeCategory === 'letter' ? '似字母符號' : activeCategory === 'arrows' ? '箭號' : '手寫體'} <ChevronDown size={14} />

                    {isCategoryDropdownOpen && (
                      <div className={styles.categoryDropdownMenu}>
                        <div className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); setActiveCategory('basic'); setIsCategoryDropdownOpen(false); }}>基礎數學</div>
                        <div className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); setActiveCategory('greek'); setIsCategoryDropdownOpen(false); }}>希臘字母</div>
                        <div className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); setActiveCategory('negated'); setIsCategoryDropdownOpen(false); }}>否定關係</div>
                        <div className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); setActiveCategory('letter'); setIsCategoryDropdownOpen(false); }}>似字母符號</div>
                        <div className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); setActiveCategory('arrows'); setIsCategoryDropdownOpen(false); }}>箭號</div>
                        <div className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); setActiveCategory('fonts'); setIsCategoryDropdownOpen(false); }}>手寫體</div>
                      </div>
                    )}
                  </div>
                  {renderSymbolGrid()}
                </div>
              )}
            </div>
          </div>

          <div className={styles.toolbarSection}>
            <div className={styles.structureRow}>
              <div className={styles.templateDropdownContainer}>
                <button
                  className={styles.presetBtn}
                  style={isFractionMenuOpen ? { background: '#dcf4f0', border: '1px solid #11b1ad', padding: '7px' } : { border: '1px solid transparent' }}
                  onClick={handleFractionMenuClick}
                >
                  <span className={styles.presetIcon} style={{ color: '#333' }} dangerouslySetInnerHTML={{ __html: katex.renderToString('\\frac{x}{y}', { throwOnError: false }) }} />
                  <span className={styles.presetText}>分數 <ChevronDown size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /></span>
                </button>
                {isFractionMenuOpen && (
                  <div className={styles.templateDropdown} onClick={e => e.stopPropagation()}>
                    <div className={styles.largeSymbolSubheader}>分數</div>
                    <div className={styles.templateGrid}>
                      {fractionTemplates.map((t, idx) => renderTemplateButton(t, idx, () => setIsFractionMenuOpen(false)))}
                    </div>
                    <div className={styles.largeSymbolSubheader}>常用分數</div>
                    <div className={styles.templateGrid}>
                      {commonFractions.map((t, idx) => renderTemplateButton(t, idx, () => setIsFractionMenuOpen(false)))}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.templateDropdownContainer}>
                <button
                  className={styles.presetBtn}
                  style={isScriptMenuOpen ? { background: '#dcf4f0', border: '1px solid #11b1ad', padding: '7px' } : { border: '1px solid transparent' }}
                  onClick={handleScriptMenuClick}
                >
                  <span className={styles.presetIcon} style={{ color: '#333' }} dangerouslySetInnerHTML={{ __html: katex.renderToString('e^x', { throwOnError: false }) }} />
                  <span className={styles.presetText}>上下標 <ChevronDown size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /></span>
                </button>
                {isScriptMenuOpen && (
                  <div className={styles.templateDropdown} onClick={e => e.stopPropagation()}>
                    <div className={styles.largeSymbolSubheader}>上下標</div>
                    <div className={styles.templateGrid}>
                      {scriptTemplates.map((t, idx) => renderTemplateButton(t, idx, () => setIsScriptMenuOpen(false)))}
                    </div>
                    <div className={styles.largeSymbolSubheader}>常用上下標</div>
                    <div className={styles.templateGrid}>
                      {commonScripts.map((t, idx) => renderTemplateButton(t, idx, () => setIsScriptMenuOpen(false)))}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.templateDropdownContainer}>
                <button
                  className={styles.presetBtn}
                  style={isRootMenuOpen ? { background: '#dcf4f0', border: '1px solid #11b1ad', padding: '7px' } : { border: '1px solid transparent' }}
                  onClick={handleRootMenuClick}
                >
                  <span className={styles.presetIcon} style={{ color: '#333' }} dangerouslySetInnerHTML={{ __html: katex.renderToString('\\sqrt[n]{x}', { throwOnError: false }) }} />
                  <span className={styles.presetText}>根號 <ChevronDown size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /></span>
                </button>
                {isRootMenuOpen && (
                  <div className={styles.templateDropdown} onClick={e => e.stopPropagation()}>
                    <div className={styles.largeSymbolSubheader}>根號</div>
                    <div className={styles.templateGrid}>
                      {rootTemplates.map((t, idx) => renderTemplateButton(t, idx, () => setIsRootMenuOpen(false)))}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.templateDropdownContainer}>
                <button
                  className={styles.presetBtn}
                  style={isIntegralMenuOpen ? { background: '#dcf4f0', border: '1px solid #11b1ad', padding: '7px' } : { border: '1px solid transparent' }}
                  onClick={handleIntegralMenuClick}
                >
                  <span className={styles.presetIcon} style={{ color: '#333' }} dangerouslySetInnerHTML={{ __html: katex.renderToString('\\int_{-x}^{x}', { throwOnError: false }) }} />
                  <span className={styles.presetText}>積分 <ChevronDown size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /></span>
                </button>
                {isIntegralMenuOpen && (
                  <div className={styles.templateDropdown} onClick={e => e.stopPropagation()}>
                    <div className={styles.largeSymbolSubheader}>積分</div>
                    <div className={styles.templateGrid}>
                      {integralTemplates.map((t, idx) => renderTemplateButton(t, idx, () => setIsIntegralMenuOpen(false)))}
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.templateDropdownContainer}>
                <button
                  className={styles.presetBtn}
                  style={isOperatorMenuOpen ? { background: '#dcf4f0', border: '1px solid #11b1ad', padding: '7px' } : { border: '1px solid transparent' }}
                  onClick={handleOperatorMenuClick}
                >
                  <span className={styles.presetIcon} style={{ color: '#333' }} dangerouslySetInnerHTML={{ __html: katex.renderToString('\\sum_{i=0}^{n}', { throwOnError: false }) }} />
                  <span className={styles.presetText}>大型運算子 <ChevronDown size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /></span>
                </button>
                {isOperatorMenuOpen && (
                  <div className={styles.templateDropdown} onClick={e => e.stopPropagation()}>
                    <div className={styles.largeSymbolSubheader}>總和</div>
                    <div className={styles.templateGrid}>
                      {operatorTemplates.map((t, idx) => renderTemplateButton(t, idx, () => setIsOperatorMenuOpen(false)))}
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.templateDropdownContainer}>
                <button
                  className={styles.presetBtn}
                  style={isBracketMenuOpen ? { background: '#dcf4f0', border: '1px solid #11b1ad', padding: '7px' } : { border: '1px solid transparent' }}
                  onClick={handleBracketMenuClick}
                >
                  <span className={styles.presetIcon} style={{ color: '#333' }} dangerouslySetInnerHTML={{ __html: katex.renderToString('\\{()\\}', { throwOnError: false }) }} />
                  <span className={styles.presetText}>括弧 <ChevronDown size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /></span>
                </button>
                {isBracketMenuOpen && (
                  <div className={styles.templateDropdown} onClick={e => e.stopPropagation()}>
                    <div className={styles.largeSymbolSubheader}>方括弧</div>
                    <div className={styles.templateGrid}>
                      {bracketTemplates.map((t, idx) => renderTemplateButton(t, idx, () => setIsBracketMenuOpen(false)))}
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.templateDropdownContainer}>
                <button
                  className={styles.presetBtn}
                  style={isFunctionMenuOpen ? { background: '#dcf4f0', border: '1px solid #11b1ad', padding: '7px' } : { border: '1px solid transparent' }}
                  onClick={handleFunctionMenuClick}
                >
                  <span className={styles.presetIcon} style={{ color: '#333' }} dangerouslySetInnerHTML={{ __html: katex.renderToString('\\sin \\theta', { throwOnError: false }) }} />
                  <span className={styles.presetText}>函數 <ChevronDown size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /></span>
                </button>
                {isFunctionMenuOpen && (
                  <div className={styles.templateDropdown} onClick={e => e.stopPropagation()}>
                    <div className={styles.largeSymbolSubheader}>三角函數</div>
                    <div className={styles.templateGrid}>
                      {trigFunctionTemplates.map((t, idx) => renderTemplateButton(t, idx, () => setIsFunctionMenuOpen(false)))}
                    </div>
                    <div className={styles.largeSymbolSubheader}>常用函數</div>
                    <div className={styles.templateGrid}>
                      {commonFunctionTemplates.map((t, idx) => renderTemplateButton(t, idx, () => setIsFunctionMenuOpen(false)))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className={styles.canvas}>
          <div className={styles.previewArea}>
            {latex.trim() === '' ? (
              <span className={styles.emptyPlaceholder}>請輸入或選擇公式</span>
            ) : (
              <div ref={previewRef}></div>
            )}
          </div>
          <div className={styles.editorArea}>
            <textarea
              ref={textareaRef}
              className={styles.latexInput}
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              placeholder="在此手動輸入 LaTeX (例如: \frac{a}{b})"
            />
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div style={{ flex: 1 }}></div> {/* spacer */}
          <div className={styles.actions}>
            <button className={styles.btnSave} onClick={handleSave}>儲存</button>
            <button className={styles.btnCancel} onClick={onClose}>取消</button>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <a href="https://katex.org/docs/supported.html" target="_blank" rel="noreferrer" className={styles.helpLink}>
              <HelpCircle size={16} /> 如何提供LaTeX的識別？
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MathEditorModal;
