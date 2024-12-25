import { protocolToRawData, rawDataToProtocol } from '@src/handler/water-meter-script-handler'
import { beforeAll } from 'vitest'
import { expect } from 'vitest'
import { describe, it } from 'vitest'
import { hexStringToArrayBuffer } from '@src/lib/bytes-utils'

beforeAll(() => {
  // 使用示例
  try {
    console.log('down: Relay 00', protocolToRawData('{"address":"254","functionCode": "0x03","params":{"Relay": true }}'))
    console.log('down: Relay 01', protocolToRawData('{"address":"254","functionCode": "0x10","params":{"Relay": 1 }}'))
    console.log('down: Relay 02', protocolToRawData('{"address":"254","functionCode": "0x10","params":{"Relay": 2 }}'))
    console.log('down: Time', protocolToRawData('{"address":"254","functionCode": "0x10","params":{"Time": 1733741865507 }}'))
    console.log('down: DayWaterCFV', protocolToRawData('{"address":"254","functionCode": "0x03","params":{"DayWaterCFV": true }}'))
    console.log('down: WaterCFV', protocolToRawData('{"address":"254","functionCode": "0x03","params":{"WaterCFV": true }}'))

    // const dayWaterCFV1 = '00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00'
    // const waterCFV1Buffer = hexStringToArrayBuffer(dayWaterCFV1)
    // const dayWaterCFV1Frame = new Uint8Array(waterCFV1Buffer)
    // const result = {}
    // for (let i = 0; i < 124; i += 4) {
    //   const byte = dayWaterCFV1Frame.slice(i, i + 4)
    //   result[i / 4 + 1] = DATA_TYPES.UINT_32.parse(byte) / 100
    // }
    // console.log(result)
 
    console.log('Version', rawDataToProtocol('{"data":"FE 03 04 22 94 01 19 7E F2","identifier":"Version"}'))
    console.log('Temp', rawDataToProtocol('{"data":"FE 03 02 07 4D 6E 55","identifier":"Temp"}'))
    console.log('WaterCFV', rawDataToProtocol('{"data":"FE 03 04 00 00 29 46 6B 5E","identifier":"WaterCFV"}'))
    console.log('Time', rawDataToProtocol('{"data":"FE 03 08 14 18 0C 01 09 0F 03 2F 71 81","identifier":"Time"}'))
    console.log('DayWaterCFV', rawDataToProtocol('{"data":"FE 03 70 00 00 29 46 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 29 46 23 CE","identifier":"DayWaterCFV"}'))
    console.log('Relay', rawDataToProtocol('{"data":"53 10 9C 6A 00 01 02 37","identifier":"Relay"}'))
    console.log('Time', rawDataToProtocol('{"data":"53 10 A4 10 00 04 EE 8D","identifier":"Time"}'))
  } catch (error) {
    console.error('解析错误:', error)
  }
})

describe('抄读数据，云到设备，生成Modbus帧', () => {
  it('WaterCFV', () => {
    const jsonString = '{"address":"254","functionCode": "0x03","params":{"WaterCFV": true }}'
    const result = protocolToRawData(jsonString)
    expect(result).toBe('FE039C4D00026E43')
  })

  it('Version', () => {
    const jsonString = '{"address":"254","functionCode": "0x03","params":{"Version": true }}'
    const result = protocolToRawData(jsonString)
    expect(result).toBe('FE039DA00002FF8A')
  })

  it('Temp', () => {
    const jsonString = '{"address":"254","functionCode": "0x03","params":{"Temp": true }}'
    const result = protocolToRawData(jsonString)
    expect(result).toBe('FE039C6900016E49')
  })
})

describe('rawDataToProtocol 设备到云，数据解析', () => {

  it('返回正确的日期', () => {
    const year = '14 18 0C 01 09 0F 03 2F'
    const yearBuffer = hexStringToArrayBuffer(year)
    const yearFrame = new Uint8Array(yearBuffer)

    const fullYear = parseInt([yearFrame[0], yearFrame[1]].join(''))
    const month = yearFrame[2] - 1
    const day = yearFrame[4]
    const hour = yearFrame[5]
    const minutes = yearFrame[6]
    const seconds = yearFrame[7]
    const curDate = new Date(fullYear, month, day, hour, minutes, seconds)

    const framJsonString = '{"data":"FE 03 08 14 18 0C 01 09 0F 03 2F 71 81","identifier":"Time"}'
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(curDate.getTime().toString())
  })
})
