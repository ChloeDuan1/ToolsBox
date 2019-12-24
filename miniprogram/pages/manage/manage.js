// pages/manage/manage.js
var app = getApp()
Page({
  data: {
    Boxlist: [], // 数据列表
  },

  onLoad: function (options) {
    const db = wx.cloud.database();
    wx.cloud.callFunction({
      name: 'search',
      data: {
        table: 'Tools_Box_Address',
      },
      success: res => {
        console.log('[云函数] [search] user database: ', res)
        this.setData({
          Boxlist: res.result.data,
        })
      }, fail: err => {
        console.log('[云函数] [search] in GetBox调用失败: ', res)
        wx.showLoading({
          title: '【Tools_Box_Address】数据库连接失败',
        })
      }
    })
  },
  actioncnt: function (e) {
    var BoxName = e.currentTarget.dataset.boxname;
    wx.showActionSheet({
      itemList: ['禁止借用', '取消禁止'],
      success: function (res) {
        console.log(res.tapIndex)
        if(res.tapIndex == 0){
          wx.cloud.callFunction({
            name: 'ModifyModel',
            data: {
              boxname: BoxName,
              model: 'manage',
            },
            success: res => {
              console.log('[云函数] [update_permission] user database: ', res)
            }
          })
        }
        else if (res.tapIndex == 1){
          wx.cloud.callFunction({
            name: 'ModifyModel',
            data: {
              boxname: BoxName,
              model: 'normal',
            },
            success: res => {
              console.log('[云函数] [update_permission] user database: ', res)
            }
          })
        }
      },
      fail: function (res) {
        console.log(res.errMsg)
      }
    })
  }
})