// Web演练场JavaScript功能

class WebPlayground {
    constructor() {
        this.editor = null;
        this.currentLanguage = 'html';
        this.htmlCode = this.getDefaultHTML();
        this.cssCode = this.getDefaultCSS();
        this.jsCode = this.getDefaultJS();
        
        this.init();
    }

    init() {
        this.initMonacoEditor();
        this.bindEvents();
        this.initResizer();
        this.loadCode();
    }

    // 初始化Monaco编辑器
    initMonacoEditor() {
        require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.44.0/min/vs' } });
        
        require(['vs/editor/editor.main'], () => {
            // 设置编辑器主题
            monaco.editor.defineTheme('magicTheme', {
                base: 'vs-dark',
                inherit: true,
                rules: [
                    { token: 'comment', foreground: 'B8A9D9', fontStyle: 'italic' },
                    { token: 'keyword', foreground: 'FFD66D', fontStyle: 'bold' },
                    { token: 'string', foreground: '98FB98' },
                    { token: 'number', foreground: 'FFA07A' },
                    { token: 'tag', foreground: 'F4ECC8' },
                    { token: 'attribute.name', foreground: 'DDA0DD' },
                    { token: 'attribute.value', foreground: '98FB98' }
                ],
                colors: {
                    'editor.background': '#2A1030',
                    'editor.foreground': '#F4ECC8',
                    'editorLineNumber.foreground': '#B8A9D9',
                    'editor.selectionBackground': '#6941AB80',
                    'editor.lineHighlightBackground': '#46308320',
                    'editorCursor.foreground': '#FFD66D',
                    'editor.findMatchBackground': '#FFD66D40',
                    'editor.findMatchHighlightBackground': '#FFD66D20'
                }
            });

            this.editor = monaco.editor.create(document.getElementById('editor'), {
                value: this.htmlCode,
                language: 'html',
                theme: 'magicTheme',
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                minimap: { enabled: true },
                wordWrap: 'on',
                tabSize: 2,
                insertSpaces: true,
                folding: true,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3,
                glyphMargin: false
            });

            // 监听代码变化
            this.editor.onDidChangeModelContent(() => {
                this.saveCurrentCode();
                this.debouncePreview();
            });

            console.log('Monaco编辑器初始化完成');
        });
    }

