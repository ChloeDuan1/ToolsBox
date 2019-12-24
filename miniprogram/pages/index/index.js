//index.js
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    title: '加载中...',// 状态
    Boxlist: [], // 数据列表
    loading: true, // 显示等待框
    Role:'',
    openid: '',
  },

  onLoad: function (options) { // options 为 board页传来的参数
    // 初始化云
    wx.cloud.init({
      env: 'toolsbox-test-220cc3',
      traceUser: true
    });
    // 初始化数据库
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[云函数] [login] user openid: ', res.result.openid)
        this.data.openid = res.result.openid;
        wx.cloud.callFunction({
          name: 'DetectionID',
          data: {
            Openid: this.data.openid,
          },
          success: res => {
            console.log('[云函数] [DetectionID] 调用成功！ ',res.result)
              this.setData({
                Role: res.result,
              })
            if (this.data.Role == '管理员') {
              this.modalcnt();
            }
            if (this.data.Role == 'NULL'){
              wx.navigateTo({
                url: '../load/load',
              })
            }
            
          },
          fail: console.error
        })
      },
      fail: console.error
    })
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
          title: '工具柜分布情况',
          loading: false
        })
      }, fail: err => {
        console.log('[云函数] [search] in GetBox调用失败: ', res)
        wx.showLoading({
          title: '【Tools_Box_Address】数据库连接失败',
        })
      }
    })
  },
  modalcnt: function () {
    wx.showModal({
      title: '提示',
      content: '是否进入管理员模式？',
      success: function (res) {
        if (res.confirm) {
          console.log('进入管理员模式')
          wx.navigateTo({
            url: '../manage/manage',
          })
        } else if (res.cancel) {
          console.log('进入普通用户模式')
        }
      }
    })
  }
})