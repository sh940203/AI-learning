const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// 載入環境變數
dotenv.config({ path: path.join(__dirname, '../.env') });

const AIChatSession = require('../models/AIChatSession');

async function runMigration() {
  if (!process.env.MONGODB_URI) {
    console.error('⚠️ 請在 .env 中設定 MONGODB_URI');
    process.exit(1);
  }

  try {
    console.log('🔄 連接至 MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ 連接成功');

    console.log('🔍 開始搜尋沒有 deviceId 的 AIChatSession...');
    
    // 找出沒有 deviceId 的記錄
    const sessions = await AIChatSession.find({ deviceId: { $exists: false } });
    
    if (sessions.length === 0) {
      console.log('✅ 所有記錄都已有 deviceId，無需轉換。');
    } else {
      console.log(`⚠️ 發現 ${sessions.length} 筆需要轉換的紀錄。`);
      
      let count = 0;
      for (const session of sessions) {
        // mongoose 中未定義在 schema 的欄位，可用 session.get('userId') 取得
        const oldUserId = session.get('userId');
        
        if (oldUserId) {
          session.deviceId = `legacy-${oldUserId}`;
        } else {
          session.deviceId = `legacy-unknown-${session._id}`;
        }
        
        await session.save();
        count++;
      }
      console.log(`✅ 成功轉換 ${count} 筆紀錄。`);
    }

  } catch (error) {
    console.error('❌ 遷移失敗:', error);
  } finally {
    mongoose.disconnect();
    console.log('👋 斷開資料庫連接');
    process.exit(0);
  }
}

runMigration();
