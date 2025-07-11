// 认证相关功能

// 检查用户是否已登录
function isLoggedIn() {
    const token = localStorage.getItem('token');
    return token !== null;
}

// 获取当前用户信息
function getCurrentUser() {
    return {
        token: localStorage.getItem('token'),
        username: localStorage.getItem('username'),
        userId: localStorage.getItem('userId'),
        role: localStorage.getItem('userRole')
    };
}

// 检查是否为管理员
function isAdmin() {
    const role = localStorage.getItem('userRole');
    return role === 'admin';
}

// 保存用户信息到本地存储
function saveUserInfo(userInfo, token) {
    localStorage.setItem('token', token);
    localStorage.setItem('username', userInfo.username);
    localStorage.setItem('userId', userInfo.id);
    localStorage.setItem('userRole', userInfo.role);
}

// 清除用户信息
function clearUserInfo() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
}

// 发送带认证头的请求
async function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        throw new Error('未登录');
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    
    return fetch(url, {
        ...options,
        headers
    });
}

// 用户注册
async function register(username, password) {
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            saveUserInfo(data.user, data.token);
            return { success: true, message: data.message };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        console.error('注册失败:', error);
        return { success: false, error: '网络错误，请稍后重试' };
    }
}

// 用户登录
async function login(username, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            saveUserInfo(data.user, data.token);
            return { success: true, message: data.message };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        console.error('登录失败:', error);
        return { success: false, error: '网络错误，请稍后重试' };
    }
}

// 验证当前令牌是否有效
async function validateToken() {
    try {
        const response = await authenticatedFetch('/api/auth/me');
        const data = await response.json();
        
        if (!data.success) {
            clearUserInfo();
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('令牌验证失败:', error);
        clearUserInfo();
        return false;
    }
}

// 退出登录
function logout() {
    clearUserInfo();
    window.location.href = '/index.html';
}

// 重定向到登录页面
function redirectToLogin() {
    window.location.href = '/fido/login.html';
}

// 检查页面访问权限
function checkPageAccess(requiredRole = null) {
    if (!isLoggedIn()) {
        redirectToLogin();
        return false;
    }
    
    if (requiredRole && getCurrentUser().role !== requiredRole) {
        alert('您没有访问此页面的权限');
        window.location.href = '/index.html';
        return false;
    }
    
    return true;
}

// 显示消息函数
function showMessage(message, type = 'error') {
    // 创建消息元素
    let messageDiv = document.getElementById('message');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'message';
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 25px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 1000;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(messageDiv);
    }
    
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    
    if (type === 'success') {
        messageDiv.style.backgroundColor = '#4CAF50';
        messageDiv.style.color = 'white';
    } else {
        messageDiv.style.backgroundColor = '#f44336';
        messageDiv.style.color = 'white';
    }
    
    // 3秒后自动隐藏
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 3000);
}

// 页面加载时检查认证状态
document.addEventListener('DOMContentLoaded', function() {
    // 如果在登录或注册页面，且用户已登录，则重定向到首页
    const currentPath = window.location.pathname;
    if ((currentPath.includes('login.html') || currentPath.includes('signup.html')) && isLoggedIn()) {
        window.location.href = '/index.html';
    }
});