// 全局变量
let player = null;
let allTerms = [];
let filteredTerms = [];

// DOM元素
const videoTitle = document.getElementById('video-title');
const videoMeta = document.getElementById('video-meta');
const uploadDate = document.getElementById('upload-date');
const terminologyDrawer = document.getElementById('terminology-drawer');
const toggleDrawerBtn = document.getElementById('toggle-drawer-btn');
const termSearch = document.getElementById('term-search');
const terminologyList = document.getElementById('terminology-list');

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

// 初始化页面
function initializePage() {
    // 检查用户登录状态
    checkAuthStatus();
    
    // 从URL获取视频ID
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('id');
    
    if (!videoId) {
        showError('未找到视频ID，请返回首页重试');
        return;
    }
    
    // 加载视频信息
    loadVideo(videoId);
    
    // 加载术语库
    loadTerminology();
    
    // 绑定事件监听器
    bindEventListeners();
}

// 绑定事件监听器
function bindEventListeners() {
    // 术语库抽屉切换
    toggleDrawerBtn.addEventListener('click', toggleTerminologyDrawer);
    
    // 术语搜索
    termSearch.addEventListener('input', function() {
        filterTerminology(this.value);
    });
}

// 加载视频信息
async function loadVideo(videoId) {
    try {
        const response = await fetch(`/api/video/${videoId}`);
        const data = await response.json();
        
        if (data.success && data.video) {
            renderVideo(data.video);
        } else {
            showError('加载视频失败：' + (data.error || '未知错误'));
        }
    } catch (error) {
        console.error('加载视频失败:', error);
        showError('网络错误，请稍后重试');
    }
}

// 渲染视频
function renderVideo(video) {
    // 设置页面标题
    document.title = `${video.title} - 视频学习平台`;
    
    // 设置视频信息
    videoTitle.textContent = video.title;
    
    // 格式化上传时间
    const uploadDateObj = new Date(video.uploadTime);
    uploadDate.textContent = formatDate(uploadDateObj);
    
    // 初始化Video.js播放器
    player = videojs('video-player', {
        controls: true,
        responsive: true,
        fluid: true,
        sources: [{
            src: video.videoUrl,
            type: 'video/mp4'
        }]
    });
    
    // 播放视频
    player.ready(() => {
        // 自动播放可能会被浏览器阻止，所以不设置自动播放
        // player.play();
    });
}

// 加载术语库
async function loadTerminology() {
    try {
        const response = await fetch('/api/video/terminology/list');
        const data = await response.json();
        
        if (data.success) {
            allTerms = data.terms;
            filteredTerms = [...allTerms];
            renderTerminology(filteredTerms);
        } else {
            console.error('加载术语库失败:', data.error);
        }
    } catch (error) {
        console.error('加载术语库失败:', error);
    }
}

// 渲染术语库
function renderTerminology(terms) {
    terminologyList.innerHTML = '';
    
    if (terms.length === 0) {
        terminologyList.innerHTML = '<p class="no-terms">未找到相关术语</p>';
        return;
    }
    
    terms.forEach(term => {
        const termElement = createTermElement(term);
        terminologyList.appendChild(termElement);
    });
}

// 创建术语元素
function createTermElement(term) {
    const termDiv = document.createElement('div');
    termDiv.className = 'term-item';
    
    termDiv.innerHTML = `
        <div class="term-header">
            <span class="term-id">#${term.id}</span>
        </div>
        <div class="term-languages">
            <div class="term-chinese">${term.chinese}</div>
            <div class="term-english">${term.english}</div>
        </div>
        <div class="term-definitions">
            ${term.chineseDefinition ? `<div class="term-def-chinese">${term.chineseDefinition}</div>` : ''}
            ${term.englishDefinition ? `<div class="term-def-english">${term.englishDefinition}</div>` : ''}
        </div>
    `;
    
    return termDiv;
}

// 过滤术语库
function filterTerminology(keyword) {
    if (keyword.trim() === '') {
        filteredTerms = [...allTerms];
    } else {
        const lowerKeyword = keyword.toLowerCase();
        filteredTerms = allTerms.filter(term => 
            term.chinese.toLowerCase().includes(lowerKeyword) ||
            term.english.toLowerCase().includes(lowerKeyword) ||
            (term.chineseDefinition && term.chineseDefinition.toLowerCase().includes(lowerKeyword)) ||
            (term.englishDefinition && term.englishDefinition.toLowerCase().includes(lowerKeyword))
        );
    }
    
    renderTerminology(filteredTerms);
}

// 切换术语库抽屉
function toggleTerminologyDrawer() {
    terminologyDrawer.classList.toggle('collapsed');
}

// 格式化日期
function formatDate(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return '1天前';
    } else if (diffDays < 7) {
        return `${diffDays}天前`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks}周前`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months}个月前`;
    } else {
        const years = Math.floor(diffDays / 365);
        return `${years}年前`;
    }
}

// 显示错误信息
function showError(message) {
    const container = document.querySelector('.player-container');
    container.innerHTML = `
        <div class="error-message" style="text-align: center; padding: 40px;">
            <p>${message}</p>
            <a href="../../index.html" class="btn btn-primary" style="margin-top: 20px;">
                返回首页
            </a>
        </div>
    `;
}

// 检查认证状态
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    const guestActions = document.getElementById('guest-actions');
    const userActions = document.getElementById('user-actions');
    const usernameDisplay = document.getElementById('username-display');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (token && username) {
        // 用户已登录
        guestActions.style.display = 'none';
        userActions.style.display = 'flex';
        usernameDisplay.textContent = `欢迎，${username}`;
        
        // 绑定退出登录事件
        logoutBtn.addEventListener('click', logout);
    } else {
        // 用户未登录
        guestActions.style.display = 'flex';
        userActions.style.display = 'none';
    }
}

// 退出登录
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    
    // 刷新页面
    window.location.reload();
}