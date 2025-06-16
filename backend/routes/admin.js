const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { verifyToken } = require('./auth');

// 视频数据文件路径
const videosFilePath = path.join(__dirname, '../data/videos.json');
const terminologyFilePath = path.join(__dirname, '../data/terminology.json');

// 管理员权限验证中间件
function verifyAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: '需要管理员权限' });
    }
    next();
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

// 写入视频数据
function writeVideos(data) {
    try {
        fs.writeFileSync(videosFilePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('写入视频数据失败:', error);
        return false;
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

// 写入术语库数据
function writeTerminology(data) {
    try {
        fs.writeFileSync(terminologyFilePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('写入术语库数据失败:', error);
        return false;
    }
}

// 获取腾讯云上传签名（仅管理员）
router.post('/upload-signature', verifyToken, verifyAdmin, async (req, res) => {
    try {
        // 这里应该调用腾讯云API获取上传签名
        // 为了演示，返回一个模拟的签名
        const signature = {
            signature: 'mock_signature_for_admin_upload',
            timestamp: Date.now()
        };
        
        res.json({
            success: true,
            signature: signature.signature
        });
    } catch (error) {
        console.error('获取上传签名失败:', error);
        res.status(500).json({ success: false, error: '获取上传签名失败' });
    }
});

// 保存视频信息（仅管理员）
router.post('/save-video', verifyToken, verifyAdmin, (req, res) => {
    try {
        const { title, description, fileId, videoUrl, coverUrl } = req.body;
        
        if (!title || !fileId || !videoUrl) {
            return res.status(400).json({ success: false, error: '缺少必要参数' });
        }
        
        const videoData = readVideos();
        
        const newVideo = {
            id: `video_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            adminId: req.user.id, // 记录上传的管理员ID
            title,
            description: description || '',
            fileId,
            videoUrl,
            coverUrl: coverUrl || '',
            uploadTime: new Date().toISOString()
        };
        
        videoData.videos.push(newVideo);
        
        if (writeVideos(videoData)) {
            res.json({
                success: true,
                message: '视频保存成功',
                video: newVideo
            });
        } else {
            res.status(500).json({ success: false, error: '保存视频失败' });
        }
    } catch (error) {
        console.error('保存视频失败:', error);
        res.status(500).json({ success: false, error: '保存视频失败' });
    }
});

// 删除视频（仅管理员）
router.delete('/video/:id', verifyToken, verifyAdmin, (req, res) => {
    try {
        const videoId = req.params.id;
        const videoData = readVideos();
        
        const videoIndex = videoData.videos.findIndex(v => v.id === videoId);
        
        if (videoIndex === -1) {
            return res.status(404).json({ success: false, error: '视频未找到' });
        }
        
        videoData.videos.splice(videoIndex, 1);
        
        if (writeVideos(videoData)) {
            res.json({
                success: true,
                message: '视频删除成功'
            });
        } else {
            res.status(500).json({ success: false, error: '删除视频失败' });
        }
    } catch (error) {
        console.error('删除视频失败:', error);
        res.status(500).json({ success: false, error: '删除视频失败' });
    }
});

// 添加术语（仅管理员）
router.post('/terminology', verifyToken, verifyAdmin, (req, res) => {
    try {
        const { chinese, english, chineseDefinition, englishDefinition } = req.body;
        
        if (!chinese || !english) {
            return res.status(400).json({ success: false, error: '中英文术语不能为空' });
        }
        
        const terminologyData = readTerminology();
        
        const newTerm = {
            id: terminologyData.terms.length > 0 ? Math.max(...terminologyData.terms.map(t => t.id)) + 1 : 1,
            chinese,
            english,
            chineseDefinition: chineseDefinition || '',
            englishDefinition: englishDefinition || ''
        };
        
        terminologyData.terms.push(newTerm);
        
        if (writeTerminology(terminologyData)) {
            res.json({
                success: true,
                message: '术语添加成功',
                term: newTerm
            });
        } else {
            res.status(500).json({ success: false, error: '添加术语失败' });
        }
    } catch (error) {
        console.error('添加术语失败:', error);
        res.status(500).json({ success: false, error: '添加术语失败' });
    }
});

// 更新术语（仅管理员）
router.put('/terminology/:id', verifyToken, verifyAdmin, (req, res) => {
    try {
        const termId = parseInt(req.params.id);
        const { chinese, english, chineseDefinition, englishDefinition } = req.body;
        
        const terminologyData = readTerminology();
        const termIndex = terminologyData.terms.findIndex(t => t.id === termId);
        
        if (termIndex === -1) {
            return res.status(404).json({ success: false, error: '术语未找到' });
        }
        
        terminologyData.terms[termIndex] = {
            ...terminologyData.terms[termIndex],
            chinese: chinese || terminologyData.terms[termIndex].chinese,
            english: english || terminologyData.terms[termIndex].english,
            chineseDefinition: chineseDefinition || terminologyData.terms[termIndex].chineseDefinition,
            englishDefinition: englishDefinition || terminologyData.terms[termIndex].englishDefinition
        };
        
        if (writeTerminology(terminologyData)) {
            res.json({
                success: true,
                message: '术语更新成功',
                term: terminologyData.terms[termIndex]
            });
        } else {
            res.status(500).json({ success: false, error: '更新术语失败' });
        }
    } catch (error) {
        console.error('更新术语失败:', error);
        res.status(500).json({ success: false, error: '更新术语失败' });
    }
});

// 删除术语（仅管理员）
router.delete('/terminology/:id', verifyToken, verifyAdmin, (req, res) => {
    try {
        const termId = parseInt(req.params.id);
        const terminologyData = readTerminology();
        
        const termIndex = terminologyData.terms.findIndex(t => t.id === termId);
        
        if (termIndex === -1) {
            return res.status(404).json({ success: false, error: '术语未找到' });
        }
        
        terminologyData.terms.splice(termIndex, 1);
        
        if (writeTerminology(terminologyData)) {
            res.json({
                success: true,
                message: '术语删除成功'
            });
        } else {
            res.status(500).json({ success: false, error: '删除术语失败' });
        }
    } catch (error) {
        console.error('删除术语失败:', error);
        res.status(500).json({ success: false, error: '删除术语失败' });
    }
});

module.exports = router;