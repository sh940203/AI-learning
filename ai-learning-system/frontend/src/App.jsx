import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingLayout from './layouts/LandingLayout';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Disclaimer from './pages/Disclaimer';
import Dashboard from './pages/Dashboard';
import AILearning from './pages/AILearning';
import Tests from './pages/Tests';
import ErrorAnalysis from './pages/ErrorAnalysis';
import TakeExam from './pages/TakeExam';
import Performance from './pages/admin/Performance';
import QuestionBankManager from './pages/admin/QuestionBankManager';
import QuestionBank from './pages/admin/QuestionBank';
import ExamSetup from './pages/admin/ExamSetup';
import Announcements from './pages/admin/Announcements';
import KnowledgeBaseManager from './pages/admin/KnowledgeBaseManager';
import UnansweredLogs from './pages/admin/UnansweredLogs';
import './index.css';

const DummyPage = ({ title }) => (
  <div style={{ padding: '24px', backgroundColor: 'var(--color-bg-main)', height: '100%', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
    <h2>{title}</h2>
    <p style={{ marginTop: '16px', color: 'var(--color-text-muted)' }}>這是 {title} 的預覽內容區塊。</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Landing 首頁路由 */}
          <Route path="/" element={<LandingLayout />}>
            <Route index element={<Home />} />
          </Route>

          {/* 獨立全螢幕路由 (Login, Disclaimer 等) */}
          <Route path="/login" element={<Login />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/tests/take/:examId" element={<TakeExam />} />

          {/* 學生端路由 */}
          <Route path="/" element={<MainLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="ai-learning" element={<AILearning />} />
            <Route path="tests" element={<Tests />} />
            <Route path="error-analysis" element={<ErrorAnalysis />} />
            <Route path="settings" element={<DummyPage title="個人設定" />} />
          </Route>

          {/* 管理者端路由 */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Performance />} />
            <Route path="questions" element={<QuestionBankManager />} />
            <Route path="questions/edit" element={<QuestionBank />} />
            <Route path="questions/exam/new" element={<ExamSetup />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="knowledge" element={<KnowledgeBaseManager />} />
            <Route path="logs/unanswered" element={<UnansweredLogs />} />
            <Route path="settings" element={<DummyPage title="系統設定" />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;


