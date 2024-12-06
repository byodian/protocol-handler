/**
 * 数据类型，大端法计算方法
 */
const DATA_TYPE_MAP = {
  UINT16: {
    bytes: 2,
    parse: (bytes) => {
      return (bytes[0] << 8) | bytes[1]
    },
  },
  INT16: {
    bytes: 2,
    parse: (bytes) => {
      const value = (bytes[0] << 8) | bytes[1]
      return value > 0x7FFF ? value - 0x10000 : value
    },
  },
  UINT32: {
    bytes: 4,
    parse: (bytes) => {
      return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]
    },
  },
  INT32: {
    bytes: 4,
    parse: (bytes) => {
      const value = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]
      return value > 0x7FFFFFFF ? value - 0x100000000 : value
    },
  },
  FLOAT32: {
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
  FLOAT64: {
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
 * 将 ArrayBuffer 转换回十六进制字符串
 * @param {ArrayBuffer} buffer 
 * @returns string
 */
function arrayBufferToHexString(buffer) {
  const view = new Uint8Array(buffer)
  return Array.from(view)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
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

function toHexString(decimalValue) {
  if (typeof decimalValue !== 'number') {
    throw new Error('非法数字')
  }

  return decimalValue.toString(16).toUpperCase().padStart(2, '0')
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

// 使用示例
try {
  // 模拟接收的 Modbus RTU 帧（十六进制字符串）
  const hexString = '010402000A3937'
  const buffer = hexStringToArrayBuffer(hexString)
  const frame = new Uint8Array(buffer)

  // 校验 CRC
  const calculatedCRC = calculateCRC16(frame.slice(0, -2))
  console.log(frame.slice(0, -2))
  console.log('校验解析结果:', toHexString(calculatedCRC))
  console.log('解析结果', rawDataToProtocol(hexString))
} catch (error) {
  console.error('解析错误:', error)
}
