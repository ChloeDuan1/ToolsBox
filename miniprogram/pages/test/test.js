import { BTManager, ConnectStatus } from '../../wx-ant-ble/index.js';

Page({

  data: {
    // 蓝牙是否连接
    connected: false,
    // 成功连接的设备
    device: {},
    // 扫描到的设备
    devices: [],
    // 设备能够notify的特征
    notifyUUIDs: [],
    // 设备能够read的特征
    readUUIDs: [],
    // 设备能够write的特征
    writeUUIDs: [],
    deviceId:'',
  },

  onLoad: function (options) {
    // 初始化蓝牙管理器
    this.bt = new BTManager({
      debug: true
    });
    // 注册状态回调
    this.bt.registerDidUpdateConnectStatus(this.didUpdateConnectStatus.bind(this));
    // 注册发现外设回调
    this.bt.registerDidDiscoverDevice(this.didDiscoverDevice.bind(this));
    // 注册特征值改变回调
    this.bt.registerDidUpdateValueForCharacteristic(this.didUpdateValueForCharacteristic.bind(this));
  },

  // 状态改变回调
  didUpdateConnectStatus(res) {
    console.log('home registerDidUpdateConnectStatus', res);
    if (res.connectStatus === ConnectStatus.connected) {
      wx.hideLoading();
      this.setData({ connected: true, device: res.device });
      this.parseDeviceUUIDs(res.device);
    } else if (res.connectStatus === ConnectStatus.disconnected) {
      wx.hideLoading();
      wx.showToast({
        title: res.message,
        icon: 'none'
      })
      this.setData({ connected: false, notifyUUIDs: [], readUUIDs: [], writeUUIDs: [] });
    }
  },

  // 发现外设回调
  didDiscoverDevice(res) {
    console.log('home didDiscoverDevice', res);
    if (res.timeout) {
      console.log('home didDiscoverDevice', '扫描超时');
      wx.showToast({
        title: res.message,
        icon: 'none'
      })
    } else {
      let device = res.device;
      let devices = this.data.devices;
      function checkDevice(d, ds) {
        for (let v of ds) {
          if (v.deviceId === d.deviceId) {
            return true;
          }
        }
        return false;
      }
      if (!checkDevice(device, devices)) {
        devices.push(device);
      }
      this.setData({ devices });
    }
  },

  // 特征值改变回调
  didUpdateValueForCharacteristic(res) {
    console.log('home registerDidUpdateValueForCharacteristic', res);
  },

  parseDeviceUUIDs(device) {
    let { notifyUUIDs, readUUIDs, writeUUIDs } = this.data;
    for (let service of device.services) {
      for (let char of service.characteristics) {
        if (char.properties.notify) {
          notifyUUIDs.push({
            suuid: service.serviceId,
            cuuid: char.uuid,
            listening: false
          })
        }
        if (char.properties.read) {
          readUUIDs.push({
            suuid: service.serviceId,
            cuuid: char.uuid,
          })
        }
        if (char.properties.write) {
          writeUUIDs.push({
            suuid: service.serviceId,
            cuuid: char.uuid,
          })
        }
      }
    }
    this.setData({ notifyUUIDs, readUUIDs, writeUUIDs });
  },

  // 扫描
  _scan() {
    this.bt.scan({
      services: [],
      allowDuplicatesKey: false,
      interval: 0,
      timeout: 15000,
      deviceName: 'TOOLBOX',
      containName: ''
    }).then(res => {
      console.log('home scan success', res);
    }).catch(e => {
      console.log('home scan fail', e);
      wx.showToast({
        title: e.message,
        icon: 'none'
      });
    });
  },

  // 停止扫描
  _stopScan() {
    this.bt.stopScan().then(res => {
      console.log('home stopScan success', res);
    }).catch(e => {
      console.log('home stopScan fail', e);
    })
  },

  // 连接
  _connect(e) {
    let index = e.currentTarget.id;
    this.bt.stopScan();
    let device = this.data.devices[index];
    this.setData({
      deviceId:device.deviceId
    })
    this.bt.connect(device).then(res => {
      console.log('home connect success', res);
    }).catch(e => {
      wx.showToast({
        title: e.message,
        icon: 'none'
      });
      console.log('home connect fail', e);
    });
    wx.showLoading({
      title: '连接' + device.name,
    });
  },

  // 断开连接
  _disconnect() {
    this.bt.disconnect().then(res => {
      console.log('home disconnect success', res);
    }).catch(e => {
      console.log('home disconnect fail', e);
    })
  },

  // 监听/停止监听
  _notify(e) {
    let index = e.currentTarget.id;
    let { suuid, cuuid, listening } = this.data.notifyUUIDs[index];
    this.bt.notify({
      suuid, cuuid, state: !listening
    }).then(res => {
      console.log('home notify success', res);
      this.setData({ [`notifyUUIDs[${index}].listening`]: !listening });
    }).catch(e => {
      console.log('home notify fail', e);
    })
  },

  // 读特征值
  _read(e) {
    let index = e.currentTarget.id;
    let { suuid, cuuid } = this.data.readUUIDs[index];
    this.bt.read({
      suuid, cuuid
    }).then(res => {
      console.log('home read success', res);
    }).catch(e => {
      console.log('home read fail', e);
    })
  },

  // 向蓝牙模块写入数据，这里只做简单的例子，发送的是 'FFFF' 的十六进制字符串
  _write(e) {
    let index = e.currentTarget.id;
    let { suuid, cuuid } = this.data.writeUUIDs[index];
    var PortAddr = '01'
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
        deviceId: this.data.deviceId,
        serviceId: suuid,
        characteristicId: cuuid,
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
  }
})