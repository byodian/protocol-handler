const js = require('@eslint/js')

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

function rawDataToProtocol(jsonString) {
  const jsonData = JSON.parse(jsonString)
  const rawData = jsonData.data
  // 功能码是04
  if (rawData.slice(2, 4) === '04' || rawData.slice(2, 4) === '01') {
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
    return finalDecimalValue
  } else if (rawData.slice(2, 4) === '05') { // 功能码是05
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

    return opcodeKey
  }
}

// const jsonData = "{\"address\":\"1\",\"functionCode\":\"04\",\"params\":{\"Ua\":true}}"

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
