// backend/constants/categories.js 

const EXAM_CATEGORIES = {
  high_school: {
    label: '普通高中 (學測/分科)',
    subjects: [
      { id: 'chi_1', label: '國文(一) - 國綜' },
      { id: 'chi_2', label: '國文(二) - 國寫' },
      { id: 'eng', label: '英文考科' },
      { id: 'math_a', label: '數學A考科' },
      { id: 'math_b', label: '數學B考科' },
      { id: 'soc', label: '社會考科 (史/地/公)' },
      { id: 'sci', label: '自然考科 (物/化/生/地)' }
    ]
  },
  vocational: {
    label: '技術型高中 (高職統測/證照)',
    subjects: [
      { id: 'v_chi', label: '國文' },
      { id: 'v_eng', label: '英文' },
      { id: 'v_math_a', label: '數學(A)' },
      { id: 'v_math_b', label: '數學(B)' },
      { id: 'v_math_c', label: '數學(C)' },
      { id: 'v_business_1', label: '商管群-專一(商概/計概)' },
      { id: 'v_business_2', label: '商管群-專二(會計/經濟)' },
      { id: 'v_engineering_1', label: '電機電子群-專一' },
      { id: 'v_engineering_2', label: '電機電子群-專二' },
      // 可無限往下補充
    ]
  }
};

module.exports = { EXAM_CATEGORIES };
