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
 * 将设备的自定义格式数据转换为标准协议的数据，设备上报数据到物联网平台时调用
 * @param {string} jsonString "{\"data\": \"frame\", \"identifier\": \"Ua\"}"" 
 * @param {string} jsonString.data 报文帧
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
 * 将标准协议的数据转换为设备能识别的格式数据，物联网平台给设备下发数据时调用
 * @param {string} jsonString "{\"address\":\"1\",\"functionCode\":\"0x04\",\"params\":{\"FlowRate\":true}, \"deviceName\":\"123456789012\"}"
 * @param {string} jsonString.address 从机地址
 * @param {string} jsonString.functionCode 功能码
 * @param {object} jsonString.params 标识符 key-value 对
 * @param {string} jsonString.deviceName 设备名称
 * @returns {string} rawdata 设备能识别的格式数据
 */
function protocolToRawData(jsonObj) {
  const rawdata = ''
  return rawdata
}

