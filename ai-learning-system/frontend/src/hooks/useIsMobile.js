import { useEffect, useState } from 'react';

// 手機版斷點：與各 CSS Module 中的 @media (max-width: 768px) 保持一致
export const MOBILE_QUERY = '(max-width: 768px)';

// 監聽視窗寬度，回傳目前是否為手機版版面
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const handleChange = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
};

export default useIsMobile;
