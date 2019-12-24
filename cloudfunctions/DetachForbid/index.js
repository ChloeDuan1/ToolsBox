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
  let BorrowerInfo = await db.collection('User').where({
    state: _.eq('黑名单')
  }).get({
    success: res => {
      console.log('User查询成功！')
    }, fail: err => {
      console.log('User查询失败！')
    }
  })
  let Array_Borrower = BorrowerInfo.data
  try {
    for (let i = 0; i < Array_Borrower.length; i++) {
      var user = Array_Borrower[i].username
      var forbidtime = Array_Borrower[i].ForbidTime
      var weeknum = Array_Borrower[i].WeekNum
      var endtime = Systemtime
      var start_date = new Date(forbidtime.replace(/-/g, "/"));
      var end_date = new Date(endtime.replace(/-/g, "/"));
      var days = end_date.getTime() - start_date.getTime();
      var day = parseInt(days / (1000 * 60 * 60));
      if (day > parseInt(weeknum) * 24 * 7){
        let BorrowedTools = await db.collection('Tools_Information').where({
          Current_Borrower: user
        }).get({
          success: res => {
            console.log('Tools_Information查询成功！')
          }, fail: err => {
            console.log('Tools_Information查询失败！')
          }
        })
        let Array_Tools = BorrowedTools.data
        if (Array_Tools.length <= 0 ){
          const Forbid = await cloud.callFunction({
            name: 'update_permission',
            data: {
              username: user,
              status: '普通',
              forbidtime: '0',
              BorrowState: '0',
              WeekNum: weeknum
            },
            success: res => {
              console.log('[云函数] [update_permission] user database: ', res)
            }
          })
        }
        else{
          console.log('当前用户有工具未还！')
        }

      }
    }
  } catch (e) {
    console.error(e)
  }
}