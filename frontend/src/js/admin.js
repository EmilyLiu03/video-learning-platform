// 管理员页面功能

// 全局变量
let currentEditingTermId = null;
let allTerms = [];

// DOM元素
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const videoUploadForm = document.getElementById('video-upload-form');
const fileUploadArea = document.getElementById('file-upload-area');
const videoFileInput = document.getElementById('video-file');
const progressContainer = document.getElementById('progress-container');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const uploadStatus = document.getElementById('upload-status');
const termForm = document.getElementById('term-form');
const termsList = document.getElementById('terms-list');
const cancelEditBtn = document.getElementById('cancel-edit');
const adminUsername = document.getElementById('admin-username');
const logoutBtn = document.getElementById('logout-btn');

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查管理员权限
    if (!checkPageAccess('admin')) {
        return;
    }
    
    initializeAdminPage();
});

// 初始化管理员页面
function initializeAdminPage() {
    // 显示管理员用户名
    const currentUser = getCurrentUser();
    adminUsername.textContent = `管理员：${currentUser.username}`;
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 加载术语库
    loadTerminology();
}

// 绑定事件监听器
function bindEventListeners() {
    // 标签页切换
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // 文件上传区域
    fileUploadArea.addEventListener('click', () => {
        videoFileInput.click();
    });
    
    fileUploadArea.addEventListener('dragover', handleDragOver);
    fileUploadArea.addEventListener('drop', handleFileDrop);
    
    videoFileInput.addEventListener('change', handleFileSelect);
    
    // 视频上传表单
    videoUploadForm.addEventListener('submit', handleVideoUpload);
    
    // 术语表单
    termForm.addEventListener('submit', handleTermSubmit);
    
    // 取消编辑按钮
    cancelEditBtn.addEventListener('click', cancelTermEdit);
    
    // 退出登录
    logoutBtn.addEventListener('click', logout);
}

// 切换标签页
function switchTab(tabId) {
    // 更新标签按钮状态
    tabBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        }
    });
    
    // 更新标签内容显示
    tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tabId) {
            content.classList.add('active');
        }
    });
}

// 处理拖拽悬停
function handleDragOver(e) {
    e.preventDefault();
    fileUploadArea.classList.add('dragover');
}

// 处理文件拖拽放置
function handleFileDrop(e) {
    e.preventDefault();
    fileUploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        videoFileInput.files = files;
        handleFileSelect();
    }
}

// 处理文件选择
function handleFileSelect() {
    const file = videoFileInput.files[0];
    if (file) {
        const fileName = file.name;
        const fileSize = (file.size / (1024 * 1024)).toFixed(2);
        fileUploadArea.innerHTML = `
            <span class="material-icons" style="font-size: 48px; color: #28a745;">check_circle</span>
            <p>已选择文件：${fileName}</p>
            <p>文件大小：${fileSize} MB</p>
            <button type="button" class="btn" onclick="clearFileSelection()">重新选择</button>
        `;
    }
}

// 清除文件选择
function clearFileSelection() {
    videoFileInput.value = '';
    fileUploadArea.innerHTML = `
        <span class="material-icons" style="font-size: 48px; color: #ccc;">cloud_upload</span>
        <p>拖拽视频文件到此处或点击选择文件</p>
        <button type="button" class="btn btn-primary" onclick="document.getElementById('video-file').click()">选择文件</button>
    `;
}

// 处理视频上传
async function handleVideoUpload(e) {
    e.preventDefault();
    
    const title = document.getElementById('video-title').value.trim();
    const description = document.getElementById('video-description').value.trim();
    const coverUrl = document.getElementById('video-cover').value.trim();
    const file = videoFileInput.files[0];
    
    if (!title || !file) {
        showUploadStatus('请填写视频标题并选择视频文件', 'error');
        return;
    }
    
    try {
        // 显示进度条
        progressContainer.style.display = 'block';
        showUploadStatus('正在上传视频...', 'info');
        
        // 模拟上传进度（实际应用中应该使用真实的上传进度）
        simulateUploadProgress();
        
        // 获取上传签名
        const signatureResponse = await authenticatedFetch('/api/admin/upload-signature', {
            method: 'POST'
        });
        
        const signatureData = await signatureResponse.json();
        
        if (!signatureData.success) {
            throw new Error(signatureData.error || '获取上传签名失败');
        }
        
        // 模拟上传到腾讯云（实际应用中应该使用腾讯云SDK）
        await simulateVideoUpload(file);
        
        // 保存视频信息
        const videoData = {
            title,
            description,
            coverUrl,
            fileId: `file_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            videoUrl: `https://example.com/video/${Date.now()}.mp4` // 模拟视频URL
        };
        
        const saveResponse = await authenticatedFetch('/api/admin/save-video', {
            method: 'POST',
            body: JSON.stringify(videoData)
        });
        
        const saveResult = await saveResponse.json();
        
        if (saveResult.success) {
            showUploadStatus('视频上传成功！', 'success');
            resetUploadForm();
        } else {
            throw new Error(saveResult.error || '保存视频信息失败');
        }
        
    } catch (error) {
        console.error('上传失败:', error);
        showUploadStatus(`上传失败: ${error.message}`, 'error');
    } finally {
        progressContainer.style.display = 'none';
    }
}

