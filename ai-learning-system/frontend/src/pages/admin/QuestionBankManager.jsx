import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, FileText, Plus, MoreVertical, Edit2, Trash2, ChevronRight, Download, CornerUpLeft } from 'lucide-react';
import styles from './QuestionBankManager.module.css';

const QuestionBankManager = () => {
  const navigate = useNavigate();
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folderPath, setFolderPath] = useState([{ id: null, name: '全部' }]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [actionMenuId, setActionMenuId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, item: null });
  const [renameFolder, setRenameFolder] = useState({ show: false, item: null, name: '' });

  // Dummy data fetch to simulate API (replace with real fetch later)
  const fetchResources = async (folderId) => {
    setLoading(true);
    try {
      const url = folderId ? `/api/folders?parentId=${folderId}` : '/api/folders';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setResources(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch resources', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources(currentFolderId);
  }, [currentFolderId]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName, parentId: currentFolderId })
      });
      const data = await res.json();
      if (data.success) {
        setResources([data.data, ...resources]);
      }
    } catch (err) {
      console.error(err);
    }
    setNewFolderName('');
    setShowNewFolderModal(false);
    setShowAddMenu(false);
  };

  const handleCreateExam = async () => {
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '未命名題庫', folderId: currentFolderId })
      });
      const data = await res.json();
      if (data.success) {
        setResources([data.data, ...resources]);
      }
    } catch (err) {
      console.error(err);
    }
    setShowAddMenu(false);
  };

  const handleItemClick = (item) => {
    if (item.type === 'folder') {
      setCurrentFolderId(item._id);
      setFolderPath([...folderPath, { id: item._id, name: item.name }]);
    } else {
      // 點擊考卷檔案：如果已經有設定過科目，直接進入編輯器；否則進入基本設定
      const hasConfig = item.subject && item.examCategory;
      if (hasConfig) {
        navigate(`/admin/questions/edit`, { state: { examConfig: item } });
      } else {
        navigate(`/admin/questions/exam/new`, { state: { examId: item._id, title: item.title } });
      }
    }
  };

  const goUpFolder = () => {
    if (folderPath.length <= 1) return;
    const newPath = folderPath.slice(0, -1);
    setFolderPath(newPath);
    setCurrentFolderId(newPath[newPath.length - 1].id);
  };

  const handleDeleteClick = (item) => {
    setDeleteConfirm({ show: true, item });
    setActionMenuId(null);
  };

  const confirmDelete = async () => {
    try {
      const { _id, type } = deleteConfirm.item;
      const endpoint = type === 'folder' ? `/api/folders/${_id}` : `/api/exams/${_id}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setResources(resources.filter(r => r._id !== _id));
      }
    } catch (err) {
      console.error(err);
    }
    setDeleteConfirm({ show: false, item: null });
  };

  const handleEditClick = (item) => {
    setActionMenuId(null);
    if (item.type === 'folder') {
      setRenameFolder({ show: true, item, name: item.name });
    } else {
      handleItemClick(item);
    }
  };

  const confirmRenameFolder = async () => {
    if (!renameFolder.name.trim()) return;
    try {
      const res = await fetch(`/api/folders/${renameFolder.item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameFolder.name })
      });
      const data = await res.json();
      if (data.success) {
        setResources(resources.map(r => r._id === renameFolder.item._id ? { ...r, name: renameFolder.name } : r));
      }
    } catch (err) {
      console.error(err);
    }
    setRenameFolder({ show: false, item: null, name: '' });
  };

  return (
    <div className={styles.container}>
      {/* 頂部導航與搜尋 */}
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          {folderPath.length > 1 && (
            <button className={styles.goUpBtn} onClick={goUpFolder}>
              <CornerUpLeft size={16} /> 返回上一層
            </button>
          )}
          {folderPath.map((crumb, idx) => (
            <span key={crumb.id || 'root'} className={styles.crumbItem}>
              {idx > 0 && <span className={styles.crumbSeparator}>|</span>}
              <span 
                className={idx === folderPath.length - 1 ? styles.crumbActive : styles.crumbLink}
                onClick={() => {
                  const newPath = folderPath.slice(0, idx + 1);
                  setFolderPath(newPath);
                  setCurrentFolderId(crumb.id);
                }}
              >
                {crumb.name}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* 操作列 */}
      <div className={styles.actionBar}>
        <div className={styles.actionLeft}>
          <div className={styles.addMenuContainer}>
            <button className={styles.addBtn} onClick={() => setShowAddMenu(!showAddMenu)}>
              <Plus size={16} /> 新增
            </button>
            {showAddMenu && (
              <div className={styles.dropdownMenu}>
                <button className={styles.dropdownItem} onClick={() => setShowNewFolderModal(true)}>資料夾</button>
                <button className={styles.dropdownItem} onClick={handleCreateExam}>測驗題庫</button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.actionRight}>
          <div className={styles.filterGroup}>
            <span>類型: <span className={styles.filterActive}>全部 ▾</span></span>
          </div>
          <div className={styles.searchBox}>
            <input type="text" placeholder="關鍵字" className={styles.searchInput} />
            <button className={styles.searchBtn}>查詢</button>
          </div>
        </div>
      </div>

      {/* 檔案列表 */}
      <div className={styles.fileList}>
        <div className={styles.listHeader}>
          <div className={styles.colCheck}><input type="checkbox" /></div>
          <div className={styles.colName}>資源名稱 ↕</div>
          <div className={styles.colDate}>最後修改時間 ↕</div>
          <div className={styles.colType}>類型 ↕</div>
          <div className={styles.colCount}>題目數 ↕</div>
          <div className={styles.colActions}></div>
        </div>

        {loading ? (
          <div className={styles.loadingState}>載入中...</div>
        ) : resources.length === 0 ? (
          <div className={styles.emptyState}>
            <Folder size={64} color="#06b6d4" strokeWidth={1} />
            <p>還沒有題庫，新增一個屬於自己的題庫吧</p>
            <div className={styles.emptyActions}>
              <button className={styles.outlineBtn} onClick={handleCreateExam}>新增測驗題庫</button>
            </div>
            <div className={styles.emptyHint}>
              <strong>題庫是什麼？</strong>
              <p>你可在題庫新增試題，未來發布線上測驗時可直接由題庫抽選題目加入試卷，重複利用這些試題。</p>
            </div>
          </div>
        ) : (
          resources.map(item => (
            <div key={item._id} className={styles.listItem}>
              <div className={styles.colCheck}><input type="checkbox" /></div>
              <div className={styles.colName} onClick={() => handleItemClick(item)}>
                {item.type === 'folder' ? <Folder size={20} color="#f59e0b" className={styles.icon} /> : <FileText size={20} color="#f97316" className={styles.icon} />}
                <span className={styles.itemName}>{item.name || item.title}</span>
              </div>
              <div className={styles.colDate}>{new Date(item.updatedAt).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '.')}</div>
              <div className={styles.colType}>{item.type === 'folder' ? '資料夾' : '測驗題庫'}</div>
              <div className={styles.colCount}>{item.type === 'exam' ? (item.questions?.length || 0) : '-'}</div>
              <div className={styles.colActions}>
                <div className={styles.actionIcons}>
                  <div className={styles.moreMenuContainer}>
                    <button className={styles.iconBtn} onClick={() => setActionMenuId(actionMenuId === item._id ? null : item._id)}>
                      <MoreVertical size={16} />
                    </button>
                    {actionMenuId === item._id && (
                      <div className={styles.dropdownMenuRight}>
                        <button className={styles.dropdownItem} onClick={() => handleEditClick(item)}>編輯</button>
                        <button className={`${styles.dropdownItem} ${styles.dangerText}`} onClick={() => handleDeleteClick(item)}>刪除</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 新增資料夾 Modal */}
      {showNewFolderModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>新增資料夾</h3>
            <input 
              type="text" 
              className={styles.modalInput} 
              placeholder="資料夾名稱" 
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
            />
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowNewFolderModal(false)}>取消</button>
              <button className={styles.confirmBtn} onClick={handleCreateFolder}>確定</button>
            </div>
          </div>
        </div>
      )}

      {/* 刪除確認 Modal */}
      {deleteConfirm.show && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>刪除確認</h3>
            <p>確定要刪除「{deleteConfirm.item.name || deleteConfirm.item.title}」嗎？刪除後將無法復原。</p>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setDeleteConfirm({ show: false, item: null })}>取消</button>
              <button className={`${styles.confirmBtn} ${styles.dangerBtn}`} onClick={confirmDelete}>確定刪除</button>
            </div>
          </div>
        </div>
      )}

      {/* 重新命名資料夾 Modal */}
      {renameFolder.show && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>編輯資料夾</h3>
            <input 
              type="text" 
              className={styles.modalInput} 
              placeholder="資料夾名稱" 
              value={renameFolder.name}
              onChange={(e) => setRenameFolder({ ...renameFolder, name: e.target.value })}
              autoFocus
            />
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setRenameFolder({ show: false, item: null, name: '' })}>取消</button>
              <button className={styles.confirmBtn} onClick={confirmRenameFolder}>確定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBankManager;
