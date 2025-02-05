/**
 * 4G水表脚本
 * v1 2024-12-30 17:15
 * v2 2025-01-16 10:35 数据增加校验
 * v3.0 2025-02-05 16:29 删除 JSON.parse
 */

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

const METHOD = {
  post: 'thing.event.property.post',
  get: 'thing.service.property.get',
  set: 'thing.service.property.set',
  action: 'thing.service.{identifier}',
}

/**
 * 设备到云消息解析
 * 模拟执行输入参数
 * 1. Time
 * {"inputConfig":{"identifier":"Time"},"result":{"data":"HD45:AA030814180C01090F032F65B0"}}
 * @param {object} jsonData
 * @param {object} jsonData.inputConfig  inputConfig 输入参数元配置(设备名称、端口号、从机地址、物模型标识符)
 * @param {string} inputConfig.identifier 物模型标识符
 * @param {string} inputConfig.deviceName 设备名称
 * @param {object} jsonData.result result 设备返回的数据(16进制报文、端口号、设备名改)
 * @param {string} result.data 16进制报文
 * @param {string} result.deviceName 设备名称
 * @returns {object} result
 * @returns {string} result.data 物模型属性值
 * @returns {string} result.identifier 物模型标识符
 * @returns {string} result.method 物模型方法 
 * thing.event.property.post (主动上报) | thing.service.property.get (属性获取) | thing.service.property.set (属性设置) | thing.service.${identifier} (动作调用)
 */
function rawDataToProtocol(jsonData) {
  const KEY_RESULT = 'result'
  const KEY_INPUT_CONFIG = 'inputConfig'
  const dataKeys = Object.keys(jsonData)
  if (!dataKeys.includes(KEY_RESULT) || !dataKeys.includes(KEY_INPUT_CONFIG)) {
    throw new Error('入参缺少 inputConfig 或 result 字段')
  }

  const result = jsonData.result
  const resultKeys = Object.keys(result)
  const KEY_DATA = 'data'
  if (!resultKeys.includes(KEY_DATA)) {
    throw new Error('入参 result 缺少 data 字段')
  }

  // 报文帧
  const rawDataHexStr = result.data.replace(/\s+|^0x/g, '')
  const framePrefix = rawDataHexStr.slice(0, 5)
  // 抄读数据回复报文前缀 "HD45:"
  // 设备主动上报报文前缀 "HDLB:"
  if (framePrefix === 'HD45:') {
    const KEY_IDENTIFIER = 'identifier'
    const inputConfig  = jsonData.inputConfig
    const inputConfigKeys = Object.keys(inputConfig)
    if (!inputConfigKeys.includes(KEY_IDENTIFIER)) {
      throw new Error('入参 inputConfig 缺少 identifier 字段')
    }

    // 报文帧
    const frameHexString = rawDataHexStr.slice(5)

    // 校验CRC
    const deviceCRC = frameHexString.slice(-4)
    const calculatedCRC = checkCRC16(frameHexString.slice(0, -4))
    if (deviceCRC !== calculatedCRC) {
      throw new Error('CRC校验失败')
    }

    // 将十六进制字符串转换为 ArrayBuffer
    const buffer = hexStringToArrayBuffer(frameHexString)
        
    // 创建 Uint8Array 视图
    const frame = new Uint8Array(buffer)
        
    // 检查帧长度
    if (frame.length < 4) {
      throw new Error('Modbus RTU帧长度太短')
    }

    const parseFrame = {
      0x03: parsePropertyData,
      0x10: parseWriteReply,
    }

    // 标识符
    const identifier = inputConfig.identifier
    // 报文帧第二个字节为功能码
    const parser = parseFrame[frame[1]]
    const data =  parser(frame, identifier)
    return {
      ...data,
      identifier,
    }
  } else if (framePrefix === 'HDWB:') { 
    const KEY_DEVICE_NAME = 'deviceName'
    if (!resultKeys.includes(KEY_DEVICE_NAME)) {
      throw new Error('入参 result 缺少 deviceName 字段')
    }

    // 报文帧
    const frameHexString = rawDataHexStr.slice(5)

    // 校验CRC
    // const deviceCRC = frameHexString.slice(-2)
    // 校验和是从 L（含）开始到 S（含）字符的 HEX 相加取末字节
    // const calculatedCRC = checkCRC16(frameHexString.slice(0, -2))
    // if (deviceCRC !== calculatedCRC) {
    //   throw new Error('CRC校验失败')
    // }

    // const dataLengthFrame = frameHexString.slice(1, 5)
    // const dataLength = parseInt(dataLengthFrame.slice(1), 16)

    // 将topic中的设备名称与报文中解析的设备名称进行比较，不一致时抛出异常
    const deviceIdFromTopic = result.deviceName
    const deviceIdHexStringFromFrame = frameHexString.slice(10, 18)
    const highByte = swapHexByteOrder(deviceIdHexStringFromFrame.slice(4, 8))
    const lowByte = swapHexByteOrder(deviceIdHexStringFromFrame.slice(0, 4))
    const deviceIdFromFrame = toDecString(highByte, 6) + toDecString(lowByte, 6) 
    if (deviceIdFromFrame !== deviceIdFromTopic) {
      throw new Error('设备ID不一致')
    }

    // 时间
    const tFrameHex = frameHexString.slice(24, 38)
    const tUint8Array = new Uint8Array(hexStringToArrayBuffer(swapHexByteOrder(tFrameHex), 10))

    const fullYear = `20${tUint8Array[0]}`
    const month = tUint8Array[1] - 1
    const day = tUint8Array[3]
    const hour = tUint8Array[4]
    const minutes = tUint8Array[5]
    const seconds = tUint8Array[6]
    const curDate = new Date(fullYear, month, day, hour, minutes, seconds)
    const timestamp = curDate.getTime().toString()
 
    // 水表版本号
    const versionFrame = frameHexString.slice(63, 71)
    const swapedVersion = swapHexByteOrder(versionFrame)

    // 总用水量
    const waterCfvFrame = frameHexString.slice(105, 113)
    const waterCfv = calculatePower(waterCfvFrame)

    // 表内温度
    const tempFrame = frameHexString.slice(447, 451)
    const temp = parseInt(swapHexByteOrder(tempFrame), 16) / 100

    return {
      data: {
        Time: timestamp,
        Version: swapedVersion,
        Temp: temp,
        WaterCFV: waterCfv,
      },
      method: METHOD.post,
      identifier: 'all',
    }
  } else {
    throw new Error('非法报文帧')
  }
}

