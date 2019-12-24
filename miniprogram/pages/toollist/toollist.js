// pages/toollist/toollist.js
var app = getApp();
var util = require('../../utils/util.js'); 
import regeneratorRuntime from '../../libs/runtime.js' 
var gbk = require('../../utils/urlEncodeGBK.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    title:'',
    uhide: 0,
    isChecked:false,
    btnText:'可借用',
    updataID:'',
    ToolID:'',
    ToolName:'',
    ToolDetails:'',
    Openid: '',
    Time:'',
    UserINFO: [],
    boxname:'',
    bluetooth:'',
    portstate:'正在使用',
    Borrower:'',
    Portlist: [],
    Toollist: [],
    Showlist:[],
    SelectportAddr:'',
    _discoveryStarted:'',
    Formid:'',
    UserState:'',
    Role:'',
    isDisabled: false,
    model:'',
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      boxname: options.boxname,
      bluetooth: options.bluetooth,
      model: options.model
    })
    // 调用函数时，传入new Date()参数，返回值是日期和时间  
    var time = util.formatTime(new Date());
    // 再通过setData更改Page()里面的data，动态更新页面的数据  
    this.setData({
      Time: time,
      title: this.data.boxname

    });  
    var portstate = this.data.portstate

    var getAppInfo = app.globalData.openid;
    console.log(getAppInfo)
    // 初始化云 
    wx.cloud.init({
      env: 'toolsbox-test-220cc3',
      traceUser: true
    });

    // 初始化数据库
    const db = wx.cloud.database();
    db.collection(this.data.boxname).where({
      State: portstate
    }).get({
      success: res => {
        if (res.data.length >= 1) {
          this.setData({
            // Portlist: res.data,
            Openid: getAppInfo,
          })
          wx.cloud.callFunction({
            name: 'GetToolsInfo',
            data: {
              BoxName: this.data.boxname,
            },
            success: res => {
              this.setData({
                Showlist: res.result,
              })
              console.log('[云函数] [GetToolsInfo]调用成功: ', res.result)
            },
            fail: console.error
          }) 
        }
      }, fail: err => {
        wx.showToast({
          icon: "none",
          duration:1000,
          title: '查询格口信息失败',
        })
      }
     })
 
  },
  //借用按钮点击事件
  Borrow:function(e){
      this.setData({
        isDisabled: true//按钮置灰
      })
      console.log(this.data.isDisabled);

      console.log(e.detail.formId);
      var that = this;
      var id = e.currentTarget.dataset.id;
      var toolID = e.currentTarget.dataset.toolid;
      var toolName = e.currentTarget.dataset.toolname;
      var toolDetails = e.currentTarget.dataset.tooldetails;
      var portAddr = e.currentTarget.dataset.portaddr;
      let formId = e.detail.formId;
      console.log('formid:', formId)
      that.setData({
        updataID: id,
        ToolID: toolID,
        ToolName: toolName,
        ToolDetails: toolDetails,
        SelectportAddr: portAddr,
        Formid: formId
      })
      that.GetBorrower();
  },
  /*插入借用记录 */
