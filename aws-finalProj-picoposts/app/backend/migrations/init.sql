CREATE TABLE IF NOT EXISTS users (
                                     userId VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );


CREATE TABLE IF NOT EXISTS posts (
                                     postId VARCHAR(36) PRIMARY KEY,
    userId VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );


CREATE INDEX IF NOT EXISTS idx_posts_user_createdAt ON posts (userId, createdAt);