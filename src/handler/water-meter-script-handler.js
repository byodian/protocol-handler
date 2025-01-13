/**
 * 水表脚本
 * v1 2024-12-30 17:15
 * v2 2025-01-16 10:35 数据增加校验和base64编码
 */

// const Buffer = require('buffer/').Buffer

const DATA_TYPES = {
  UINT_8: {
    bytes: 1,
    parse: (bytes) => {
      return bytes[0]
    },
  },
  UINT_16: {
    bytes: 2,
    parse: (bytes) => {
      return (bytes[0] << 8) | bytes[1]
    },
  },
  INT_16: {
    bytes: 2,
    parse: (bytes) => {
      const value = (bytes[0] << 8) | bytes[1]
      return value > 0x7FFF ? value - 0x10000 : value
    },
  },
  UINT_32: {
    bytes: 4,
    parse: (bytes) => {
      return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]
    },
  },
  INT_32: {
    bytes: 4,
    parse: (bytes) => {
      // const value = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]
      // return value > 0x7FFFFFFF ? value - 0x100000000 : value
      const buffer = new ArrayBuffer(4)
      const view = new DataView(buffer)
      view.setUint8(0, bytes[0])
      view.setUint8(1, bytes[1])
      view.setUint8(2, bytes[2])
      view.setUint8(3, bytes[3])
      return view.getInt32(0, false) // 大端模式
    },
  },
  FLOAT_32: {
    bytes: 4,
    parse: (bytes) => {
      const buffer = new ArrayBuffer(4)
      const view = new DataView(buffer)
      view.setUint8(0, bytes[0])
      view.setUint8(1, bytes[1])
      view.setUint8(2, bytes[2])
      view.setUint8(3, bytes[3])
      return view.getFloat32(0, false) // 大端模式
    },
  },
  FLOAT_64: {
    bytes: 8,
    parse: (bytes) => {
      const buffer = new ArrayBuffer(8)
      const view = new DataView(buffer)
      for (let i = 0; i < 8; i++) {
        view.setUint8(i, bytes[i])
      }
      return view.getFloat64(0, false) // 大端模式
    },
  },
  BCD: {
    bytes: null, // BCD 长度不固定
    parse: (bytes) => {
      // @param {numbers} Uint8Array
      const numbers = bytes
        .map((byte) => {
          const high = (byte >> 4) & 0x0F // 高 4 位
          const low = byte & 0x0F        // 低 4 位
          return `${high}${low}`        // 拼接成字符串
        })

      return Array.from(numbers)
        .map(n => n.toString().padStart(2, '0')) 
        .join('') // 合并所有字节
    },
  },
}

const METHOD = {
  post: 'thing.event.property.post',
  get: 'thing.service.property.get',
  set: 'thing.service.property.set',
  action: 'thing.service.{identifier}',
}

/**
 * 请求帧配置
 * address 寄存器起始地址
 * dataLength: 寄存器的个数，每个寄存器可以存储两个字节长度的数据，高位在前，地位在后
 */
const FUNCTION_CODE_MAP = {
  // 属性抄读
  get: {
    WaterCFV: { address: 0x9C4D, dataLength: 2, functionCode: 0x03, desc: '总用水量' },
    Temp: { address: 0x9C69, dataLength: 1, functionCode: 0x03, desc: '表内温度' },
    Version: { address: 0x9DA0, dataLength: 2, functionCode: 0x03, desc: '版本号' },
    Time: { address: 0xA410, dataLength: 4, functionCode: 0x03, desc: '表内时间' },
    Relay: { address: 0x9C6A, dataLength: 1, functionCode: 0x03, desc: '读取闸控状态' },
    DayWaterCFV: { address: 0x9C6C, dataLength: 62, functionCode: 0x03, desc: '读取近31日冻结总用水量，4字节表示一个用水量' },
  },
  // 属性设置
  set: {
    Time: { address: 0xA410, dataLength: 4, byteLength: 8, functionCode: 0x10, desc: '水表校时' },
  },
  // 动作调用
  action: {
    Relay: { address: 0x9C6A, dataLength: 1, byteLength: 2, functionCode: 0x10, desc: '开合闸，切闸 01 合闸 02' },
  },
}

// 响应帧数据类型
const DATA_TYPE_MAP = {
  WaterCFV: 'UINT_32',
  Temp: 'UINT_16',
  Version: 'BCD',
  Relay: 'UINT_16',
  Time: 'UINT_8',
  DayWaterCFV: 'UINT_32',
}

