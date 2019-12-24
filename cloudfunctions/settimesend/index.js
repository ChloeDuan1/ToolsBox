// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  const GetTime = await cloud.callFunction({
    name: 'gettime',
    success: res => {
      console.log('gettime成功！')
    }, fail: err => {
      console.log('gettime失败！')
    }
  })
  var Systemtime = GetTime.result;
  let BorrowedTools =  await db.collection('Tools_Information').where({
    StartTime: _.neq("null")
  }).get({
    success: res => {
      console.log('Tools_Information查询成功！')
    }, fail: err => {
      console.log('Tools_Information查询失败！')
    }
  })
  
  let Array_Tools = BorrowedTools.data
  try{
    const accesstoken = await cloud.callFunction({
      name: 'getAccessToken',
      success: res => {
        console.log('getAccessToken成功！')
      }, fail: err => {
        console.log('getAccessToken失败！')
      }
    })
    for (let i = 0; i < Array_Tools.length; i++){
      var starttime = Array_Tools[i].StartTime
      var cycle = Array_Tools[i].Borrowing_Cycle
      var endtime = Systemtime
      var start_date = new Date(starttime.replace(/-/g, "/"));
      var end_date = new Date(endtime.replace(/-/g, "/"));
      var days = end_date.getTime() - start_date.getTime();
      var day = parseInt(days / (1000 * 60 * 60));
      day = cycle - day
      let Borrower = Array_Tools[i].Current_Borrower
      if (day <= 2){
        let BorrowerInfo = await db.collection('User').where({
          username: Borrower
        }).get({
          success: res => {
            console.log('User查询成功！')
          }, fail: err => {
            console.log('User查询失败！')
          }
        })
        let Array_Borrower = BorrowerInfo.data
        //调用云函数发送模板
        const send = await cloud.callFunction({
          name: 'sendmessagebyurl',
          data: {
            Accesstoken: accesstoken.result,
            useropenid: Array_Borrower[0]._openid,
            toolid: Array_Tools[i].ID,
            toolname: Array_Tools[i].Name,
            toolstarttime: Array_Tools[i].StartTime,
            toolborrowtime: Array_Tools[i].Borrowing_Cycle,
            tip: '借用工具即将逾期，请尽快归还！',
            formid: Array_Tools[i].Password,
          },
        })
      }
    }
    return send
  }catch(e){
    console.error(e)
  }
}