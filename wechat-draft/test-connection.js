const axios = require('axios');

const appId = process.env.WECHAT_APP_ID;
const appSecret = process.env.WECHAT_APP_SECRET;

if (!appId || !appSecret) {
  console.log('❌ 环境变量未设置');
  console.log('请重启命令行窗口后重试');
  process.exit(1);
}

console.log('正在测试微信API连接...');
console.log('AppID:', appId);

const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;

axios.get(url)
  .then(res => {
    if (res.data.access_token) {
      console.log('✅ 微信API连接成功！');
      console.log('access_token:', res.data.access_token.substring(0, 20) + '...');
      console.log('有效期:', res.data.expires_in, '秒（约2小时）');
    } else {
      console.log('❌ API返回错误:', res.data);
    }
  })
  .catch(err => {
    console.error('❌ 网络错误:', err.message);
  });
