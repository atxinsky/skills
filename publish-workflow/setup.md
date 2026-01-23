# 公众号自动发布系统 - 配置指南

## 📋 前置准备

### 1. 获取微信公众号凭证

**步骤**：
1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 左侧菜单：设置与开发 → 基本配置
3. 找到 **开发者ID(AppID)** 和 **开发者密码(AppSecret)**
4. 如果AppSecret未生成，点击"重置"生成新的

**注意**：
- AppSecret只显示一次，务必保存
- 服务号和订阅号都支持

---

### 2. 配置环境变量

**Windows (PowerShell)**：

编辑环境变量：
```powershell
# 方法1: 临时设置（当前会话有效）
$env:WECHAT_APP_ID="wx1234567890abcdef"
$env:WECHAT_APP_SECRET="your_32_character_secret_here"

# 方法2: 永久设置
[System.Environment]::SetEnvironmentVariable("WECHAT_APP_ID", "wx1234567890abcdef", "User")
[System.Environment]::SetEnvironmentVariable("WECHAT_APP_SECRET", "your_32_character_secret_here", "User")

# 验证
echo $env:WECHAT_APP_ID
```

**Windows (Git Bash/WSL)**：

编辑 `~/.bashrc`：
```bash
# 添加以下内容
export WECHAT_APP_ID="wx1234567890abcdef"
export WECHAT_APP_SECRET="your_32_character_secret_here"

# 保存后刷新
source ~/.bashrc

# 验证
echo $WECHAT_APP_ID
```

**macOS/Linux**：

编辑 `~/.zshrc` 或 `~/.bashrc`：
```bash
export WECHAT_APP_ID="wx1234567890abcdef"
export WECHAT_APP_SECRET="your_32_character_secret_here"

# 刷新
source ~/.zshrc

# 验证
echo $WECHAT_APP_ID
```

---

### 3. 安装Node.js依赖

**安装image-generator依赖**：
```bash
cd C:\Users\atxin\.claude\skills\image-generator
npm init -y
npm install canvas
```

**安装wechat-draft依赖**：
```bash
cd C:\Users\atxin\.claude\skills\wechat-draft
npm init -y
npm install axios form-data marked
```

**注意**：如果Canvas安装失败（Windows常见问题），参考下面的解决方案。

---

## 🔧 Canvas安装问题解决

### Windows安装Canvas

**问题**：Canvas需要编译，Windows可能报错

**解决方案1：使用预编译版本**
```bash
npm install canvas --canvas_binary_host_mirror=https://registry.npmmirror.com/-/binary/canvas/
```

**解决方案2：安装Windows编译工具**
```bash
# 以管理员身份运行PowerShell
npm install --global windows-build-tools

# 然后再安装canvas
npm install canvas
```

**解决方案3：使用WSL**
```bash
# 在WSL中安装依赖更稳定
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
npm install canvas
```

---

## ✅ 验证安装

### 测试1：检查环境变量
```bash
node -e "console.log('AppID:', process.env.WECHAT_APP_ID)"
node -e "console.log('AppSecret:', process.env.WECHAT_APP_SECRET ? '已配置' : '未配置')"
```

### 测试2：测试Canvas
```bash
cd C:\Users\atxin\.claude\skills\image-generator
node -e "const {createCanvas} = require('canvas'); console.log('Canvas安装成功')"
```

### 测试3：测试微信API连接
```bash
cd C:\Users\atxin\.claude\skills\wechat-draft
node -e "
const axios = require('axios');
const appId = process.env.WECHAT_APP_ID;
const appSecret = process.env.WECHAT_APP_SECRET;
axios.get(\`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=\${appId}&secret=\${appSecret}\`)
  .then(res => console.log('微信API连接成功:', res.data.access_token ? '✅' : '❌'))
  .catch(err => console.error('连接失败:', err.message));
"
```

---

## 🎯 下一步

配置完成后，参考 `使用指南.md` 开始发布文章。
