// 登录验证守卫脚本
// 用于保护需要登录才能访问的页面

(function() {
    'use strict';
    
    // 检查当前页面是否需要登录验证
    function requiresAuth() {
        const currentPath = window.location.pathname;
        
        // 定义公开页面的文件名（不包含路径）
        const publicPageNames = [
            'index.html',
            'login.html',
            'signup.html'
        ];
        
        // 检查当前路径是否为根路径
        if (currentPath === '/' || currentPath === '') {
            return false;
        }
        
        // 检查当前页面文件名是否在公开页面列表中
        const currentFileName = currentPath.split('/').pop();
        return !publicPageNames.includes(currentFileName);
    }
    
    // 检查用户是否已登录
    function isLoggedIn() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        return token && user;
    }
    
    // 获取当前用户信息
    function getCurrentUser() {
        try {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('解析用户信息失败:', error);
            return null;
        }
    }
    
    // 显示登录提示消息
    function showLoginRequired() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'auth-message';
        messageDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(42, 16, 48, 0.95);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: 'Noto Sans SC', sans-serif;
            ">
                <div style="
                    background: linear-gradient(180deg, #563894 0%, #6941AB 100%);
                    padding: 40px;
                    border-radius: 20px;
                    border: 3px solid #FFD66D;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                    max-width: 400px;
                ">
                    <h2 style="
                        color: #FFD66D;
                        margin-bottom: 20px;
                        font-size: 24px;
                        font-family: 'Noto Serif SC', serif;
                    ">🔐 需要登录验证</h2>
                    <p style="
                        color: #F4ECC8;
                        margin-bottom: 30px;
                        font-size: 16px;
                        line-height: 1.5;
                    ">此页面需要登录后才能访问。<br/>请先登录您的魔法师账号。</p>
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button onclick="sessionStorage.setItem('returnUrl', window.location.href); window.location.href='../pages/login.html'" style="
                            background: linear-gradient(180deg, #FFD66D 0%, #EEAD08 100%);
                            border: none;
                            border-radius: 25px;
                            padding: 12px 24px;
                            color: #161414;
                            font-weight: bold;
                            cursor: pointer;
                            font-size: 14px;
                            transition: transform 0.2s;
                        " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">立即登录</button>
                        <button onclick="window.location.href='../pages/signup.html'" style="
                            background: transparent;
                            border: 2px solid #F4ECC8;
                            border-radius: 25px;
                            padding: 10px 22px;
                            color: #F4ECC8;
                            font-weight: bold;
                            cursor: pointer;
                            font-size: 14px;
                            transition: all 0.2s;
                        " onmouseover="this.style.background='rgba(244, 236, 200, 0.1)'" onmouseout="this.style.background='transparent'">注册账号</button>
                    </div>
                    <p style="
                        color: #F4ECC8;
                        margin-top: 20px;
                        font-size: 14px;
                        opacity: 0.8;
                    ">
                        <a href="../index.html" style="color: #FFD66D; text-decoration: none;">← 返回首页</a>
                    </p>
                </div>
            </div>
        `;
        
        document.body.appendChild(messageDiv);
    }
    
    // 更新导航栏用户状态
    function updateNavUserStatus() {
        const authLinks = document.querySelectorAll('.auth-link');
        const avatarButton = document.querySelector('.avatar-button');
        
        if (isLoggedIn()) {
            const user = getCurrentUser();
            
            // 隐藏登录/注册链接
            authLinks.forEach(link => {
                link.style.display = 'none';
            });
            
            // 显示用户头像按钮
            if (avatarButton) {
                avatarButton.style.display = 'block';
                avatarButton.title = `用户中心 - ${user?.username || '用户'}`;
            }
        } else {
            // 显示登录/注册链接
            authLinks.forEach(link => {
                link.style.display = 'block';
            });
            
            // 隐藏用户头像按钮
            if (avatarButton) {
                avatarButton.style.display = 'none';
            }
        }
    }
    
    // 页面加载时执行验证
    function initAuthGuard() {
        // 如果当前页面需要登录验证
        if (requiresAuth()) {
            if (!isLoggedIn()) {
                // 未登录，显示登录提示
                showLoginRequired();
                return;
            }
        }
        
        // 更新导航栏状态
        updateNavUserStatus();
        
        // 添加登出功能
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (confirm('确定要退出登录吗？')) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '../index.html';
                }
            });
        }
    }
    
    // 等待DOM加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuthGuard);
    } else {
        initAuthGuard();
    }
    
    // 监听存储变化（多标签页同步）
    window.addEventListener('storage', function(e) {
        if (e.key === 'token' || e.key === 'user') {
            // 如果登录状态发生变化，重新检查
            if (requiresAuth() && !isLoggedIn()) {
                window.location.reload();
            } else {
                updateNavUserStatus();
            }
        }
    });
    
    // 暴露一些有用的函数到全局
    window.authGuard = {
        isLoggedIn: isLoggedIn,
        getCurrentUser: getCurrentUser,
        logout: function() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '../index.html';
        }
    };
    
})();