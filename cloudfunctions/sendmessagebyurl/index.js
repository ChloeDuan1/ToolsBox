// 云函数入口文件
const cloud = require('wx-server-sdk')
const rp = require('request-promise');

cloud.init()
// 云函数入口函数
exports.main = async (event, context) => {
  const AccessToken_options = {
    method: 'POST',
    url: 'https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token='+event.Accesstoken,
    body: {
      'touser':event.useropenid,
      'template_id': 'zGlMHe2pqjSZUJeoK1FKEccSg7bxtsd589jt81Ua-6E',
      'page': 'pages/personal/personal',
      'form_id':event.formid,
      'emphasisKeyword': '',
      'data': {
        'keyword1': {
          value: event.toolid
        },
        'keyword2': {
          value: event.toolname
        },
        'keyword3': {
          value: event.toolstarttime
        },
        'keyword4': {
          value: event.toolborrowtime
        },
        'keyword5': {
          value: event.tip
        },
      },
    },
    json: true
  };
  //获取AccessToken
  const resultValue = await rp(AccessToken_options);
  const token = resultValue.errmsg;
  return token;
}