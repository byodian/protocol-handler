/**
 * 水表脚本
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
      return bytes
        .map((byte) => {
          const high = (byte >> 4) & 0x0F // 高 4 位
          const low = byte & 0x0F        // 低 4 位
          return `${high}${low}`        // 拼接成字符串
        })
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
  // 读取属性
  0x04: {
  },
  0x03: {
    WaterCFV: { address: 0x9C4D, dataLength: 2, desc: '总用水量' },
    Temp: { address: 0x9C69, dataLength: 1, desc: '表内温度' },
    Version: { address: 0x9DA0, dataLength: 2, desc: '版本号' },
    Time: { address: 0xA410, dataLength: 4, desc: '表内时间' },
    Relay: { address: 0x9C6A, dataLength: 1, desc: '读取闸控状态' },
    DayWaterCFV: { address: 0x9C6C, dataLength: 62, desc: '读取近31日冻结总用水量，4字节表示一个用水量' },
  },
  // 写数据
  0x05: {
  },
  // 写数据
  0x10: {
    Relay: { address: 0x9C6A, dataLength: 1, byteLength: 2, desc: '开合闸，切闸 01 合闸 02' },
    Time: { address: 0xA410, dataLength: 4, byteLength: 8, desc: '水表校时' },
    braud: { address: 0xA414, dataLength: 1, byteLength: 2, desc: '水表校时' },
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
 * 解析 Modbus RTU 帧
 * Modbus RTU 报文字节含义：
 * 第一个字节：从机地址
 * 第二个字节：功能码
 * 第三个字节：数据长度
 * @param {string} jsonString "{\"data\": \"frame\", \"identifier\": \"Ua\"}"" 
 * @param {string} jsonString.data 报文帧
 * @param {string} jsonString.identifier 物模型标识符
 * @returns 
 */
function rawDataToProtocol(jsonString) {
  const jsonData = JSON.parse(jsonString)
  // 报文帧
  const frameHexString = jsonData.data
  // 标识符
  const identifier = jsonData.identifier
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

  /**
   * 解析 modbus RTU 帧数据 - 属性抄读
   * 报文帧第三个字节为数据长度
   * @param {Uint8Array} frame 
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

    switch (identifier) {
      // 无符号 32 位，2位小数
      case 'Temp':
      case 'WaterCFV': {
        const result = parser(dataBytes)
        return result / 100
      }
      case 'Relay':
      case 'Version': 
        return parser(dataBytes)
      case 'Time': {
        // 8个字节，分别代表年(两个字节表示，0x1418 表示 2024)、月、周、日、时、分、秒
        const fullYear = parseInt([dataBytes[0], dataBytes[1]].join(''))
        const month = dataBytes[2] - 1
        const day = dataBytes[4]
        const hour = dataBytes[5]
        const minutes = dataBytes[6]
        const seconds = dataBytes[7]
        const curDate = new Date(fullYear, month, day, hour, minutes, seconds)
        return curDate.getTime().toString()
      }
      case 'DayWaterCFV': {
        const result = {}
        // 124 个字节，每4个字节表示一天的用水量，总共 31 天用水量
        for (let i = 0; i < dataLength; i += 4) {
          const byte = dataBytes.slice(i, i + 4)
          result[i / 4 + 1] = parser(byte) / 100
        }
        return result
      }
      default: 
        throw new Error(`不支持的标识符：${identifier}`)
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

    return DATA_TYPES.UINT_16.parse(frame.slice(4, 6))
  }

  // 报文帧第二个字节为功能码
  const parser = parseFrame[frame[1]]
  return parser(frame, identifier)
}

// const jsonData = "{\"address\":\"1\",\"functionCode\":\"04\",\"params\":{\"FlowRate\":true}}"

/**
 * 创建 Modbus RTU 帧
 * @param {string} jsonString "{\"address\":\"1\",\"functionCode\":\"04\",\"params\":{\"FlowRate\":true}}"
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

  // 从机地址
  const slaveAddress = parseInt(jsonData[KEY_ADDRESS])

  const params = jsonData[KEY_PARAMS]
  const paramKeys = Object.keys(params)
  if (Object.keys(params).length !== 1) {
    throw new Error('请求参数异常')
  }

  const identifier = paramKeys[0]

  // 功能码 map
  const singleFunctionCodeMap = FUNCTION_CODE_MAP[functionCode]

  if (!Object.keys(singleFunctionCodeMap).includes(identifier)) {
    throw new Error(`不支持的标识符：${identifier}`)
  }

  // 物模型属性标识符 map
  const identifierMap = singleFunctionCodeMap[identifier]

  // 寄存器起始地址
  const registerStartAddress = identifierMap.address

  // 数据长度 - 寄存器个数
  const dataLength = identifierMap.dataLength

  if (functionCode === 0x04 || functionCode === 0x03) {
    // 从机地址+功能码+寄存器起始地址+数据长度+校验码
    const dataHexStr = `${toHexString(slaveAddress)}${toHexString(functionCode)}${toHexString(registerStartAddress)}${toHexString(dataLength, 4)}`
    const buffer = hexStringToArrayBuffer(dataHexStr)
    const dataFrame = new Uint8Array(buffer)
    return dataHexStr + toHexString(calculateCRC16(dataFrame))
  } else if (functionCode === 0x10) { 
    // 属性值
    const identifierValue = params[identifier]
    // 字节长度
    const byteLength = identifierMap.byteLength
    let frameHexStr = `${toHexString(slaveAddress)}${toHexString(functionCode)}${toHexString(registerStartAddress)}${toHexString(dataLength, 4)}${toHexString(byteLength)}`

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
    return frameHexStr + toHexString(calculateCRC16(dataFrame))
  } else {
    throw new Error(`不支持的功能码：${functionCode}`)
  }
}

/**
 * 十六进制字符串转 ArrayBuffer
 * @param {string} hexString 
 * @returns ArrayBuffer
 */
function hexStringToArrayBuffer(hexString) {
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
    view[i / 2] = parseInt(hexString.slice(i, i + 2), 16)
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

export {
  rawDataToProtocol,
  protocolToRawData,
}