/**
 * 设备到云消息解析
 * 模拟执行输入参数
 * 1. Time
 * {"inputConfig":{"identifier":"Time","address":254,"port":1},"result":{"data":"/gMIFBgMAQkPAy9xgQ==","port":1}}
 * 2. Version
 * {"inputConfig":{"identifier":"Version","address":254,"port":1},"result":{"data":"/gMEIpQBGX7y","port":1}}
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
  const KEY_INPUT_CONFIG = 'inputConfig'
  const KEY_RESULT = 'result'
  const KEY_PORT = 'port'
  const KEY_ADDRESS = 'address'
  const KEY_IDENTIFIER = 'identifier'
  const KEY_DATA = 'data'

  const jsonData = JSON.parse(jsonString)
  const dataKeys = Object.keys(jsonData)
  if (!dataKeys.includes(KEY_INPUT_CONFIG) || !dataKeys.includes(KEY_RESULT)) {
    throw new Error('入参缺少 inputConfig 或 result 字段')
  }

  const inputConfig  = jsonData.inputConfig
  const inputConfigKeys = Object.keys(inputConfig)
  if (!inputConfigKeys.includes(KEY_ADDRESS) || !inputConfigKeys.includes(KEY_ADDRESS) || !inputConfigKeys.includes(KEY_IDENTIFIER)) {
    throw new Error('入参 inputConfig 缺少 address、port 或 identifier 字段')
  }

  const result = jsonData.result
  const resultKeys = Object.keys(result)
  if (!resultKeys.includes(KEY_DATA) || !resultKeys.includes(KEY_PORT)) {
    throw new Error('入参 result 缺少 data 或 port 字段')
  }

  // 报文帧
  const rawData = result.data.replace(/\s+|^0x/g, '')
  // base64 decode
  const rawDataHexStr = base64Decode(rawData).toString('hex').toUpperCase()

  // 校验CRC
  const deviceCRC = rawDataHexStr.slice(-4)
  const calculatedCRC = checkCRC16(rawDataHexStr.slice(0, -4))
  if (deviceCRC !== calculatedCRC) {
    throw new Error('CRC校验失败')
  }
  
  // 将十六进制字符串转换为 ArrayBuffer
  const buffer = hexStringToArrayBuffer(rawDataHexStr)
        
  // 创建 Uint8Array 视图
  const frame = new Uint8Array(buffer)
        
  // 检查帧长度
  if (frame.length < 4) {
    throw new Error('Modbus RTU帧长度太短')
  }

  // 设备上报的数据与记录不一致
  if (inputConfig.port !== result.port || inputConfig.address !== frame[0]) {
    throw new Error(`设备上报数据有误 input - port ${inputConfig.port} address ${inputConfig.address}, output - port ${result.port} address ${frame[0]}`)
  }

  const parseFrame = {
    0x03: parsePropertyData,
    0x10: parseWriteReply,
  }

  // 标识符
  const identifier = inputConfig.identifier
  // 报文帧第二个字节为功能码
  const parser = parseFrame[frame[1]]
  const data = parser(frame, identifier)
  return {
    ...data,
    identifier,
  }
}

/**
 * 云到设备消息解析
 * 模拟执行输入参数 
 * 1. 抄读数据
 * {"address":"1","type":"get","params":{"identifier":"Time"}}
 * 2. 属性设置
 * {"address":"1","type":"set","params":{"identifier":"Time","inputData":{"Time":1736478033533}}}
 * 3. 动作调用
 * {"address":"1","type":"action","params":{"identifier": "Relay", "inputData": { "Relay": 1 }}}
 * @param {string} jsonString "{\"address\":\"1\",\"type\":\"get\",\"params\":{\"identifier\":Time}}"
 * @param {string} jsonString.address 从机地址
 * @param {string} jsonString.type 指令类型 get(属性抄读)/set(属性设置)/action(动作调用)
 * @param {object} jsonString.params key-value 键值对
 * @param {object} jsonString.params.identifier 标识符
 * @param {object} jsonString.params.inputData 输入参数(属性设置和动作调用类型使用)
 * @param {string} jsonString.deviceName 设备名称
 * @returns {string} rawdata 设备能识别的格式数据
 */