/**
 * 云到设备消息解析
 * 模拟执行输入参数 
 * 1. 抄读数据
 * {"type":"get","params":{"identifier":"Time"}}
 * 2. 属性设置
 * {"type":"set","params":{"identifier":"Time","inputData":{"Time":1736478033533}}}
 * 3. 动作调用
*  {"type":"action","params":{"identifier":"Relay","inputData":{"Relay":1}}}
 * @param {object} jsonData
 * @param {string} jsonData.type 指令类型 get(属性抄读)/set(属性设置)/action(动作调用)
 * @param {object} jsonData.params key-value 键值对
 * @param {object} jsonData.params.identifier 标识符
 * @param {object} jsonData.params.inputData 输入参数(属性设置和动作调用类型使用)
 * @param {string} jsonData.deviceName 设备名称
 * @returns {string} rawdata 设备能识别的格式数据
 */
function protocolToRawData(jsonData) {
  const KEY_PARAMS = 'params'
  const KEY_TYPE = 'type'
  if (!Object.keys(jsonData).includes(KEY_TYPE) || !Object.keys(jsonData).includes(KEY_PARAMS)) {
    throw new Error('入参缺少 params 或 type 字段')
  }

  const type = jsonData[KEY_TYPE]
  if (!Object.keys(FUNCTION_CODE_MAP).includes(type)) {
    throw new Error(`指令类型 ${type} 不支持，支持的指令类型有：get、set 和 action`)
  }

  const params = jsonData[KEY_PARAMS]
  const paramKeys = Object.keys(params)
  const KEY_IDENTIFIER = 'identifier'
  if (!paramKeys.includes(KEY_IDENTIFIER)) {
    throw new Error('入参 params 中缺少标识符 identifier 字段')
  }

  // 传入的标识符
  const identifierMap = FUNCTION_CODE_MAP[type]
  const identifier = params[KEY_IDENTIFIER]
  if (!Object.keys(identifierMap).includes(identifier)) {
    throw new Error(`不支持的标识符：${identifier}`)
  }

  // 指令属性配置
  // { address: 0x9C4D, dataLength: 2, functionCode: 0x03, desc: '总用水量' }
  const instructionConfig = identifierMap[identifier]
  const functionCode = parseInt(instructionConfig.functionCode)

  // 从机地址
  const slaveAddress = 0xAA

  // 寄存器起始地址
  const registerStartAddress = instructionConfig.address

  // 数据长度 - 寄存器个数
  const dataLength = instructionConfig.dataLength

  if (functionCode === 0x04 || functionCode === 0x03) {
    // 从机地址+功能码+寄存器起始地址+数据长度+校验码
    const dataHexStr = `${toHexString(slaveAddress)}${toHexString(functionCode)}${toHexString(registerStartAddress, 4)}${toHexString(dataLength, 4)}`
    const buffer = hexStringToArrayBuffer(dataHexStr)
    const dataFrame = new Uint8Array(buffer)
    return `HD45:${dataHexStr}${toHexString(calculateCRC16(dataFrame), 4)}`
  } else if (functionCode === 0x10) { 
    const KEY_INPUT_DATA = 'inputData'
    if (!paramKeys.includes(KEY_INPUT_DATA)) {
      throw new Error('入参 params 中缺少输入参数 inputData 字段')
    }

    // 输入参数
    const inputData = params[KEY_INPUT_DATA]

    // 属性值
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
    return `HD45:${frameHexStr}${toHexString(calculateCRC16(dataFrame), 4)}`
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
 * 
 * @param {string} hexString 十六进制字符串
 * @param {number} maxLength 
 * @returns 十进制字符串
 */
function toDecString(hexString, maxLength) {
  return parseInt(hexString, 16).toString().padStart(maxLength, '0')
}

// 计算功率
function calculatePower(dataHexStr) {
  const swapedFrame = swapHexByteOrder(dataHexStr)
  const int = parseInt(swapedFrame.slice(0, -2), 16)
  const decimal = parseInt(swapedFrame.slice(-2), 16)
  return int + decimal / 100
}

function swapHexByteOrder(hexStr) {
  const buffer = hexStringToArrayBuffer(hexStr)
  // 创建 Uint8Array 视图
  const frame = new Uint8Array(buffer)
  return Array.from(frame).reverse().map(byte => toHexString(byte)).join('')
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
      data = parser(dataBytes) / 100
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
   * @returns {object} result
   * @returns {string} result.data 物模型属性值
   * @returns {string} result.method 物模型方法
   * thing.event.property.post (主动上报) | thing.service.property.get (属性获取) | thing.service.property.set (属性设置) | thing.service.${identifier} (动作调用)
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

export {
  rawDataToProtocol,
  protocolToRawData,
}
