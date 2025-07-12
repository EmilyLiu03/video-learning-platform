// 视频播放器页面功能
class VideoPlayer {
    constructor() {
        this.player = null;
        this.currentVideoId = null;
        this.subtitles = [];
        this.currentSubtitleIndex = -1;
        this.init();
    }

    init() {
        this.initPlayer();
        this.loadVideoFromURL();
        this.initSubtitlePanel();
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
                    <a href="../index.html" class="back-home-btn">
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

    // 初始化字幕面板
    initSubtitlePanel() {
        const toggleBtn = document.getElementById('toggle-drawer-btn');
        const drawer = document.getElementById('subtitle-drawer');
        const subtitleInput = document.getElementById('subtitle-file');
        
        if (toggleBtn && drawer) {
            toggleBtn.addEventListener('click', () => {
                drawer.classList.toggle('collapsed');
                const icon = toggleBtn.querySelector('.material-icons');
                icon.textContent = drawer.classList.contains('collapsed') ? 'chevron_left' : 'chevron_right';
            });
        }
        
        // 处理字幕文件上传
        if (subtitleInput) {
            subtitleInput.addEventListener('change', (e) => {
                this.handleSubtitleFile(e.target.files[0]);
            });
        }
        
        // 监听视频时间更新
        this.initSubtitleSync();
    }

    // 处理字幕文件
    handleSubtitleFile(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            
            if (file.name.endsWith('.srt')) {
                this.parseSrtContent(content);
                // 转换为 VTT 并添加到视频
                const vttContent = this.convertSrtToVtt(content);
                const vttBlob = new Blob([vttContent], { type: 'text/vtt' });
                const vttUrl = URL.createObjectURL(vttBlob);
                this.addSubtitleTrack(vttUrl);
            } else if (file.name.endsWith('.vtt')) {
                this.parseVttContent(content);
                const vttUrl = URL.createObjectURL(file);
                this.addSubtitleTrack(vttUrl);
            }
        };
        reader.readAsText(file);
    }

    // 将时间字符串转换为秒数
    timeToSeconds(timeString) {
        const [time, milliseconds] = timeString.replace(',', '.').split('.');
        const [hours, minutes, seconds] = time.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds + Number(`0.${milliseconds}`);
    }

    // 解析 SRT 内容
    parseSrtContent(srtContent) {
        this.subtitles = [];
        const blocks = srtContent.trim().split(/\n\s*\n/);
        
        blocks.forEach(block => {
            const lines = block.trim().split('\n');
            if (lines.length >= 3) {
                const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
                if (timeMatch) {
                    const startTime = this.timeToSeconds(timeMatch[1]);
                    const endTime = this.timeToSeconds(timeMatch[2]);
                    const text = lines.slice(2).join('\n');
                    
                    this.subtitles.push({
                        startTime,
                        endTime,
                        text,
                        timeString: timeMatch[1].replace(',', '.')
                    });
                }
            }
        });

        this.updateSubtitlePanel();
    }

    // 解析 VTT 内容
    parseVttContent(vttContent) {
        this.subtitles = [];
        const blocks = vttContent.trim().split(/\n\s*\n/).slice(1); // 跳过 WEBVTT 头
        
        blocks.forEach(block => {
            const lines = block.trim().split('\n');
            if (lines.length >= 2) {
                const timeMatch = lines[0].match(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/);
                if (timeMatch) {
                    const startTime = this.timeToSeconds(timeMatch[1]);
                    const endTime = this.timeToSeconds(timeMatch[2]);
                    const text = lines.slice(1).join('\n');
                    
                    this.subtitles.push({
                        startTime,
                        endTime,
                        text,
                        timeString: timeMatch[1]
                    });
                }
            }
        });

        this.updateSubtitlePanel();
    }

