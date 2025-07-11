// 视频播放器功能
let currentPlayer = null;
let allTerms = [];
let filteredTerms = [];

// DOM元素
const videoTitle = document.getElementById('video-title');
const uploadDate = document.getElementById('upload-date');
const terminologyDrawer = document.getElementById('terminology-drawer');
const toggleDrawerBtn = document.getElementById('toggle-drawer-btn');
const termSearch = document.getElementById('term-search');
const terminologyList = document.getElementById('terminology-list');

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializePlayer();
});

// 初始化播放器
function initializePlayer() {
    // 获取URL参数中的视频ID
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('id');
    
    if (videoId) {
        loadVideo(videoId);
    } else {
        showMessage('未指定视频ID', 'error');
        return;
    }
    
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
        // 从本地数据加载视频信息
        const response = await fetch('data/videos.json');
        const videos = await response.json();
        
        const video = videos.find(v => v.id === parseInt(videoId));
        
        if (!video) {
            showMessage('视频不存在', 'error');
            return;
        }
        
        // 更新页面信息
        videoTitle.textContent = video.title;
        uploadDate.textContent = `上传时间：${formatDate(new Date(video.uploadTime))}`;
        
        // 初始化Video.js播放器
        initializeVideoPlayer(video);
        
    } catch (error) {
        console.error('加载视频失败:', error);
        showMessage('加载视频失败', 'error');
    }
}

// 初始化Video.js播放器
function initializeVideoPlayer(video) {
    if (currentPlayer) {
        currentPlayer.dispose();
    }
    
    currentPlayer = videojs('video-player', {
        controls: true,
        responsive: true,
        fluid: false,
        width: '100%',
        height: 500,
        sources: [{
            src: video.videoUrl,
            type: 'video/mp4'
        }],
        poster: video.coverUrl
    });
    
    // 播放器准备就绪后的回调
    currentPlayer.ready(() => {
        console.log('视频播放器已准备就绪');
    });
}

// 加载术语库
async function loadTerminology() {
    try {
        const response = await fetch('data/terminology.json');
        allTerms = await response.json();
        filteredTerms = [...allTerms];
        renderTerminology();
    } catch (error) {
        console.error('加载术语库失败:', error);
    }
}

// 渲染术语库
function renderTerminology() {
    terminologyList.innerHTML = '';
    
    if (filteredTerms.length === 0) {
        terminologyList.innerHTML = '<p style="color: #B8A082; text-align: center;">暂无术语</p>';
        return;
    }
    
    filteredTerms.forEach(term => {
        const termElement = createTermElement(term);
        terminologyList.appendChild(termElement);
    });
}

// 创建术语元素
function createTermElement(term) {
    const termDiv = document.createElement('div');
    termDiv.className = 'term-item';
    
    termDiv.innerHTML = `
        <div class="term-chinese">${term.chinese}</div>
        <div class="term-english">${term.english}</div>
        <div class="term-definition">
            <strong>中文定义：</strong>${term.chineseDefinition}<br>
            <strong>英文定义：</strong>${term.englishDefinition}
        </div>
    `;
    
    return termDiv;
}

// 过滤术语
function filterTerminology(keyword) {
    if (!keyword.trim()) {
        filteredTerms = [...allTerms];
    } else {
        const lowerKeyword = keyword.toLowerCase();
        filteredTerms = allTerms.filter(term => 
            term.chinese.toLowerCase().includes(lowerKeyword) ||
            term.english.toLowerCase().includes(lowerKeyword) ||
            term.chineseDefinition.toLowerCase().includes(lowerKeyword) ||
            term.englishDefinition.toLowerCase().includes(lowerKeyword)
        );
    }
    
    renderTerminology();
}

// 切换术语库抽屉
function toggleTerminologyDrawer() {
    const drawer = terminologyDrawer;
    const btn = toggleDrawerBtn.querySelector('.material-icons');
    
    if (drawer.style.transform === 'translateX(100%)') {
        drawer.style.transform = 'translateX(0)';
        btn.textContent = 'chevron_right';
    } else {
        drawer.style.transform = 'translateX(100%)';
        btn.textContent = 'chevron_left';
    }
}

// 格式化日期
function formatDate(date) {
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// 显示消息
function showMessage(message, type = 'info') {
    // 创建消息元素
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        background: ${type === 'error' ? 'linear-gradient(135deg, #ff6b6b, #ee5a52)' : 'linear-gradient(135deg, #4ecdc4, #44a08d)'};
        border: 2px solid ${type === 'error' ? '#ff5252' : '#4ecdc4'};
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    `;
    
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// 页面卸载时清理播放器
window.addEventListener('beforeunload', function() {
    if (currentPlayer) {
        currentPlayer.dispose();
    }
});