const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { verifyToken } = require('./auth');

// 视频数据文件路径
const videosFilePath = path.join(__dirname, '../data/videos.json');
const terminologyFilePath = path.join(__dirname, '../data/terminology.json');

// 确保数据目录和文件存在
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(videosFilePath)) {
    fs.writeFileSync(videosFilePath, JSON.stringify({ videos: [] }), 'utf8');
}

if (!fs.existsSync(terminologyFilePath)) {
    // 创建示例术语库
    const sampleTerminology = {
        terms: [
            {
                id: 1,
                chinese: "人工智能",
                english: "Artificial Intelligence",
                chineseDefinition: "由人制造出来的机器所表现出来的智能",
                englishDefinition: "Intelligence demonstrated by machines"
            },
            {
                id: 2,
                chinese: "机器学习",
                english: "Machine Learning",
                chineseDefinition: "一种实现人工智能的方法，通过算法让计算机从数据中学习",
                englishDefinition: "A method of achieving artificial intelligence through algorithms that enable computers to learn from data"
            },
            {
                id: 3,
                chinese: "深度学习",
                english: "Deep Learning",
                chineseDefinition: "机器学习的一个分支，使用多层神经网络进行学习",
                englishDefinition: "A subset of machine learning that uses multi-layered neural networks for learning"
            }
        ]
    };
    fs.writeFileSync(terminologyFilePath, JSON.stringify(sampleTerminology, null, 2), 'utf8');
}

// 读取视频数据
function readVideos() {
    try {
        const data = fs.readFileSync(videosFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取视频数据失败:', error);
        return { videos: [] };
    }
}

// 读取术语库数据
function readTerminology() {
    try {
        const data = fs.readFileSync(terminologyFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取术语库数据失败:', error);
        return { terms: [] };
    }
}

// 获取所有视频列表（首页展示）
router.get('/list', (req, res) => {
    try {
        const videoData = readVideos();
        
        // 返回视频列表，按上传时间倒序排列
        const sortedVideos = videoData.videos.sort((a, b) => 
            new Date(b.uploadTime) - new Date(a.uploadTime)
        );
        
        res.json({
            success: true,
            videos: sortedVideos
        });
    } catch (error) {
        console.error('获取视频列表失败:', error);
        res.status(500).json({ success: false, error: '获取视频列表失败' });
    }
});

// 根据ID获取单个视频信息
router.get('/:id', (req, res) => {
    try {
        const videoId = req.params.id;
        const videoData = readVideos();
        
        const video = videoData.videos.find(v => v.id === videoId);
        
        if (!video) {
            return res.status(404).json({ success: false, error: '视频未找到' });
        }
        
        res.json({
            success: true,
            video: video
        });
    } catch (error) {
        console.error('获取视频信息失败:', error);
        res.status(500).json({ success: false, error: '获取视频信息失败' });
    }
});

// 获取术语库
router.get('/terminology/list', (req, res) => {
    try {
        const terminologyData = readTerminology();
        
        res.json({
            success: true,
            terms: terminologyData.terms
        });
    } catch (error) {
        console.error('获取术语库失败:', error);
        res.status(500).json({ success: false, error: '获取术语库失败' });
    }
});

// 搜索视频
router.get('/search/:keyword', (req, res) => {
    try {
        const keyword = req.params.keyword.toLowerCase();
        const videoData = readVideos();
        
        const filteredVideos = videoData.videos.filter(video => 
            video.title.toLowerCase().includes(keyword) ||
            (video.description && video.description.toLowerCase().includes(keyword))
        );
        
        res.json({
            success: true,
            videos: filteredVideos
        });
    } catch (error) {
        console.error('搜索视频失败:', error);
        res.status(500).json({ success: false, error: '搜索视频失败' });
    }
});

module.exports = router;