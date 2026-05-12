-- 這是資料庫結構定義的佔位檔案 (Placeholder)
-- 實際的 CREATE TABLE 語句可以依據 UML 類別圖建立在此

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_info TEXT,
    agreed_to_terms BOOLEAN DEFAULT FALSE,
    role ENUM('student', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
