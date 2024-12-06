const functionCodeMap = {
  '01': {
    Relay: { memoryAddr: '0001', len: '0001' },
  },
  '04': {
    GridFreq: { address: '0004', len: '0001' }, 
    Leakage: { address: '0005', len: '0001' },
    TempA: { address: '0007', len: '0001' },
    Ua: { address: '0008', len: '0001' },
    Ia: { address: '0009', len: '0001' },
    PFa: { address: '000A', len: '0001' },
    Pa: { address: '000B', len: '0001' },
    Qa: { address: '000C', len: '0001' },
    Sa: { address: '000D', len: '0001' },
    TempB: { address: '0010', len: '0001' },
    Ub: { address: '0011', len: '0001' },
    Ib: { address: '0012', len: '0001' },
    PFb: { address: '0013', len: '0001' },
    Pb: { address: '0014', len: '0001' },
    Qb: { address: '0015', len: '0001' },
    Sb: { address: '0016', len: '0001' },
    TempC: { address: '0019', len: '0001' },
    Uc: { address: '001A', len: '0001' },
    Ic: { address: '001B', len: '0001' },
    PFc: { address: '001C', len: '0001' },
    Pc: { address: '001D', len: '0001' },
    Qc: { address: '001E', len: '0001' },
    Sc: { address: '001F', len: '0001' },
    P: { address: '0022', len: '0001' },
    Q: { address: '0023', len: '0001' },
    S: { address: '0024', len: '0001' },
    PEnergy: { address: '0025', len: '0002' },
  },
  '10': {
    Relay: { address: '9C6A', operationCode: { 1: 'FF00', 0: '0000' } },
  },
}

/**
 * 解析 Modbus RTU 帧
 * Modbus RTU 报文字节含义：
 * 第一个字节：从机地址
 * 第二个字节：功能码
 * 第三个字节：数据长度
 * @param {string} frameHexString 十六进制 Modbus 报文帧
 * @returns 
 */
function rawDataToProtocol(frameHexString) {
  // 将十六进制字符串转换为 ArrayBuffer
  const buffer = hexStringToArrayBuffer(frameHexString)
        
  // 创建 Uint8Array 视图
  const frame = new Uint8Array(buffer)
        
  // 检查帧长度
  if (frame.length < 4) {
    throw new Error('Modbus RTU帧长度太短')
  }

  const parseFrame = {
    0x01: parsePropertyData,
    0x04: parsePropertyData,
    0x05: () => 0,
  }

  /**
   * 报文帧第三个字节为数据长度
   * 解析 modbus RTU 帧数据
   * @param {Uint8Array} frame 
   */
  function parsePropertyData(frame) {
    const dataLength = frame[2]
    const dataStartIndex = 3
    const dataEndIndex = dataStartIndex + dataLength
    const dataBytes = frame.slice(dataStartIndex, dataEndIndex)
    
    // 多字节整数转换
    // 适用于大端法（高位字节在前）字节顺序
    return dataBytes.reduce((acc, byte) => acc * 256 + byte, 0)
  }

  // 报文帧第二个字节为功能码
  const parser = parseFrame[frame[1]]
  return parser(frame)
}

// 创建 Modbus RTU 帧
function protocolToRawData() {

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