    // 将 SRT 格式转换为 VTT 格式
    convertSrtToVtt(srtContent) {
        let vttContent = 'WEBVTT\n\n';
        
        vttContent += srtContent
            .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
            .replace(/^\d+\n/gm, '')
            .replace(/\n\n+/g, '\n\n');

        return vttContent;
    }



    // 添加字幕轨道到视频
    addSubtitleTrack(vttUrl) {
        // 移除现有字幕轨道
        const existingTracks = this.player.remoteTextTracks();
        for (let i = existingTracks.length - 1; i >= 0; i--) {
            this.player.removeRemoteTextTrack(existingTracks[i]);
        }
        
        // 添加新字幕轨道
        this.player.addRemoteTextTrack({
            src: vttUrl,
            kind: 'subtitles',
            srclang: 'zh',
            label: '中文',
            default: true
        }, false);
    }

    // 更新字幕面板
    updateSubtitlePanel() {
        const subtitleList = document.getElementById('subtitle-list');
        if (!subtitleList) return;
        
        subtitleList.innerHTML = '';
        
        const scrollContainer = document.createElement('div');
        scrollContainer.className = 'subtitle-scroll-container';
        
        this.subtitles.forEach((subtitle, index) => {
            const subtitleElement = document.createElement('div');
            subtitleElement.className = 'subtitle-item';
            subtitleElement.dataset.index = index;
            subtitleElement.innerHTML = `
                <div class="time">${subtitle.timeString}</div>
                <div class="text">${subtitle.text}</div>
            `;
            
            // 点击字幕跳转到对应时间点
            subtitleElement.addEventListener('click', () => {
                this.player.currentTime(subtitle.startTime);
            });
            
            scrollContainer.appendChild(subtitleElement);
        });

        subtitleList.appendChild(scrollContainer);
    }

    // 初始化字幕同步
    initSubtitleSync() {
        this.player.on('timeupdate', () => {
            const currentTime = this.player.currentTime();
            
            // 查找当前时间对应的字幕
            const newIndex = this.subtitles.findIndex(
                subtitle => currentTime >= subtitle.startTime && currentTime <= subtitle.endTime
            );
            
            // 如果找到新的字幕，更新高亮显示
            if (newIndex !== this.currentSubtitleIndex) {
                const subtitleItems = document.querySelectorAll('.subtitle-item');
                
                subtitleItems.forEach((item, index) => {
                    item.classList.remove('active', 'passed', 'upcoming');
                    
                    if (index < newIndex) {
                        item.classList.add('passed');
                    } else if (index === newIndex) {
                        item.classList.add('active');
                    } else {
                        item.classList.add('upcoming');
                    }
                });

                // 如果找到当前字幕，滚动到对应位置
                if (newIndex !== -1) {
                    const activeElement = document.querySelector(`.subtitle-item[data-index="${newIndex}"]`);
                    if (activeElement) {
                        const container = document.querySelector('.subtitle-scroll-container');
                        const subtitlePanel = document.querySelector('.subtitle-panel');
                        if (container && subtitlePanel) {
                            const containerHeight = subtitlePanel.offsetHeight - 56;
                            const elementTop = activeElement.offsetTop;
                            
                            const scrollTop = Math.max(0, elementTop - (containerHeight / 2) + (activeElement.offsetHeight / 2));
                            container.style.transform = `translateY(-${scrollTop}px)`;
                        }
                    }
                }
                
                this.currentSubtitleIndex = newIndex;
            }
        });
    }

    // 显示错误信息
    showError(message) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-container';
        errorContainer.innerHTML = `
            <div class="error-icon">⚠️</div>
            <div class="error-message">${message}</div>
            <button class="back-home-btn" onclick="window.location.href='index.html'">
                <span class="material-icons">home</span>
                返回首页
            </button>
        `;
        
        const playerContainer = document.querySelector('.player-container');
        playerContainer.innerHTML = '';
        playerContainer.appendChild(errorContainer);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new VideoPlayer();
});