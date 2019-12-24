// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const time = new Date()
  var year = time.getFullYear()
  var month = time.getMonth() + 1
  var day = time.getDate()

  month = month.toString()
  if (month[1] == null) {
    month = '0' + month
  }
  day = day.toString()
  if (day[1] == null) {
    day = '0' + day
  }

  var hour = time.getHours()+8
  var minute = time.getMinutes()
  var second = time.getSeconds()
  hour = hour.toString()
  if (hour[1] == null){
    hour = '0' + hour
  }
  minute = minute.toString()
  if (minute[1] == null) {
    minute = '0' + minute
  }
  second = second.toString()
  if (second[1] == null) {
    second = '0' + second
  }
 return year + '/' + month + '/' + day + ' ' + hour + ':' + minute + ':' + second
}
