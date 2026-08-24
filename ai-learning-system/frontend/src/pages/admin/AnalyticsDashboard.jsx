import React, { useState, useEffect } from 'react';
import styles from './AdminLogs.module.css'; // Reuse styles from AdminLogs or create new ones
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Loader2 } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899', '#f43f5e', '#14b8a6', '#f59e0b', '#3b82f6'];

const AnalyticsDashboard = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/admin/analytics/tags');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>學習弱點熱區分析</h1>
          <p className={styles.subtitle}>統計全校學生最常向 AI 導師詢問的知識點</p>
        </div>
        <button onClick={fetchData} className={styles.refreshBtn}>
          重新整理
        </button>
      </header>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
          <Loader2 className="spinner" size={40} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
        </div>
      ) : data.length === 0 ? (
        <div className={styles.emptyState}>
          <p>目前還沒有收集到足夠的問題標籤資料。</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', marginTop: '30px' }}>
          {/* 圓餅圖 */}
          <div style={{ flex: '1 1 400px', background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>知識點提問佔比</h3>
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={130}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} 次`, '提問次數']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 長條圖 */}
          <div style={{ flex: '1 1 400px', background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>Top 10 提問知識點</h3>
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <BarChart
                  data={data}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    height={80}
                  />
                  <YAxis tick={{ fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: 'transparent' }} formatter={(value) => [`${value} 次`, '提問次數']} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
