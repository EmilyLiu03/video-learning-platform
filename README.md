# 视频学习平台

基于video.js的视频学习平台，专注于本地化学习，支持术语库功能。

## 项目特点

- 管理员专属视频上传功能，普通用户无法上传视频
- 类似YouTube/B站的视频卡片展示界面
- 视频播放页面集成术语库抽屉，方便学习专业术语
- 用户认证系统，支持注册和登录
- 响应式设计，适配各种设备

## 技术栈

- 前端：HTML, CSS, JavaScript, Video.js
- 后端：Node.js, Express
- 数据存储：JSON文件（开发环境）
- 视频存储：腾讯云VOD

## 安装与运行

### 前提条件

- Node.js (v14+)
- npm (v6+)

### 安装步骤

1. 克隆或下载项目代码
2. 安装依赖

```bash
npm install
```

3. 配置环境变量

复制 `.env.example` 文件为 `.env` 并填入您的配置信息：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入您的腾讯云VOD配置：

```
TENCENT_APP_ID=your_app_id_here
TENCENT_SECRET_ID=your_secret_id_here
TENCENT_SECRET_KEY=your_secret_key_here
PORT=3000
```

4. 启动服务器

```bash
npm start
```

5. 访问应用

打开浏览器，访问 http://localhost:3000

## 账户信息

### 管理员账户

- 用户名：admin
- 密码：password

## 功能说明

### 普通用户

- 浏览视频列表
- 观看视频
- 使用术语库查询专业术语
- 搜索视频

### 管理员

- 上传视频到平台
- 管理术语库（添加、编辑、删除术语）
- 管理视频（删除视频）

## 项目结构

```
├── backend/             # 后端代码
│   ├── data/            # 数据存储
│   ├── routes/          # API路由
│   └── server.js        # 服务器入口
├── frontend/            # 前端代码
│   ├── src/             # 源代码
│   │   ├── css/         # 样式文件
│   │   ├── js/          # JavaScript文件
│   │   └── pages/       # HTML页面
│   └── index.html       # 首页
└── package.json         # 项目配置
```

## 注意事项

- 本项目为演示项目，使用JSON文件存储数据，生产环境建议使用数据库
- 视频上传功能需要配置腾讯云VOD服务的真实密钥信息
- 默认管理员密码为"password"，实际使用时请修改为更安全的密码
- **重要**：`.env` 文件包含敏感信息，已在 `.gitignore` 中忽略，请勿将其提交到版本控制系统
- 团队协作时，请通过安全渠道分享环境变量配置，不要在代码中硬编码敏感信息