Insert:function(){
  var that = this;
  wx.cloud.init({
    env: 'toolsbox-test-220cc3',
    traceUser: true
  });

  // 初始化数据库
  const db = wx.cloud.database();
  wx.cloud.callFunction({
    name: 'insert',
    data: {
      ToolID: that.data.ToolID,
      ToolName: that.data.ToolName,
      ToolDetails: that.data.ToolDetails,
      Borrower: that.data.Borrower,
      Time: that.data.Time,
      Action:'借用',
    },
    success: res => {
      console.log('[云函数] [insert] user database: ', res)
      //返回主界面
      wx.switchTab({
        url: '../index/index',
      })
    }
  })
},
  /*更改工具信息表 */
  Update:function(){
    // 初始化云 
    var that = this;
    wx.cloud.init({
      env: 'toolsbox-test-220cc3',
      traceUser: true
    });

    // 初始化数据库
    const db = wx.cloud.database();
    wx.cloud.callFunction({
      name: 'update',
      data: {
        dataid: that.data.updataID,
        status: '已借出',
        Borrower: that.data.Borrower,
        currenttime:that.data.Time,
        password: that.data.Formid
      },
      success: res => {
        console.log('[云函数] [update] user database: ', res)
        that.Insert();
      }
    })
  },
  //获取借用人信息
  GetBorrower:function(){
    var that = this;

    // 初始化云
    wx.cloud.init({
      env: 'toolsbox-test-220cc3',
      traceUser: true
    });  
    // 初始化数据库
    const db = wx.cloud.database();
    const _ = db.command;
    db.collection('User').where({
      _openid: that.data.Openid
    }).get({
      success: res => {
        if (res.data.length >= 1) {
          that.setData({
            Borrower: res.data[0].username,
            Userid: res.data[0]._id,
            UserState: res.data[0].state,
            Role: res.data[0].role
          })
          //管理员模式
          if (res.data[0].role == '管理员'){
            //连接蓝牙，开格口，接收到正确信息后写数据库
            that.openBluetoothAdapter();
          }
          else{
            if(that.data.model == 'manage'){
              wx.showToast({
                icon: "none",
                duration: 1000,
                title: '管理员正在排查，请等待！',
              })
            }
            else{
              //判断此人是否是黑名单
              if (res.data[0].state != '黑名单') {
                //连接蓝牙，开格口，接收到正确信息后写数据库
                that.openBluetoothAdapter();

              }
              else {
                wx.showToast({
                  icon: "none",
                  duration: 1000,
                  title: '你已被加入黑名单，请与管理员联系！',
                })
              } 
            }
          }
        }
        else {
          wx.navigateTo({
            url: '../load/load',
          })
        }
      }, fail: err => {
        wx.showToast({
          icon: "none",
          duration: 1000,
          title: '查询记录失败',
        })
      }
    })
  },
  //蓝牙连接
  //打开蓝牙适配器
  openBluetoothAdapter() {
    var that = this;
    wx.openBluetoothAdapter({
      success: (res) => {
        that.getBluetoothAdapterState()//获取本机适配器状态，判断是否可用
        console.log('openBluetoothAdapter success', res)
        that.startBluetoothDevicesDiscovery()//搜索附近蓝牙设备
      },
      fail: (res) => {
        if (res.errCode === 10001) {
          wx.showModal({
            title: '错误',
            content: '未找到蓝牙设备, 请打开蓝牙后重试。',
            showCancel: false
          })
          wx.onBluetoothAdapterStateChange(function (res) {
            console.log('onBluetoothAdapterStateChange', res)
          })
        }
      }
    })
  },
  ////获取本机适配器状态，判断是否可用
  getBluetoothAdapterState() {
    var that = this;
    wx.getBluetoothAdapterState({
      success: (res) => {
        console.log('getBluetoothAdapterState', res)

        var available = res.available,

          discovering = res.discovering;

        if (!available) {

          wx.showToast({

            title: '设备无法开启蓝牙连接',

            icon: 'none',

            duration: 2000

          })

          setTimeout(function () {

            wx.hideToast()

          }, 2000)

        } else {

          if (!discovering) {

            that.startBluetoothDevicesDiscovery();
          }
        }
      }
    })
  },
  //搜索附近蓝牙设备
  startBluetoothDevicesDiscovery() {
    var that = this
    wx.showLoading({
      title: '蓝牙搜索',
    })
    if (that.data._discoveryStarted) {
      return
    }
    that.setData({
      _discoveryStarted: true
    })

    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: true,
      success: (res) => {
        console.log('startBluetoothDevicesDiscovery success', res)
        that.onBluetoothDeviceFound()
      },
    })
  },
  //停止搜索附近蓝牙设备
  stopBluetoothDevicesDiscovery:function() {
    
    var that = this
    wx.stopBluetoothDevicesDiscovery({
      complete: () => {
        that.setData({
          _discoveryStarted: false
        })

      }
    })
  },
  //开启蓝牙设备监听
  onBluetoothDeviceFound() {
    var that = this;
    var BlueToothName = that.data.bluetooth;
    var deviceId = '';
    var devicename = '';
    console.log('开启蓝牙设备监听onBluetoothDeviceFound！！！')
    wx.onBluetoothDeviceFound((res) => {
      if (res.devices[0]) {

        var name = res.devices[0]['name'];

        if ((name != '') && (deviceId == '')) {

          if (name == BlueToothName) {

            deviceId = res.devices[0]['deviceId'];
            devicename = res.devices[0]['name'];
            that.setData({
              deviceId: deviceId,
              deviceName: devicename
            })
            if (that.data._discoveryStarted) {
              console.log('获取规定的蓝牙')
              that.startConnectDevices();
            }
            that.stopBluetoothDevicesDiscovery();
            console.log('设备停止发现')
          }
        }
      }
    })    
  },
  //连接蓝牙
  startConnectDevices: function () {
      var that = this;
      var deviceid = that.data.deviceId;
      var devicename = that.data.deviceName;
      // 监听设备的连接状态
      wx.onBLEConnectionStateChanged(function (res) {
        console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
      })
      //连接设备
      wx.createBLEConnection({
        deviceId: that.data.deviceId,
        success: function (res) {
          console.log('---createBLEConnection---success---:', res);
          wx.showToast({
            icon: "success",
            title: '蓝牙连接成功！',
          })
          //连接成功后开始获取设备的服务列表
          wx.getBLEDeviceServices({
            // 这里的 deviceId 需要在上面的 getBluetoothDevices中获取
            deviceId: that.data.deviceId,
            success: function (res) {
              console.log('device services:', res)
              console.log('device services:', res.services)
              that.setData({
                services: res.services
              });

              if (res.services.length >= 1) {
                console.log('device services:', that.data.services[0].uuid);
                that.setData({
                  serviceId: that.data.services[0].uuid
                });
                console.log('--------------------------------------');
                console.log('device设备的id:', that.data.deviceId);
                console.log('device设备的服务id:', that.data.serviceId);

                //延迟3秒，根据服务获取特征 
                setTimeout(function () {
                  wx.getBLEDeviceCharacteristics({
                    // 这里的 deviceId 需要在上面的 getBluetoothDevices
                    deviceId: that.data.deviceId,
                    // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
                    serviceId: that.data.serviceId,
                    success: function (res) {
                      console.log('000000000000---' + that.data.serviceId);
                      console.log('device getBLEDeviceCharacteristics:', res.characteristics)
                      if (res.characteristics.length >= 1) {
                        for (var i = 0; i < res.characteristics.length - 1; i++) {
                          let charc = res.characteristics[i];
                          if (charc.properties.notify) {
                            that.setData({ notify_id: charc.uuid });
                            console.log('notify_id:', that.data.notify_id);
                          }
                          if (charc.properties.write) {
                            that.setData({ write_id: charc.uuid });
                            console.log('write_id:', that.data.write_id);
                          }
                          if (charc.properties.read) {
                            console.log("Find flow control characteristic");
                          }
                        }
                      }
                      console.log('notify_id= ' + that.data.notify_id);
                      console.log('write_id= ' + that.data.write_id);
                      setTimeout(function () {
                        wx.notifyBLECharacteristicValueChanged({
                          // 启用 notify 功能          
                          // 这里的 deviceId 需要在上面的 getBluetoothDevices 或onBluetoothDeviceFound 接口中获取           
                          deviceId: that.data.deviceId,
                          serviceId: that.data.serviceId,
                          characteristicId: that.data.notify_id,
                          state: true,
                          success: function (res) {
                            console.log('notifyBLECharacteristicValueChanged success', res)
                            //借用工具
                            that.SearchDB();

                          }
                        })
                      }, 1500);

                    },
                    fail: function (res) {
                      console.log(res);
                    }
                  })
                }, 1500);
              }
            },
            fail: function (res) {
              console.log('---createBLEConnection---fail---:', res);
              wx.showModal({
                title: '提示',
                showCancel: false,
                content: '蓝牙连接失败，请重新连接',
                success: function (res) {

                },
                complete: function () {
                  wx.navigateBack({
                    delta: 1
                  })
                }
              })
            },
            complete: function (res) {
              console.log('---createBLEConnection---complete---:', res);
            }
          })
        }
      })
  },
  //查询数据库是否已更新
  SearchDB: function () {
    // 初始化云 
    var that = this;
    let id = that.data.ToolID
    wx.cloud.init({
      env: 'toolsbox-test-220cc3',
      traceUser: true
    });

    // 初始化数据库
    const db = wx.cloud.database();
    db.collection('Tools_Information').where({
      ID: id
    }).get({
      success: res => {
        let ArrayTool = res.data
        let stateTool = ArrayTool[0].State
        if (stateTool == '可借用'){
          that.IOSSenddata()
        }
        else{
          wx.showToast({
            icon: "none",
            duration: 1000,
            title: '所借工具已被借出',
          })
          return
        }
      }, fail: err => {
        wx.showToast({
          icon: "none",
          duration: 1000,
          title: '查询格口信息失败',
        })
      }
    })
  },
  //发送数据

  IOSSenddata: function () {
    var that = this;
    var PortAddr = that.data.SelectportAddr
    var CommandHead = "2101"
    var CommandTail = "0101010016"
    var hex = CommandHead + PortAddr + CommandTail;
    var typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(function (h) {
      return parseInt(h, 16)
    }))
    console.log('hex:' + hex)
    //分包发送数据
    for (var i = 0; i < typedArray.length; i += 20) {
      var endLength = 0
      var senddata = typedArray
      endLength = senddata.length
      let buffer = new ArrayBuffer(endLength)
      let dataView = new DataView(buffer)
      let dataSend = []
      for (var j = i; j < senddata.length; j++) {
        dataView.setUint8(j - i, senddata[j])
        dataSend.push(dataView.getUint8(j - i))
      }
      console.log('最后一包或仅有的第一包数据:' + dataSend)
      wx.writeBLECharacteristicValue({
        deviceId: that.data.deviceId,
        serviceId: that.data.serviceId,
        characteristicId: that.data.write_id,
        value: buffer,
        success: function (res) {
          console.log('一包writeBLECharacteristicValue success', res.errMsg)
          //ios读取蓝牙的返回值
          wx.onBLECharacteristicValueChange(function (characteristic) {
            console.log('characteristic value comed:', characteristic)

            let buffer = characteristic.value
            let dataView = new DataView(buffer)
            let dataResult = []
            console.log("拿到的数据")
            console.log("dataView.byteLength", dataView.byteLength)
            for (let i = 0; i < dataView.byteLength; i++) {
              console.log("0x" + dataView.getUint8(i).toString(16))
              dataResult.push(dataView.getUint8(i).toString(16))
            }
            const result = dataResult
            if (result[5] == '1') {
              console.log('开柜成功！')
              wx.showToast({
                icon: "none",
                duration: 2000,
                title: '开柜成功!请及时关闭柜门！',
              })
              that.closeBluetoothAdapter();
              //管理员权限
              if(that.data.Role == '管理员'){
                wx.showToast({
                  icon: "none",
                  duration: 2000,
                  title: '检查完成后请及时关闭柜门！',
                })
              }
              else{
                that.Update();  
              }
              return;
            }
            else {
              console.log('开柜失败！')
              wx.showToast({
                icon: "none",
                duration: 2000,
                title: '开柜失败，请及时联系管理员！',
              })
              that.closeBluetoothAdapter();
            }
          })

        },
        fail: function (res) {
          console.log('发送失败')
        }
      })
    }
  },
  ///读取蓝牙设备返回特征值并解析
  ReadBLECharacteristicValue: function () {
    var that = this;
    //安卓需要读取
    wx.readBLECharacteristicValue({
      deviceId: that.data.deviceId,
      serviceId: that.data.serviceId,
      characteristicId: that.data.write_id,
      success: function (res) {
        console.log('readBLECharacteristicValue:', res.errCode)
      },
      fail: function (res) {
        console.log('接收失败！')
      }

    })
  },
  //关闭蓝牙模块
  closeBluetoothAdapter() {
    wx.closeBluetoothAdapter()
    this._discoveryStarted = false
  },


  //获取手机型号
  getphonesystem: function () {
    var that = this;
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          phonesystem: res.platform
        })
      },
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.closeBluetoothAdapter()
  },
  closeBluetoothAdapter() {
    wx.closeBluetoothAdapter()
    this._discoveryStarted = false
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})
function inArray(arr, key, val) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) {
      return i
    }
  }
  return -1
}