    // 绑定事件
    bindEvents() {
        // 运行代码按钮
        document.getElementById('runBtn').addEventListener('click', () => {
            this.runCode();
        });

        // 清空代码按钮
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearCode();
        });

        // 保存代码按钮
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveToFile();
        });

        // 语言选择器
        document.getElementById('languageSelect').addEventListener('change', (e) => {
            this.switchLanguage(e.target.value);
        });

        // 刷新预览
        document.getElementById('refreshPreview').addEventListener('click', () => {
            this.runCode();
        });

        // 全屏编辑器
        document.getElementById('fullscreenEditor').addEventListener('click', () => {
            this.toggleFullscreen('editor-panel');
        });

        // 全屏预览
        document.getElementById('fullscreenPreview').addEventListener('click', () => {
            this.toggleFullscreen('preview-panel');
        });

        // ESC键退出全屏
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.exitFullscreen();
            }
        });

        // Ctrl+S保存
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveToFile();
            }
        });

        // Ctrl+Enter运行
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.runCode();
            }
        });
    }

    // 初始化分割线拖拽
    initResizer() {
        const divider = document.getElementById('divider');
        const editorPanel = document.querySelector('.editor-panel');
        const previewPanel = document.querySelector('.preview-panel');
        let isResizing = false;

        divider.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const container = document.querySelector('.playground-content');
            const containerRect = container.getBoundingClientRect();
            const percentage = ((e.clientX - containerRect.left) / containerRect.width) * 100;

            if (percentage > 20 && percentage < 80) {
                editorPanel.style.flex = `0 0 ${percentage}%`;
                previewPanel.style.flex = `0 0 ${100 - percentage}%`;
            }
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        });
    }

    // 切换语言
    switchLanguage(language) {
        if (!this.editor) return;

        this.saveCurrentCode();
        this.currentLanguage = language;
        
        let code = '';
        switch (language) {
            case 'html':
                code = this.htmlCode;
                break;
            case 'css':
                code = this.cssCode;
                break;
            case 'javascript':
                code = this.jsCode;
                break;
        }

        monaco.editor.setModelLanguage(this.editor.getModel(), language);
        this.editor.setValue(code);
    }

    // 保存当前代码
    saveCurrentCode() {
        if (!this.editor) return;

        const code = this.editor.getValue();
        switch (this.currentLanguage) {
            case 'html':
                this.htmlCode = code;
                break;
            case 'css':
                this.cssCode = code;
                break;
            case 'javascript':
                this.jsCode = code;
                break;
        }
    }

    // 运行代码
    runCode() {
        this.saveCurrentCode();
        
        const preview = document.getElementById('preview');
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>预览</title>
                <style>
                    body { margin: 0; padding: 20px; font-family: 'Microsoft YaHei', sans-serif; }
                    ${this.cssCode}
                </style>
            </head>
            <body>
                ${this.htmlCode}
                <script>
                    try {
                        ${this.jsCode}
                    } catch (error) {
                        console.error('JavaScript执行错误:', error);
                        document.body.innerHTML += '<div style="color: red; background: #ffe6e6; padding: 10px; margin: 10px 0; border-radius: 5px;"><strong>JavaScript错误:</strong> ' + error.message + '</div>';
                    }
                </script>
            </body>
            </html>
        `;

        preview.srcdoc = htmlContent;
        
        // 显示成功提示
        this.showNotification('代码运行成功！', 'success');
    }

    // 防抖预览更新
    debouncePreview() {
        clearTimeout(this.previewTimeout);
        this.previewTimeout = setTimeout(() => {
            this.runCode();
        }, 1000);
    }

    // 清空代码
    clearCode() {
        if (confirm('确定要清空当前代码吗？此操作不可撤销。')) {
            switch (this.currentLanguage) {
                case 'html':
                    this.htmlCode = this.getDefaultHTML();
                    break;
                case 'css':
                    this.cssCode = this.getDefaultCSS();
                    break;
                case 'javascript':
                    this.jsCode = this.getDefaultJS();
                    break;
            }
            
            if (this.editor) {
                this.editor.setValue(this.getCurrentCode());
            }
            
            this.showNotification('代码已清空', 'info');
        }
    }

    // 保存到文件
    saveToFile() {
        this.saveCurrentCode();
        
        const allCode = {
            html: this.htmlCode,
            css: this.cssCode,
            javascript: this.jsCode,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(allCode, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `playground-code-${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('代码已保存到文件', 'success');
    }

    // 加载代码
    loadCode() {
        // 从localStorage加载之前的代码
        const savedCode = localStorage.getItem('playground-code');
        if (savedCode) {
            try {
                const code = JSON.parse(savedCode);
                this.htmlCode = code.html || this.getDefaultHTML();
                this.cssCode = code.css || this.getDefaultCSS();
                this.jsCode = code.javascript || this.getDefaultJS();
            } catch (e) {
                console.warn('加载保存的代码失败:', e);
            }
        }
        
        // 自动保存到localStorage
        setInterval(() => {
            this.saveCurrentCode();
            const allCode = {
                html: this.htmlCode,
                css: this.cssCode,
                javascript: this.jsCode
            };
            localStorage.setItem('playground-code', JSON.stringify(allCode));
        }, 5000);
    }

    // 获取当前代码
    getCurrentCode() {
        switch (this.currentLanguage) {
            case 'html': return this.htmlCode;
            case 'css': return this.cssCode;
            case 'javascript': return this.jsCode;
            default: return '';
        }
    }

    // 切换全屏
    toggleFullscreen(panelClass) {
        const panel = document.querySelector(`.${panelClass}`);
        panel.classList.toggle('fullscreen');
    }

    // 退出全屏
    exitFullscreen() {
        const fullscreenElements = document.querySelectorAll('.fullscreen');
        fullscreenElements.forEach(el => el.classList.remove('fullscreen'));
    }

    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: 'Noto Sans SC', sans-serif;
            font-size: 14px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // 默认HTML代码
    getDefaultHTML() {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>我的魔法页面</title>
</head>
<body>
    <div class="container">
        <h1 class="magic-title">🧙‍♂️ 欢迎来到前端魔法世界</h1>
        <p class="magic-text">在这里开始你的编程之旅吧！</p>
        <button class="magic-button" onclick="castSpell()">施展魔法</button>
        <div id="magic-result"></div>
    </div>
</body>
</html>`;
    }

    // 默认CSS代码
    getDefaultCSS() {
        return `/* 魔法样式 */
body {
    margin: 0;
    padding: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    font-family: 'Microsoft YaHei', sans-serif;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.container {
    text-align: center;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.magic-title {
    color: #fff;
    font-size: 2.5em;
    margin-bottom: 20px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.magic-text {
    color: #f0f0f0;
    font-size: 1.2em;
    margin-bottom: 30px;
}

.magic-button {
    background: linear-gradient(45deg, #ff6b6b, #feca57);
    border: none;
    border-radius: 25px;
    padding: 15px 30px;
    font-size: 1.1em;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.magic-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

#magic-result {
    margin-top: 20px;
    padding: 20px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 1.1em;
    min-height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
}`;
    }

    // 默认JavaScript代码
    getDefaultJS() {
        return `// 魔法JavaScript代码
function castSpell() {
    const result = document.getElementById('magic-result');
    const spells = [
        '✨ 你施展了闪光术！',
        '🔥 火球术发动！',
        '❄️ 冰冻魔法生效！',
        '🌟 星光护盾激活！',
        '🌈 彩虹桥出现了！',
        '⚡ 雷电之力觉醒！'
    ];
    
    const randomSpell = spells[Math.floor(Math.random() * spells.length)];
    
    result.innerHTML = randomSpell;
    result.style.animation = 'magicGlow 1s ease-in-out';
    
    // 添加魔法光效动画
    const style = document.createElement('style');
    style.textContent = \`
        @keyframes magicGlow {
            0% { transform: scale(0.8); opacity: 0; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
        }
    \`;
    document.head.appendChild(style);
    
    console.log('魔法施展成功！', randomSpell);
}

// 页面加载完成后的欢迎消息
document.addEventListener('DOMContentLoaded', function() {
    console.log('🧙‍♂️ 欢迎来到前端魔法世界！');
    console.log('💡 提示：点击按钮施展魔法吧！');
});`;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new WebPlayground();
    
    console.log('🎉 Web演练场初始化完成！');
});