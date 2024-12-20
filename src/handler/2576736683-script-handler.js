/**
 * 2576736683中长款485单相漏电器
 */
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
  '05': {
    Relay: { address: '0001', Opcode: { 1: 'FF00', 0: '0000' } },
  },
  '06': {
    Relay: { address: '000D', Opcode: { 1: 'FF00', 0: '0000' } },
  },
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
 * 模拟执行输入参数 {"data":"01040200FE38B0","identifier":"Ua"}
 * @param {string} jsonString "{\"data\": \"01040200FE38B0\", \"identifier\": \"Ua\"}"
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
  const rawData = jsonData.data.replace(/\s+|^0x/g, '')
  const identifier = jsonData.identifier

  // 校验CRC
  const deviceCRC = rawData.slice(-4)
  const calculatedCRC = checkCRC16(rawData.slice(0, -4))
  if (deviceCRC !== calculatedCRC) {
    throw new Error('CRC校验失败')
  }

  const functionCode = rawData.slice(2, 4)

  // 功能码是04
  let method
  let data
  if (functionCode === '04' || functionCode === '01') {
    // 第三项获取字节长度
    // let returnLength = parseInt(rawData[2], 16);  //  字节长度，转换为十进制
    // 提取第5位和第6位字符（注意索引从0开始）
    const fifthChar = rawData.charAt(4) // 第5位字符
    const sixthChar = rawData.charAt(5) // 第6位字符

    // 组合成一个子字符串
    const hexSubstring = fifthChar + sixthChar

    // 将十六进制字符串转换为十进制数
    const returnLength = parseInt(hexSubstring, 16)

    // 计算需要提取的字符长度
    const lengthToExtract = 2 * returnLength

    // 从第7位字符开始提取 lengthToExtract 位字符（注意索引从0开始，所以第7位的索引是6）
    const startIdx = 6
    const extractedSubstring = rawData.substr(startIdx, lengthToExtract)

    // 将提取出的子字符串转换为十进制数
    const finalDecimalValue = parseInt(extractedSubstring, 16)

    // 返回结果
    data = finalDecimalValue
    method = METHOD.get
  } else if (functionCode === '05') { // 功能码是05
    // 取值为操作码
    const address = rawData.slice(4, 8)
    const val = rawData.slice(8, 12)
    // 取出 key 是 05 的对象
    const functionCode05 = functionCodeMap['05']
    let option = {}
    // 遍历 functionCode05 找到值为 address 的键
    for (const key in functionCode05) {
      if (functionCode05[key].address === address) { 
        option = functionCode05[key].Opcode
      }
    }
    // 确认操作码对应的布尔值
    let opcodeKey
    for (const key in option) {
      if (option[key] === val) {
        opcodeKey = val === 'FF00' ? 1 : 0
        break
      }
    }

    data = opcodeKey
    method = METHOD.action.replace('{identifier}', identifier)
  } else {
    throw new Error('无法解析的功能码')
  }
  return {
    data,
    identifier,
    method,
  }
}

/**
 * 将标准协议的数据转换为设备能识别的格式数据，物联网平台给设备下发数据时调用
 * 模拟执行输入参数 {"address":"1","functionCode":"04","params":{"Ua":true}}
 * @param {string} jsonString "{\"address\":\"1\",\"functionCode\":\"04\",\"params\":{\"Ua\":true}}"
 * @param {string} jsonString.address 从机地址
 * @param {string} jsonString.functionCode 功能码
 * @param {object} jsonString.params 标识符 key-value 对
 * @param {string} jsonString.deviceName 设备名称
 * @returns {string} rawdata 设备能识别的格式数据
 */
function protocolToRawData(jsonObj) {
  const jsonResult = JSON.parse(jsonObj)
  // 第一位：获取地址和 第二位：功能码
  const address = parseInt(jsonResult.address, 10).toString(16).padStart(2, '0').toUpperCase()
  const functionCode = jsonResult.functionCode

  // 获取功能码对应的参数映射
  const functionParams = functionCodeMap[functionCode]
  if (!functionParams) { throw new Error(`无法找到功能码 ${functionCode} 的参数映射`) }

  // 创建 rawData 数组，前两项为地址和功能码
  let rawData = [address, functionCode]

  const params = jsonResult.params
  const paramAddress = Object.keys(params)[0]
  // 处理不同的功能码
  if (functionCode === '04' || functionCode === '01') {
    // 处理功能码 04，逐个解析参数
    const address1 = functionParams[paramAddress].address.match(/.{1,2}/g)
    const len1 = functionParams[paramAddress].len.match(/.{1,2}/g)
    // 第三位 第四位 将地址对应的值填入 rawData 数组
    rawData = rawData.concat(address1).concat(len1)
  } else if (functionCode === '05' || functionCode === '06') {
    // 处理功能码 05 或 06，判断 Relay 的合闸（FF00）或分闸（0000）
    const address1 = functionParams[paramAddress].address.match(/.{1,2}/g)
    // 第三位 第四位 将地址对应的值填入 rawData 数组
    rawData = rawData.concat(address1)
    const paramValue = jsonResult.params[paramAddress]

    // 根据状态（合闸或分闸）填入 Opcode
    if (paramValue === 1) {
      rawData.push('FF')
      rawData.push('00')
    } else {
      rawData.push('00')
      rawData.push('00')
    }
  }

  // 前六项每一项添加0x
  const rawDataTemp = rawData.map(item => `0x${item}`)
  const data = new Uint8Array(rawDataTemp)
  const crc = crc16Modbus(data)
  const crcARR = crc.toString(16).padStart(4, '0').match(/.{1,2}/g)
  // toUpperCase将每个字符串转换为大写
  rawData = rawData.concat(crcARR).join('').toUpperCase()
  // 返回生成的 rawData 数组
  return rawData
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

function crc16Modbus(data) {
  let crc = 0xFFFF

  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x0001) !== 0) {
        crc >>= 1
        crc ^= 0xA001 // Polynomial for Modbus
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

  return toHexString(crc16Modbus(dataFrame), 4)
}

export {
  rawDataToProtocol,
  protocolToRawData,
}
