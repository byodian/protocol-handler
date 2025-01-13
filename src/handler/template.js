// 以下为脚本模版，您可以基于以下模版进行脚本编写

/**
 * 物模型方法
 */
const METHOD = {
  post: 'thing.event.property.post',
  get: 'thing.service.property.get',
  set: 'thing.service.property.set',
  action: 'thing.service.{identifier}',
}

/**
 * 设备到云消息解析
 * 将设备的自定义格式数据转换为标准协议的数据，设备上报数据到物联网平台时调用
 * 模拟执行输入参数，示例
 * {"inputConfig":{"identifier":"Ua","address":1,"port":1,"deviceName":""},"result":{"data":"AQQCAP44sA==","port":1}}
 * @param {string} jsonString '{"inputConfig":{"deviceName":"","port":1,"address":1,"identifier":""},"result":{"data":"AQQExBxgAC9y","port":1}}' 
 * @param {string} jsonString.inputConfig 输入参数元配置(设备名称、端口号、从机地址、物模型标识符)
 * @param {string} jsonString.result 设备返回的数据(base64编码, 端口号)
 * @param {string} jsonString.identifier 物模型标识符
 * @returns {object} result
 * @returns {string} result.data 物模型属性值
 * @returns {string} result.identifier 物模型标识符
 * @returns {string} result.method 物模型方法 
 * thing.event.property.post (主动上报) | thing.service.property.get (属性获取) | thing.service.property.set (属性设置) | thing.service.${identifier} (动作调用)
 */
function rawDataToProtocol(jsonString) {
  const jsonObj = {}
  return jsonObj
}

/**
 * 云到设备消息解析
 * 将标准协议的数据转换为设备能识别的格式数据，物联网平台给设备下发数据时调用
 * 模拟执行输入参数，示例
 * {"address":"1","type":"get","params":{"identifier":"Ua"}}
 * @param {string} jsonString "{\"deviceName\":\"1\",\"address\":\"1\",\"port\":\"1\",\"type\":\"get\",\"params\":{\"identifier\":"Ua"}}"
 * @param {string} jsonString.address 从机地址
 * @param {string} jsonString.type 指令类型 get(属性抄读)/set(属性设置)/action(动作调用)
 * @param {object} jsonString.params key-value 键值对
 * @param {object} jsonString.params.identifier 标识符
 * @param {object} jsonString.params.inputData 输入参数(属性设置和动作调用类型使用)
 * @param {string} jsonString.deviceName 设备名称
 * @returns {string} rawdata 设备能识别的格式数据
 */
function protocolToRawData(jsonObj) {
  const rawdata = ''
  return rawdata
}

