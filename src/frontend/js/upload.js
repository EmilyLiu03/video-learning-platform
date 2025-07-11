// 视频上传页面功能
class VideoUploader {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.validateForm();
    }

    // 绑定事件
    bindEvents() {
        const fileInput = document.getElementById('video-file-input');
        const titleInput = document.getElementById('video-title-input');
        const uploadBtn = document.getElementById('upload-btn');
        const cancelBtn = document.getElementById('cancel-btn');
        const fileDisplay = document.getElementById('file-input-display');
        
        // 文件选择事件
        fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });
        
        // 拖拽事件
        fileDisplay.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileDisplay.style.borderColor = 'rgba(253, 230, 21, 0.8)';
        });
        
        fileDisplay.addEventListener('dragleave', (e) => {
            e.preventDefault();
            fileDisplay.style.borderColor = 'rgba(253, 230, 21, 0.4)';
        });
        
        fileDisplay.addEventListener('drop', (e) => {
            e.preventDefault();
            fileDisplay.style.borderColor = 'rgba(253, 230, 21, 0.4)';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                this.handleFileSelect({ target: { files } });
            }
        });
        
        // 标题输入事件
        titleInput.addEventListener('input', () => {
            this.validateForm();
        });
        
        // 上传按钮事件
        uploadBtn.addEventListener('click', () => {
            this.startUpload();
        });
        
        // 取消按钮事件
        cancelBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    // 处理文件选择
    handleFileSelect(e) {
        const file = e.target.files[0];
        const fileDisplay = document.getElementById('file-input-display');
        const fileText = fileDisplay.querySelector('.file-text');
        
        if (file) {
            // 检查文件类型
            const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime'];
            if (!allowedTypes.includes(file.type)) {
                this.showError('请选择MP4、AVI或MOV格式的视频文件');
                return;
            }
            
            // 检查文件大小 (500MB)
            const maxSize = 500 * 1024 * 1024;
            if (file.size > maxSize) {
                this.showError('文件大小不能超过500MB');
                return;
            }
            
            fileText.textContent = `已选择: ${file.name} (${this.formatFileSize(file.size)})`;
            fileDisplay.classList.add('has-file');
            this.hideError();
        } else {
            fileText.textContent = '点击选择视频文件或拖拽文件到此处';
            fileDisplay.classList.remove('has-file');
        }
        
        this.validateForm();
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 验证表单 - 修复返回值问题
    validateForm() {
        const fileInput = document.getElementById('video-file-input');
        const titleInput = document.getElementById('video-title-input');
        const uploadBtn = document.getElementById('upload-btn');
        
        const hasFile = fileInput.files.length > 0;
        const hasTitle = titleInput.value.trim().length > 0;
        const isValid = hasFile && hasTitle;
        
        uploadBtn.disabled = !isValid;
        
        // 返回验证结果
        return isValid;
    }

    // 开始上传
    async startUpload() {
        // 验证表单
        if (!this.validateForm()) {
            this.showError('请填写完整的视频信息');
            return;
        }
        
        const uploadBtn = document.getElementById('upload-btn');
        const progressContainer = document.getElementById('upload-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const fileInput = document.getElementById('video-file-input');
        const titleInput = document.getElementById('video-title-input');
        const descInput = document.getElementById('video-description-input');
        const uploadForm = document.getElementById('upload-form');
        const successMessage = document.getElementById('success-message');
        
        const file = fileInput.files[0];
        const title = titleInput.value.trim();
        const description = descInput.value.trim();
        
        // 检查腾讯云SDK是否加载
        if (typeof TcVod === 'undefined') {
            this.showError('腾讯云VOD SDK未加载，请刷新页面重试');
            return;
        }
        
        console.log('TcVod SDK已加载:', TcVod);
        
        // 显示进度条
        progressContainer.style.display = 'block';
        this.hideError();
        
        // 禁用上传按钮
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> 上传中...';
        
        try {
            // 1. 获取上传签名
            progressText.textContent = '获取腾讯云上传凭证...';
            progressFill.style.width = '10%';
            console.log('开始获取上传签名');
            
            const signatureResponse = await fetch('/api/video/upload-signature', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const signatureData = await signatureResponse.json();
            console.log('签名响应:', signatureData);
            
            if (!signatureData.success) {
                throw new Error(signatureData.error || '获取上传签名失败');
            }
            
            // 2. 使用腾讯云VOD SDK上传视频
            progressText.textContent = '开始上传到腾讯云VOD...';
            progressFill.style.width = '20%';
            console.log('开始使用腾讯云SDK上传');
            
            // 创建腾讯云上传实例
            const tcVod = new TcVod.default({
                getSignature: () => {
                    console.log('SDK请求签名:', signatureData.signature);
                    return signatureData.signature;
                }
            });
            
            console.log('创建上传器实例');
            const uploader = tcVod.upload({
                mediaFile: file
            });
            
            // 监听上传进度
            uploader.on('media_progress', (info) => {
                const progress = Math.floor(info.percent * 80) + 20; // 20-100%
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `上传到腾讯云VOD... ${Math.floor(info.percent * 100)}%`;
                console.log('上传进度:', Math.floor(info.percent * 100) + '%');
            });
            
            // 监听上传错误
            uploader.on('media_upload_error', (error) => {
                console.error('腾讯云上传错误:', error);
                throw new Error('腾讯云上传失败: ' + error.message);
            });
            
            // 等待上传完成
            console.log('等待上传完成...');
            const result = await uploader.done();
            console.log('腾讯云上传完成，结果:', result);
            
            // 3. 保存视频信息到后端
            progressText.textContent = '保存视频信息...';
            progressFill.style.width = '95%';
            
            const userId = localStorage.getItem('userId') || 'anonymous_user';
            const videoUrl = result.video && result.video.url ? result.video.url.trim() : null;
            const fileId = result.fileId;
            
            console.log('提取的视频信息:', { fileId, videoUrl, userId, title, description });
            
            if (!fileId || !videoUrl) {
                throw new Error('腾讯云上传结果缺少必要信息');
            }
            
            const saveResponse = await fetch('/api/video/save-video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    title,
                    description,
                    fileId,
                    videoUrl
                })
            });
            
            const saveData = await saveResponse.json();
            console.log('保存响应:', saveData);
            
            if (saveData.success) {
                progressText.textContent = '上传完成！';
                progressFill.style.width = '100%';
                
                console.log('视频上传和保存成功:', saveData.video);
                
                // 显示成功消息
                uploadForm.style.display = 'none';
                successMessage.style.display = 'block';
                
                // 跳转到视频播放页面
                setTimeout(() => {
                    window.location.href = `player.html?id=${saveData.video.id}`;
                }, 2000);
            } else {
                throw new Error(saveData.error || '保存视频信息失败');
            }
            
        } catch (error) {
            console.error('上传失败:', error);
            this.showError(`上传失败: ${error.message}`);
            progressFill.style.backgroundColor = '#ff4444';
            
            // 恢复上传按钮
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<span class="material-icons">publish</span> 重新上传';
        }
    }

    // 显示错误信息
    showError(message) {
        const errorElement = document.getElementById('error-message');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    // 隐藏错误信息
    hideError() {
        const errorElement = document.getElementById('error-message');
        errorElement.style.display = 'none';
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new VideoUploader();
});