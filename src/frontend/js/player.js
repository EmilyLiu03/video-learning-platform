// 视频播放器页面功能
class VideoPlayer {
    constructor() {
        this.player = null;
        this.currentVideoId = null;
        this.terminology = [];
        this.init();
    }

    init() {
        this.initPlayer();
        this.loadVideoFromURL();
        this.initTerminologyDrawer();
    }

    // 初始化Video.js播放器
    initPlayer() {
        this.player = videojs('video-player', {
            fluid: true,
            responsive: true,
            playbackRates: [0.5, 1, 1.25, 1.5, 2],
            controls: true,
            preload: 'auto'
        });
    }

    // 从URL参数加载视频
    loadVideoFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('id');
        
        if (videoId) {
            this.loadVideo(videoId);
        } else {
            this.showNoVideoMessage();
        }
    }

    // 加载指定视频
    async loadVideo(videoId) {
        try {
            const response = await fetch(`/api/video/${videoId}`);
            const data = await response.json();
            
            if (data.success) {
                this.currentVideoId = videoId;
                this.displayVideo(data.video);
            } else {
                console.error('加载视频失败:', data.error);
                this.showError('视频加载失败');
            }
        } catch (error) {
            console.error('加载视频失败:', error);
            this.showError('网络错误，请稍后重试');
        }
    }

    // 显示视频信息和播放
    displayVideo(video) {
        // 更新页面标题和信息
        document.getElementById('video-title').textContent = video.title;
        document.getElementById('upload-date').textContent = `上传时间: ${new Date(video.uploadDate || video.uploadTime).toLocaleDateString()}`;
        document.title = `${video.title} - 七天速成前端魔法师`;
        
        // 设置视频源
        this.player.src({
            src: video.videoUrl,
            type: 'video/mp4'
        });
        
        // 显示播放器
        this.showPlayer();
    }

    // 显示没有视频的消息
    showNoVideoMessage() {
        const noVideoHTML = `
            <div class="no-video-container">
                <div class="no-video-icon">🎬</div>
                <div class="no-video-message">没有指定要播放的视频</div>
                <div class="no-video-actions">
                    <a href="upload.html" class="upload-link-btn">
                        <span class="material-icons">cloud_upload</span>
                        上传视频
                    </a>
                    <a href="index.html" class="back-home-btn">
                        <span class="material-icons">home</span>
                        返回首页
                    </a>
                </div>
            </div>
        `;
        
        // 隐藏播放器并显示消息
        const playerContainer = document.querySelector('.player-wrapper');
        playerContainer.style.display = 'none';
        
        const videoInfo = document.querySelector('.video-info');
        videoInfo.innerHTML = noVideoHTML;
    }

    // 显示播放器
    showPlayer() {
        const playerContainer = document.querySelector('.player-wrapper');
        playerContainer.style.display = 'flex';
    }

    // 初始化术语库抽屉
    initTerminologyDrawer() {
        const toggleBtn = document.getElementById('toggle-drawer-btn');
        const drawer = document.getElementById('terminology-drawer');
        const searchInput = document.getElementById('term-search');
        
        if (toggleBtn && drawer) {
            toggleBtn.addEventListener('click', () => {
                drawer.classList.toggle('collapsed');
                const icon = toggleBtn.querySelector('.material-icons');
                icon.textContent = drawer.classList.contains('collapsed') ? 'chevron_left' : 'chevron_right';
            });
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterTerminology(e.target.value);
            });
        }
        
        // 加载术语库数据
        this.loadTerminology();
    }

    // 加载术语库
    async loadTerminology() {
        try {
            // 这里可以从API加载术语库数据
            // 暂时使用模拟数据
            this.terminology = [
                {
                    chinese: 'HTML',
                    english: 'HyperText Markup Language',
                    definition: '超文本标记语言，用于创建网页的标准标记语言'
                },
                {
                    chinese: 'CSS',
                    english: 'Cascading Style Sheets',
                    definition: '层叠样式表，用于描述HTML文档的样式和布局'
                },
                {
                    chinese: 'JavaScript',
                    english: 'JavaScript',
                    definition: '一种高级的、解释型的编程语言，主要用于网页开发'
                }
            ];
            
            this.renderTerminology();
        } catch (error) {
            console.error('加载术语库失败:', error);
        }
    }

    // 渲染术语库
    renderTerminology(terms = this.terminology) {
        const terminologyList = document.getElementById('terminology-list');
        if (!terminologyList) return;
        
        if (terms.length === 0) {
            terminologyList.innerHTML = '<div class="no-terms">没有找到相关术语</div>';
            return;
        }
        
        const termsHTML = terms.map(term => `
            <div class="term-item">
                <div class="term-chinese">${term.chinese}</div>
                <div class="term-english">${term.english}</div>
                <div class="term-definition">${term.definition}</div>
            </div>
        `).join('');
        
        terminologyList.innerHTML = termsHTML;
    }

    // 过滤术语库
    filterTerminology(searchTerm) {
        if (!searchTerm.trim()) {
            this.renderTerminology();
            return;
        }
        
        const filteredTerms = this.terminology.filter(term => 
            term.chinese.toLowerCase().includes(searchTerm.toLowerCase()) ||
            term.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
            term.definition.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.renderTerminology(filteredTerms);
    }



    // 显示错误信息
    showError(message) {
        const errorHTML = `
            <div class="error-container">
                <div class="error-icon">⚠️</div>
                <div class="error-message">${message}</div>
                <button onclick="window.location.href='/'" class="back-home-btn">返回首页</button>
            </div>
        `;
        
        document.querySelector('.player-container').innerHTML = errorHTML;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new VideoPlayer();
});