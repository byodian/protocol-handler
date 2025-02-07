import { protocolToRawData, rawDataToProtocol } from '@src/handler/water-meter-script-handler'
import { beforeAll } from 'vitest'
import { expect } from 'vitest'
import { describe, it } from 'vitest'
import { hexStringToArrayBuffer } from '@src/lib/bytes-utils'

beforeAll(() => {
  // 使用示例
  try {
    // const dayWaterCFV1 = '00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00 29 46 00 00'
    // const waterCFV1Buffer = hexStringToArrayBuffer(dayWaterCFV1)
    // const dayWaterCFV1Frame = new Uint8Array(waterCFV1Buffer)
    // const result = {}
    // for (let i = 0; i < 124; i += 4) {
    //   const byte = dayWaterCFV1Frame.slice(i, i + 4)
    //   result[i / 4 + 1] = DATA_TYPES.UINT_32.parse(byte) / 100
    // }
    // console.log(result)
  } catch (error) {
    console.error('解析错误:', error)
  }
})

describe('protocolToRawData 云到设备 - 抄读数据', () => {
  it('WaterCFV', () => {
    const jsonString = { address: 254, type: 'get', params: { identifier: 'WaterCFV' } }
    const result = protocolToRawData(jsonString)
    // expect(result).toBe('FE039C4D00026E43')
    expect(result).toBe('/gOcTQACbkM=')
  })

  it('Version', () => {
    const jsonString = { address: 254, type: 'get', params: { identifier: 'Version' } }
    const result = protocolToRawData(jsonString)
    // expect(result).toBe('FE039DA00002FF8A')
    expect(result).toBe('/gOdoAAC/4o=')
  })

  it('Temp', () => {
    const jsonString = { address: 254, type: 'get', params: { identifier: 'Temp' } }
    const result = protocolToRawData(jsonString)
    // expect(result).toBe('FE039C6900016E49')
    expect(result).toBe('/gOcaQABbkk=')
  })
})

describe('protocolToRawData 云到设备 - 属性设置', () => {
  it('Time', () => {
    const jsonString = { address: 254, type: 'set', params: { identifier: 'Time', inputData: { Time: 1733741865507 } } }
    const result = protocolToRawData(jsonString)
    // expect(result).toBe('FE10A41000040814180C010912392D92C6')
    expect(result).toBe('/hCkEAAECBQYDAEJEjktksY=')
  })
})

describe('protocolToRawData 云到设备 - 动作调用', () => {
  it('Time', () => {
    const jsonString = { address: 254, type: 'action', params: { identifier: 'Relay', inputData: { Relay: 1 } } }
    const result = protocolToRawData(jsonString)
    // expect(result).toBe('FE109C6A00010200017767')
    expect(result).toBe('/hCcagABAgABd2c=')
  })
})

describe('rawDataToProtocol 设备到云', () => {
  it('Time', () => {
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
    // const framJsonString = '{"data":"FE030814180C01090F032F7181","identifier":"Time"}'
    const framJsonString = { inputConfig: { identifier: 'Time', address: 254, port: 1 }, result: { data: '/gMIFBgMAQkPAy9xgQ==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(curDate.getTime().toString())
  })

  it('Version', () => {
    // {"data":"FE0304229401197EF2","identifier":"Version"}
    const framJsonString = { inputConfig: { identifier: 'Version', address: 254, port: 1 }, result: { data: '/gMEIpQBGX7y', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe('22940119')
  })

  it('Temp', () => {
    // {"data":"FE0302074D6E55","identifier":"Temp"}
    const framJsonString = { inputConfig: { identifier: 'Temp', address: 254, port: 1 }, result: { data: '/gMCB01uVQ==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(18.69)
  })

  it('DayWaterCFV', () => {
    // {"data":"FE03700000294600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000294623CE","identifier":"DayWaterCFV"}
    const framJsonString = { inputConfig: { identifier: 'DayWaterCFV', address: 254, port: 1 }, result: { data: '/gNwAAApRgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAApRiPO', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data['1']).toBe(105.66)
  })

  it('WaterCFV', () => {
    // {"data": "FE0304000029466B5E","identifier":"WaterCFV"}
    const framJsonString = { inputConfig: { identifier: 'WaterCFV', address: 254, port: 1 }, result: { data: '/gMEAAApRmte', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(105.66)
  })
})
