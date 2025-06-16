// 全局变量
let currentPlayer = null;
let allVideos = [];
let allTerms = [];
let filteredTerms = [];

// DOM元素
const videoGrid = document.getElementById('video-grid');
const loadingSpinner = document.getElementById('loading-spinner');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const videoModal = document.getElementById('video-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalVideoTitle = document.getElementById('modal-video-title');
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
    
    // 加载视频列表
    loadVideos();
    
    // 加载术语库
    loadTerminology();
    
    // 绑定事件监听器
    bindEventListeners();
}

// 绑定事件监听器
function bindEventListeners() {
    // 搜索功能
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // 模态框关闭
    closeModalBtn.addEventListener('click', closeVideoModal);
    videoModal.addEventListener('click', function(e) {
        if (e.target === videoModal) {
            closeVideoModal();
        }
    });
    
    // 术语库抽屉切换
    toggleDrawerBtn.addEventListener('click', toggleTerminologyDrawer);
    
    // 术语搜索
    termSearch.addEventListener('input', function() {
        filterTerminology(this.value);
    });
    
    // ESC键关闭模态框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && videoModal.style.display === 'flex') {
            closeVideoModal();
        }
    });
}

// 加载视频列表
async function loadVideos() {
    try {
        const response = await fetch('/api/video/list');
        const data = await response.json();
        
        if (data.success) {
            allVideos = data.videos;
            renderVideoGrid(allVideos);
        } else {
            showError('加载视频列表失败');
        }
    } catch (error) {
        console.error('加载视频失败:', error);
        showError('网络错误，请稍后重试');
    } finally {
        hideLoadingSpinner();
    }
}

// 渲染视频网格
function renderVideoGrid(videos) {
    videoGrid.innerHTML = '';
    
    if (videos.length === 0) {
        videoGrid.innerHTML = `
            <div class="no-videos">
                <p>暂无视频内容</p>
            </div>
        `;
        return;
    }
    
    videos.forEach(video => {
        const videoCard = createVideoCard(video);
        videoGrid.appendChild(videoCard);
    });
}

// 创建视频卡片
function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.setAttribute('data-video-id', video.id);
    
    // 格式化上传时间
    const uploadDate = new Date(video.uploadTime);
    const formattedDate = formatDate(uploadDate);
    
    card.innerHTML = `
        <div class="video-thumbnail">
            <img src="${video.coverUrl || 'https://via.placeholder.com/320x180?text=视频缩略图'}" alt="${video.title}">
            <div class="play-overlay">
                <span class="material-icons">play_arrow</span>
            </div>
        </div>
        <div class="video-info">
            <h3 class="video-title">${video.title}</h3>
            <div class="video-meta">
                <span>${formattedDate}</span>
            </div>
        </div>
    `;
    
    // 添加点击事件
    card.addEventListener('click', () => {
        playVideo(video);
    });
    
    return card;
}

// 播放视频
function playVideo(video) {
    modalVideoTitle.textContent = video.title;
    
    // 初始化Video.js播放器
    if (currentPlayer) {
        currentPlayer.dispose();
    }
    
    currentPlayer = videojs('video-player', {
        controls: true,
        responsive: true,
        fluid: true,
        sources: [{
            src: video.videoUrl,
            type: 'video/mp4'
        }]
    });
    
    // 显示模态框
    videoModal.style.display = 'flex';
    
    // 播放视频
    currentPlayer.ready(() => {
        currentPlayer.play();
    });
}

// 关闭视频模态框
function closeVideoModal() {
    if (currentPlayer) {
        currentPlayer.pause();
        currentPlayer.dispose();
        currentPlayer = null;
    }
    
    videoModal.style.display = 'none';
}

// 处理搜索
function handleSearch() {
    const keyword = searchInput.value.trim();
    
    if (keyword === '') {
        renderVideoGrid(allVideos);
        return;
    }
    
    const filteredVideos = allVideos.filter(video => 
        video.title.toLowerCase().includes(keyword.toLowerCase()) ||
        (video.description && video.description.toLowerCase().includes(keyword.toLowerCase()))
    );
    
    renderVideoGrid(filteredVideos);
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

// 隐藏加载动画
function hideLoadingSpinner() {
    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }
}

// 显示错误信息
function showError(message) {
    videoGrid.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
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