function protocolToRawData(jsonString) {
  const KEY_ADDRESS = 'address'
  const KEY_PARAMS = 'params'
  const KEY_TYPE = 'type'
  const jsonData = JSON.parse(jsonString)
  if (!Object.keys(jsonData).includes(KEY_ADDRESS) 
    || !Object.keys(jsonData).includes(KEY_TYPE)
    || !Object.keys(jsonData).includes(KEY_PARAMS)) {
    throw new Error('入参缺少 address、params 或 type 字段')
  }

  const type = jsonData[KEY_TYPE]
  if (!Object.keys(FUNCTION_CODE_MAP).includes(type)) {
    throw new Error(`指令类型 ${type} 不支持，支持的指令类型有：get、set 和 action`)
  }

  const identifierMap = FUNCTION_CODE_MAP[type]

  const params = jsonData[KEY_PARAMS]
  const paramKeys = Object.keys(params)

  // 参数中必须包含标识符
  const KEY_IDENTIFIER = 'identifier'
  if (!paramKeys.includes(KEY_IDENTIFIER)) {
    throw new Error('入参 params 中缺少标识符 identifier 字段')
  }

  // 传入的标识符
  const identifier = params[KEY_IDENTIFIER]
  if (!Object.keys(identifierMap).includes(identifier)) {
    throw new Error(`不支持的标识符：${identifier}`)
  }

  // 指令属性配置
  // { address: 0x9C4D, dataLength: 2, functionCode: 0x03, desc: '总用水量' }
  const instructionConfig = identifierMap[identifier]
  const functionCode = parseInt(instructionConfig.functionCode)

  // 从机地址
  const slaveAddress = parseInt(jsonData[KEY_ADDRESS])

  // 寄存器起始地址
  const registerStartAddress = instructionConfig.address

  // 数据长度 - 寄存器个数
  const dataLength = instructionConfig.dataLength

  if (functionCode === 0x04 || functionCode === 0x03) {
    // 从机地址+功能码+寄存器起始地址+数据长度+校验码
    const dataHexStr = `${toHexString(slaveAddress)}${toHexString(functionCode)}${toHexString(registerStartAddress, 4)}${toHexString(dataLength, 4)}`
    const buffer = hexStringToArrayBuffer(dataHexStr)
    const dataFrame = new Uint8Array(buffer)
    const fullFrameHexStr = dataHexStr + toHexString(calculateCRC16(dataFrame), 4)
    return base64Encode(hexStringToArrayBuffer(fullFrameHexStr))
  } else if (functionCode === 0x10) {
    const KEY_INPUT_DATA = 'inputData'
    if (!paramKeys.includes(KEY_INPUT_DATA)) {
      throw new Error('入参 params 中缺少输入参数 inputData 字段')
    }

    // 输入参数
    const inputData = params[KEY_INPUT_DATA]

    const identifierValue = inputData[identifier]
    if (typeof identifierValue === 'undefined') {
      throw new Error(`入参 inputData 中缺少标识符 ${identifier} 的值`)
    }

    // 字节长度
    const byteLength = instructionConfig.byteLength
    let frameHexStr = `${toHexString(slaveAddress)}${toHexString(functionCode)}${toHexString(registerStartAddress, 4)}${toHexString(dataLength, 4)}${toHexString(byteLength)}`

    if (identifier === 'Time') {
      // 获取中国时间
      const localTime  = new Date(identifierValue + 8 * 60 * 60 * 1000)

      // 分别获取 年、月、日、星期、时间
      const year = localTime.getUTCFullYear()
      const leftHalfYear = Number(year.toString().slice(0, 2))
      const rightHalfYear = Number(year.toString().slice(2))
      const month = localTime.getUTCMonth() + 1 // 月份从0开始，需要+1
      const weekday = localTime.getUTCDay()
      const day = localTime.getUTCDate()
      const hour = localTime.getUTCHours()
      const minutes = localTime.getUTCMinutes()
      const seconds = localTime.getUTCSeconds()
      const dataBytes = `${toHexString(leftHalfYear)}${toHexString(rightHalfYear)}${toHexString(month)}${toHexString(weekday)}${toHexString(day)}${toHexString(hour)}${toHexString(minutes)}${toHexString(seconds)}`
      frameHexStr = frameHexStr + dataBytes
    } else {
      const dataBytes = toHexString(identifierValue, 4)
      frameHexStr = frameHexStr + dataBytes
    }

    const buffer = hexStringToArrayBuffer(frameHexStr)
    const dataFrame = new Uint8Array(buffer)
    const fullFrameHexStr = frameHexStr + toHexString(calculateCRC16(dataFrame), 4)
    return base64Encode(hexStringToArrayBuffer(fullFrameHexStr))
  } else {
    throw new Error(`不支持的功能码：${functionCode}`)
  }
}

/**
 * 十六进制字符串转 ArrayBuffer
 * @param {string} hexString 
 * @returns ArrayBuffer
 */
function hexStringToArrayBuffer(hexString, radix = 16) {
  // 移除可能的空格和 '0x' 前缀
  hexString = hexString.replace(/\s+|0x/g, '')
        
  // 确保字符串长度为偶数
  if (hexString.length % 2 !== 0) {
    throw new Error('Invalid hex string')
  }
        
  // 创建 ArrayBuffer
  const buffer = new ArrayBuffer(hexString.length / 2)
  const view = new Uint8Array(buffer)
        
  // 转换十六进制字符串
  for (let i = 0; i < hexString.length; i += 2) {
    view[i / 2] = parseInt(hexString.slice(i, i + 2), radix)
  }
        
  return buffer
}

