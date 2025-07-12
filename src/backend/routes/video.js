const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 腾讯云配置信息（从环境变量读取）
const tencentConfig = {
    appId: process.env.TENCENT_APP_ID,
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY
};

// 验证环境变量是否已设置
if (!tencentConfig.appId || !tencentConfig.secretId || !tencentConfig.secretKey) {
    console.warn('警告：腾讯云配置环境变量未设置。视频上传功能将不可用。请检查.env文件中的TENCENT_APP_ID、TENCENT_SECRET_ID和TENCENT_SECRET_KEY');
}

// 腾讯云签名生成类（基于官方Java代码转换）
class TencentSignature {
    constructor(secretId, secretKey) {
        this.secretId = secretId;
        this.secretKey = secretKey;
        this.currentTime = Math.floor(Date.now() / 1000);
        this.random = Math.floor(Math.random() * Math.pow(2, 31));
        this.signValidDuration = 3600 * 24 * 2; // 签名有效期：2天
    }
    
    // 生成上传签名
    getUploadSignature() {
        try {
            // 生成原始参数字符串
            const endTime = this.currentTime + this.signValidDuration;
            let contextStr = '';
            contextStr += `secretId=${encodeURIComponent(this.secretId)}`;
            contextStr += `&currentTimeStamp=${this.currentTime}`;
            contextStr += `&expireTime=${endTime}`;
            contextStr += `&random=${this.random}`;
            
            console.log('签名原始字符串:', contextStr);
            
            // 使用HMAC-SHA1算法生成签名
            const hmac = crypto.createHmac('sha1', this.secretKey);
            hmac.update(contextStr, 'utf8');
            const hash = hmac.digest();
            
            // 将hash和原始字符串合并
            const contextBuffer = Buffer.from(contextStr, 'utf8');
            const sigBuf = Buffer.concat([hash, contextBuffer]);
            
            // Base64编码
            let signature = sigBuf.toString('base64');
            signature = signature.replace(/\s/g, ''); // 移除空格、换行符等
            
            console.log('生成的签名:', signature);
            return signature;
            
        } catch (error) {
            console.error('签名生成失败:', error);
            throw error;
        }
    }
}

// 数据文件路径
const dataFilePath = path.join(__dirname, '../data/videos.json');

// 读取视频数据
function readVideos() {
    try {
        if (fs.existsSync(dataFilePath)) {
            const data = fs.readFileSync(dataFilePath, 'utf8');
            const jsonData = JSON.parse(data);
            // 如果数据结构是 {videos: [...]}，返回videos数组
            if (jsonData.videos && Array.isArray(jsonData.videos)) {
                return jsonData.videos;
            }
            // 如果数据结构直接是数组，直接返回
            if (Array.isArray(jsonData)) {
                return jsonData;
            }
            // 其他情况返回空数组
            return [];
        }
        return [];
    } catch (error) {
        console.error('读取视频数据失败:', error);
        return [];
    }
}

// 写入视频数据
function writeVideos(videos) {
    try {
        const dataDir = path.dirname(dataFilePath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        // 保持原有的数据结构格式 {videos: [...]}
        const dataToWrite = {
            videos: videos
        };
        fs.writeFileSync(dataFilePath, JSON.stringify(dataToWrite, null, 2));
    } catch (error) {
        console.error('写入视频数据失败:', error);
        throw error;
    }
}

// 获取腾讯云上传签名
router.post('/upload-signature', (req, res) => {
    try {
        console.log('收到上传签名请求');
        
        // 检查腾讯云配置是否可用
        if (!tencentConfig.appId || !tencentConfig.secretId || !tencentConfig.secretKey) {
            return res.json({
                success: false,
                error: '腾讯云配置未设置，视频上传功能不可用'
            });
        }
        
        // 创建签名生成器
        const signature = new TencentSignature(
            tencentConfig.secretId,
            tencentConfig.secretKey
        );
        
        // 生成签名
        const uploadSignature = signature.getUploadSignature();
        
        console.log('签名生成成功');
        
        res.json({
            success: true,
            signature: uploadSignature,
            appId: tencentConfig.appId
        });
        
    } catch (error) {
        console.error('生成上传签名失败:', error);
        res.json({
            success: false,
            error: '生成上传签名失败: ' + error.message
        });
    }
});

// 保存用户上传的视频信息
router.post('/save-video', (req, res) => {
    try {
        const { userId, title, description, fileId, videoUrl, coverUrl } = req.body;
        
        console.log('保存视频信息请求:', { userId, title, description, fileId, videoUrl, coverUrl });
        
        if (!userId || !title || !fileId || !videoUrl) {
            return res.json({
                success: false,
                error: '缺少必要参数'
            });
        }
        
        // 创建视频数据对象
        const videoData = {
            id: Date.now().toString(),
            userId,
            title,
            description: description || '',
            fileId,
            videoUrl,
            coverUrl: coverUrl || '', // 添加封面URL支持
            uploadDate: new Date().toISOString(),
            uploadTime: new Date().toISOString(), // 兼容前端的uploadTime字段
            source: 'tencent_vod' // 标记为腾讯云VOD上传
        };
        
        // 读取现有视频数据
        const videos = readVideos();
        videos.push(videoData);
        
        // 保存视频数据
        writeVideos(videos);
        
        console.log('视频信息保存成功:', videoData);
        
        res.json({
            success: true,
            message: '视频信息保存成功',
            video: videoData
        });
        
    } catch (error) {
        console.error('保存视频信息失败:', error);
        res.json({
            success: false,
            error: '保存视频信息失败: ' + error.message
        });
    }
});

// 获取视频列表
router.get('/list', (req, res) => {
    try {
        const videos = readVideos();
        
        // 按上传时间倒序排列
        videos.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        
        res.json({
            success: true,
            videos: videos
        });
        
    } catch (error) {
        console.error('获取视频列表失败:', error);
        res.json({
            success: false,
            error: '获取视频列表失败: ' + error.message
        });
    }
});

// 获取单个视频信息
router.get('/:id', (req, res) => {
    try {
        const videoId = req.params.id;
        const videos = readVideos();
        
        const video = videos.find(v => v.id === videoId);
        
        if (video) {
            res.json({
                success: true,
                video: video
            });
        } else {
            res.json({
                success: false,
                error: '视频不存在'
            });
        }
        
    } catch (error) {
        console.error('获取视频信息失败:', error);
        res.json({
            success: false,
            error: '获取视频信息失败: ' + error.message
        });
    }
});

module.exports = router;