// 模拟上传进度
function simulateUploadProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
        }
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${Math.floor(progress)}%`;
    }, 200);
}

// 模拟视频上传
function simulateVideoUpload(file) {
    return new Promise((resolve) => {
        setTimeout(resolve, 2000); // 模拟2秒上传时间
    });
}

// 重置上传表单
function resetUploadForm() {
    videoUploadForm.reset();
    clearFileSelection();
    progressFill.style.width = '0%';
    progressText.textContent = '0%';
}

// 显示上传状态
function showUploadStatus(message, type) {
    uploadStatus.textContent = message;
    uploadStatus.className = type === 'success' ? 'success-message' : 
                            type === 'error' ? 'error-message' : 'info-message';
    uploadStatus.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            uploadStatus.style.display = 'none';
        }, 3000);
    }
}

// 加载术语库
async function loadTerminology() {
    try {
        const response = await fetch('/api/video/terminology/list');
        const data = await response.json();
        
        if (data.success) {
            allTerms = data.terms;
            renderTermsList();
        } else {
            console.error('加载术语库失败:', data.error);
        }
    } catch (error) {
        console.error('加载术语库失败:', error);
    }
}

// 渲染术语列表
function renderTermsList() {
    termsList.innerHTML = '';
    
    if (allTerms.length === 0) {
        termsList.innerHTML = '<p>暂无术语数据</p>';
        return;
    }
    
    allTerms.forEach(term => {
        const termElement = createTermElement(term);
        termsList.appendChild(termElement);
    });
}

// 创建术语元素
function createTermElement(term) {
    const termDiv = document.createElement('div');
    termDiv.className = 'term-item-admin';
    
    termDiv.innerHTML = `
        <div class="term-info">
            <div class="term-header">
                <span class="term-id">#${term.id}</span>
                <strong>${term.chinese} / ${term.english}</strong>
            </div>
            <div class="term-definitions">
                ${term.chineseDefinition ? `<p><strong>中文释义：</strong>${term.chineseDefinition}</p>` : ''}
                ${term.englishDefinition ? `<p><strong>英文释义：</strong>${term.englishDefinition}</p>` : ''}
            </div>
        </div>
        <div class="term-actions">
            <button class="btn btn-small btn-edit" onclick="editTerm(${term.id})">编辑</button>
            <button class="btn btn-small btn-delete" onclick="deleteTerm(${term.id})">删除</button>
        </div>
    `;
    
    return termDiv;
}

// 处理术语表单提交
async function handleTermSubmit(e) {
    e.preventDefault();
    
    const chinese = document.getElementById('term-chinese').value.trim();
    const english = document.getElementById('term-english').value.trim();
    const chineseDefinition = document.getElementById('term-chinese-def').value.trim();
    const englishDefinition = document.getElementById('term-english-def').value.trim();
    
    if (!chinese || !english) {
        alert('请填写中英文术语');
        return;
    }
    
    try {
        const termData = {
            chinese,
            english,
            chineseDefinition,
            englishDefinition
        };
        
        let response;
        if (currentEditingTermId) {
            // 更新术语
            response = await authenticatedFetch(`/api/admin/terminology/${currentEditingTermId}`, {
                method: 'PUT',
                body: JSON.stringify(termData)
            });
        } else {
            // 添加新术语
            response = await authenticatedFetch('/api/admin/terminology', {
                method: 'POST',
                body: JSON.stringify(termData)
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            alert(currentEditingTermId ? '术语更新成功' : '术语添加成功');
            resetTermForm();
            loadTerminology(); // 重新加载术语列表
        } else {
            alert(result.error || '操作失败');
        }
    } catch (error) {
        console.error('术语操作失败:', error);
        alert('操作失败，请稍后重试');
    }
}

// 编辑术语
function editTerm(termId) {
    const term = allTerms.find(t => t.id === termId);
    if (!term) return;
    
    currentEditingTermId = termId;
    
    document.getElementById('term-chinese').value = term.chinese;
    document.getElementById('term-english').value = term.english;
    document.getElementById('term-chinese-def').value = term.chineseDefinition || '';
    document.getElementById('term-english-def').value = term.englishDefinition || '';
    
    document.querySelector('#term-form button[type="submit"]').textContent = '更新术语';
    cancelEditBtn.style.display = 'inline-block';
}

// 取消编辑术语
function cancelTermEdit() {
    currentEditingTermId = null;
    resetTermForm();
}

// 重置术语表单
function resetTermForm() {
    termForm.reset();
    currentEditingTermId = null;
    document.querySelector('#term-form button[type="submit"]').textContent = '添加术语';
    cancelEditBtn.style.display = 'none';
}

// 删除术语
async function deleteTerm(termId) {
    if (!confirm('确定要删除这个术语吗？')) {
        return;
    }
    
    try {
        const response = await authenticatedFetch(`/api/admin/terminology/${termId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('术语删除成功');
            loadTerminology(); // 重新加载术语列表
        } else {
            alert(result.error || '删除失败');
        }
    } catch (error) {
        console.error('删除术语失败:', error);
        alert('删除失败，请稍后重试');
    }
}

// 全局函数（供HTML调用）
window.clearFileSelection = clearFileSelection;
window.editTerm = editTerm;
window.deleteTerm = deleteTerm;