function toHexString(number, maxLength = 2) {
  if (typeof number !== 'number') {
    throw new Error('非法数字')
  }

  return number.toString(16).toUpperCase().padStart(maxLength, '0')
}

/**
   * 解析 modbus RTU 帧数据 - 属性抄读
   * 报文帧第三个字节为数据长度
   * @param {Uint8Array} frame 
   * @returns {object} result
   * @returns {string} result.data 物模型属性值
   * @returns {string} result.method 物模型方法
   * thing.event.property.post (主动上报) | thing.service.property.get (属性获取) | thing.service.property.set (属性设置) | thing.service.${identifier} (动作调用)
   */
function parsePropertyData(frame, identifier) {
  if (!Object.keys(DATA_TYPE_MAP).includes(identifier)) {
    throw new Error(`不支持的标识符：${identifier}`)
  }

  // 获取属性的数据类型
  const dataType = DATA_TYPE_MAP[identifier]

  // 数据长度
  const dataLength = frame[2]
  const dataStartIndex = 3
  const dataEndIndex = dataStartIndex + dataLength

  // 数据部分
  const dataBytes = frame.slice(dataStartIndex, dataEndIndex)

  // 解析器
  const parser = DATA_TYPES[dataType].parse

  let data
  switch (identifier) {
    // 无符号 32 位，2位小数
    case 'Temp':
    case 'WaterCFV': {
      const result = parser(dataBytes)
      data = result / 100
      break
    }
    case 'Relay':
    case 'Version': 
      data = parser(dataBytes)
      break
    case 'Time': {
      // 8个字节，分别代表年(两个字节表示，0x1418 表示 2024)、月、周、日、时、分、秒
      const fullYear = parseInt([dataBytes[0], dataBytes[1]].join(''))
      const month = dataBytes[2] - 1
      const day = dataBytes[4]
      const hour = dataBytes[5]
      const minutes = dataBytes[6]
      const seconds = dataBytes[7]
      const curDate = new Date(fullYear, month, day, hour, minutes, seconds)
      data = curDate.getTime().toString()
      break
    }
    case 'DayWaterCFV': {
      const result = {}
      // 124 个字节，每4个字节表示一天的用水量，总共 31 天用水量
      for (let i = 0; i < dataLength; i += 4) {
        const byte = dataBytes.slice(i, i + 4)
        result[i / 4 + 1] = parser(byte) / 100
      }
      data = result
      break
    }
    default: 
      throw new Error(`不支持的标识符：${identifier}`)
  }

  // 物模型方法
  let method
  if (identifier === 'DayWaterCFV') {
    method = METHOD.action.replace('{identifier}', identifier)
  } else {
    method = METHOD.get
  }

  return {
    data,
    method,
  }
}

/**
   * 解析 modbus RTU 帧数据 - 属性设置和动作调用回复
   * 报文帧第三个字节为数据长度
   * @param {Uint8Array} frame 
   */
function parseWriteReply(frame, identifier) {
  if (!Object.keys(DATA_TYPE_MAP).includes(identifier)) {
    throw new Error(`不支持的标识符：${identifier}`)
  }

  const data = DATA_TYPES.UINT_16.parse(frame.slice(4, 6))
  let method

  if (identifier === 'Time') {
    method = METHOD.set
  } else {
    method = METHOD.action.replace('{identifier}', identifier)
  }

  return {
    data,
    method,
  }
}

/**
 * CRC16 校验计算方法
 * 字节顺序为大端法，高位在前，低位在后
 * @param {Uint8Array} buffer
 * @returns 
 */
function calculateCRC16(buffer) {
  let crc = 0xFFFF
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i]
    for (let j = 0; j < 8; j++) {
      if (crc & 0x0001) {
        crc = (crc >> 1) ^ 0xA001
      } else {
        crc >>= 1
      }
    }
  }

  // Swap bytes
  return ((crc & 0xFF) << 8) | ((crc >> 8) & 0xFF)
}

/**
 * CRC16 校验
 * @param {string} dataHexStr 
 * @returns 
 */
function checkCRC16(dataHexStr) {
  const buffer = hexStringToArrayBuffer(dataHexStr)
  const dataFrame = new Uint8Array(buffer)

  return toHexString(calculateCRC16(dataFrame), 4)
}

function base64Encode(param) {
  return Buffer.from(param).toString('base64')
}

function base64Decode(param) {
  return Buffer.from(param, 'base64')
}

export {
  rawDataToProtocol,
  protocolToRawData,
}
