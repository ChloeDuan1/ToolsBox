// 云函数入口文件
const cloud = require('wx-server-sdk')
const rp = require('request-promise');

cloud.init()
// 云函数入口函数
exports.main = async (event, context) => {
  //appid   和秘钥
  const appid = 'wx4b4fffcd6b68cb36',
    secret = '721f6d5c3705f9971d706254ad96e54f';

  const AccessToken_options = {
    method: 'GET',
    url: 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET',
    qs: {
      appid,
      secret,
      grant_type: 'client_credential'
    },
    json: true
  };
  //获取AccessToken
  const resultValue = await rp(AccessToken_options);
  const token = resultValue.access_token;
  return token;
}