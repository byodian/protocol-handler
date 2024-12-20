/**
 * 流量计算脚本
 */

const DATA_TYPES = {
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
}

/**
 * 请求帧配置
 * address 寄存器起始地址
 * dataLength: 寄存器的个数，每个寄存器可以存储两个字节长度的数据，高位在前，地位在后
 */
const FUNCTION_CODE_MAP = {
  0x04: {
    FlowRate: { address: 0x1010, dataLength: 2, desc: '瞬时流量' },
    FlowVelocity: { address: 0x1012, dataLength: 2, desc: '瞬时流速' },
    FlowRateUnit: { address: 0x1020, dataLength: 1, desc: '瞬时流量单位' },
    TotalFlowUnit: { address: 0x1021, dataLength: 1, desc: '累计流量单位' },
    AlarmUpperLimit: { address: 0x1022, dataLength: 1, desc: '上限报警' },
    AlarmLowerLimit: { address: 0x1023, dataLength: 1, desc: '下限报警' },
    AlarmEmptyPipe: { address: 0x1024, dataLength: 1, desc: '空管报警' },
    AlarmSystem: { address: 0x1025, dataLength: 1, desc: '系统报警' }, 
    TotalFlow: { address: 0x1018, dataLength: 4, desc: '正向累计流量' },
  },
}

// 响应帧数据类型
const DATA_TYPE_MAP = {
  FlowRate: ['FLOAT_32'],
  FlowVelocity: ['FLOAT_32'],
  FlowRateUnit: ['UINT_16'],
  TotalFlowUnit: ['UINT_16'],
  AlarmUpperLimit: ['UINT_16'],
  AlarmLowerLimit: ['UINT_16'],
  AlarmEmptyPipe: ['UINT_16'],
  AlarmSystem: ['UINT_16'], 
  TotalFlow: ['UINT_32', 'FLOAT_32'],
}

const METHOD = {
  post: 'thing.event.property.post',
  get: 'thing.service.property.get',
  set: 'thing.service.property.set',
  action: 'thing.service.{identifier}',
}

/**
 * 解析 Modbus RTU 帧
 * Modbus RTU 报文字节含义：
 * 第一个字节：从机地址
 * 第二个字节：功能码
 * 第三个字节：数据长度
 * 模拟执行输入参数 {"data":"010408000070713F0000005F22","identifier":"TotalFlow"}
 * @param {string} jsonString "{\"data\": \"010408000070713F0000005F22\", \"identifier\": \"TotalFlow\"}"
 * @param {string} jsonString.data 报文帧
 * @param {string} jsonString.identifier 物模型标识符
 * @returns {object} result
 * @returns {string} result.data 物模型属性值
 * @returns {string} result.identifier 物模型标识符
 * @returns {string} result.method 物模型方法 
 * thing.event.property.post (主动上报) | thing.service.property.get (属性获取) | thing.service.property.set (属性设置) | thing.service.${identifier} (动作调用)
 */
function rawDataToProtocol(jsonString) {
  const jsonData = JSON.parse(jsonString)

  // 报文帧
  const rawDataHexStr = jsonData.data.replace(/\s+|^0x/g, '')

  // 校验CRC
  const deviceCRC = rawDataHexStr.slice(-4)
  const calculatedCRC = checkCRC16(rawDataHexStr.slice(0, -4))
  if (deviceCRC !== calculatedCRC) {
    throw new Error('CRC校验失败')
  }

  // 标识符
  const identifier = jsonData.identifier

  // 将十六进制字符串转换为 ArrayBuffer
  const buffer = hexStringToArrayBuffer(rawDataHexStr)
        
  // 创建 Uint8Array 视图
  const frame = new Uint8Array(buffer)
        
  // 检查帧长度
  if (frame.length < 4) {
    throw new Error('Modbus RTU帧长度太短')
  }

  const parseFrame = {
    0x04: parsePropertyData,
    0x05: () => 0,
  }

  // 报文帧第二个字节为功能码
  const parser = parseFrame[frame[1]]
  const data = parser(frame, identifier)
  return {
    ...data,
    identifier,
  }
}

/**
 * 创建 Modbus RTU 帧
 * 模拟执行输入参数 {"address":"1","functionCode":"0x04","params":{"FlowRate":true}}
 * @param {string} jsonString "{\"address\":\"1\",\"functionCode\":\"0x04\",\"params\":{\"FlowRate\":true}}"
 * @param {string} jsonString.address 从机地址
 * @param {string} jsonString.functionCode 功能码
 * @param {object} jsonString.params 标识符 key-value 对
 * @param {string} jsonString.deviceName 设备名称
 * @returns {string} rawdata 设备能识别的格式数据
 */
function protocolToRawData(jsonString) {
  const KEY_ADDRESS = 'address'
  const KEY_FUNCTIOIN_CODE = 'functionCode'
  const KEY_PARAMS = 'params'
  const jsonData = JSON.parse(jsonString)
  if (!Object.keys(jsonData).includes(KEY_ADDRESS) 
    || !Object.keys(jsonData).includes(KEY_FUNCTIOIN_CODE)
    || !Object.keys(jsonData).includes(KEY_PARAMS)) {
    throw new Error('请求参数异常')
  }

  const functionCode = parseInt(jsonData[KEY_FUNCTIOIN_CODE])
  // 流量计只用到了 0x04 功能码
  if (functionCode === 0x04) {
    // 从机地址
    const slaveAddress = parseInt(jsonData[KEY_ADDRESS])

    const params = jsonData[KEY_PARAMS]
    const paramKeys = Object.keys(params)
    if (Object.keys(params).length !== 1) {
      throw new Error('参数异常，一次仅支持抄读一个数据')
    }

    const identifier = paramKeys[0]

    // 物模型属性标识符 map
    const identifierMap = FUNCTION_CODE_MAP[functionCode]

    if (!Object.keys(identifierMap).includes(identifier)) {
      throw new Error(`不支持的标识符：${identifier}`)
    }
    // 寄存器起始地址
    const registerStartAddress = identifierMap[identifier].address

    // 数据长度 - 寄存器个数
    const dataLength = identifierMap[identifier].dataLength

    // 从机地址+功能码+寄存器起始地址+数据长度+校验码
    const dataHexStr = `${toHexString(slaveAddress)}${toHexString(functionCode)}${toHexString(registerStartAddress)}${toHexString(dataLength, 4)}`
    const buffer = hexStringToArrayBuffer(dataHexStr)
    const dataFrame = new Uint8Array(buffer)
    return dataHexStr + toHexString(calculateCRC16(dataFrame), 4)
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
   * 解析 modbus RTU 帧数据
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
  const dataTypes = DATA_TYPE_MAP[identifier]

  // 数据部分
  const dataLength = frame[2]
  const dataStartIndex = 3
  const dataEndIndex = dataStartIndex + dataLength
  const dataBytes = frame.slice(dataStartIndex, dataEndIndex)

  const result = []
  let index = 0
  for (const dataType of dataTypes) {
    const byteLength = DATA_TYPES[dataType].bytes
    const frame = dataBytes.slice(index, index + byteLength)

    const parser = DATA_TYPES[dataType].parse
    result.push(parser(frame))

    index = index + byteLength
  }
    
  const data = result.reduce((acc, cur) => acc + cur, 0)

  return {
    data,
    method: METHOD.get,
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
  protocolToRawData,
  rawDataToProtocol,
}
