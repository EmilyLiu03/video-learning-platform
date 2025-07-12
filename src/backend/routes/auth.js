const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 用户数据文件路径
const usersFilePath = path.join(__dirname, '../data/users.json');

// 确保数据目录和文件存在
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, JSON.stringify({ users: [] }), 'utf8');
}

// 读取用户数据
function readUsers() {
    try {
        const data = fs.readFileSync(usersFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取用户数据失败:', error);
        return { users: [] };
    }
}

// 写入用户数据
function writeUsers(data) {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('写入用户数据失败:', error);
        return false;
    }
}

// 注册新用户
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, error: '用户名和密码不能为空' });
        }
        
        const userData = readUsers();
        
        // 检查用户名是否已存在
        if (userData.users.some(user => user.username === username)) {
            return res.status(400).json({ success: false, error: '用户名已存在' });
        }
        
        // 加密密码
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // 创建新用户
        const newUser = {
            id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            username,
            password: hashedPassword,
            role: 'user', // 默认角色为普通用户
            createdAt: new Date().toISOString()
        };
        
        userData.users.push(newUser);
        
        if (writeUsers(userData)) {
            // 创建JWT令牌
            const token = jwt.sign(
                { id: newUser.id, username: newUser.username, role: newUser.role },
                'your_jwt_secret', // 在实际应用中应使用环境变量
                { expiresIn: '24h' }
            );
            
            return res.status(201).json({
                success: true,
                message: '注册成功',
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    role: newUser.role
                },
                token
            });
        } else {
            return res.status(500).json({ success: false, error: '保存用户数据失败' });
        }
    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({ success: false, error: '服务器错误' });
    }
});

// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, error: '用户名和密码不能为空' });
        }
        
        const userData = readUsers();
        const user = userData.users.find(user => user.username === username);
        
        if (!user) {
            return res.status(400).json({ success: false, error: '用户名或密码错误' });
        }
        
        // 验证密码
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(400).json({ success: false, error: '用户名或密码错误' });
        }
        
        // 创建JWT令牌
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            'your_jwt_secret', // 在实际应用中应使用环境变量
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            message: '登录成功',
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            },
            token
        });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ success: false, error: '服务器错误' });
    }
});

// 验证令牌中间件
function verifyToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, error: '未提供访问令牌' });
    }
    
    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, error: '无效的令牌' });
    }
}

// 获取当前用户信息
router.get('/me', verifyToken, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

module.exports = { router, verifyToken };