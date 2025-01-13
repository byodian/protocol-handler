import { protocolToRawData, rawDataToProtocol } from '@src/handler/4g-water-meter-script-handler'
import { expect } from 'vitest'
import { describe, it } from 'vitest'
import { hexStringToArrayBuffer } from '@src/lib/bytes-utils'

describe('protocolToRawData 云到设备', () => {
  it('WaterCFV', () => {
    const jsonString = '{"type":"get","params":{"identifier":"WaterCFV"}}'
    const result = protocolToRawData(jsonString)
    expect(result).toBe('HD45:AA039C4D00026397')
  })

  it('Version', () => {
    const jsonString = '{"type": "get","params":{"identifier":"Version"}}'
    const result = protocolToRawData(jsonString)
    expect(result).toBe('HD45:AA039DA00002F25E')
  })

  it('Temp', () => {
    const jsonString = '{"type": "get","params":{ "identifier":"Temp" }}'
    const result = protocolToRawData(jsonString)
    expect(result).toBe('HD45:AA039C690001639D')
  })

  it('Time set', () => {
    const jsonString = '{"type": "set","params":{ "identifier":"Time","inputData":{"Time":1733741865507}}}'
    const result = protocolToRawData(jsonString)
    expect(result).toBe('HD45:AA10A41000040814180C010912392DC6F9')
  })

  it('Relay action: 01', () => {
    const jsonString = '{"type": "action","params":{"identifier":"Relay","inputData":{"Relay":1}}}'
    const result = protocolToRawData(jsonString)
    expect(result).toBe('HD45:AA109C6A0001020001B9A4')
  })

  it('Relay action: 02', () => {
    const jsonString = '{"type": "action","params":{"identifier":"Relay","inputData":{"Relay": 2}}}'
    const result = protocolToRawData(jsonString)
    expect(result).toBe('HD45:AA109C6A0001020002F9A5')
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

    const framJsonString = '{"inputConfig":{"identifier":"Time"},"result":{"data":"HD45:AA030814180C01090F032F65B0"}}'
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(curDate.getTime().toString())
  })

  it('Temp', () => {
    const hexString = '{"inputConfig":{"identifier":"Temp"},"result":{"data":"HD45:FE0302074D6E55"}}'
    const result = rawDataToProtocol(hexString)
    expect(result.data).toBe(18.69)
  })

  it('WaterCFV', () => {
    const hexString = '{"inputConfig":{"identifier":"WaterCFV"},"result":{"data":"HD45:FE0304000029466B5E"}}'
    const result = rawDataToProtocol(hexString)
    expect(result.data).toBe(105.66)
  })

  it('DayWaterCFV', () => {
    const hexString = '{"inputConfig":{"identifier":"DayWaterCFV"},"result":{"data":"HD45:FE03700000294600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000294623CE"}}'
    const result = rawDataToProtocol(hexString)
    expect(result.data).toMatchObject({
      1: 105.66,
    })
  })

  it('Relay action reply', () => {
    const hexString = '{"inputConfig":{"identifier":"DayWaterCFV"},"result":{"data":"HD45:53109C6A00010237"}}'
    const result = rawDataToProtocol(hexString)
    expect(result.data).toBe(1)
  })

  it('Time set reply', () => {
    const hexString = '{"inputConfig":{"identifier":"DayWaterCFV"},"result":{"data":"HD45:5310A4100004EE8D"}}'
    const result = rawDataToProtocol(hexString)
    expect(result.data).toBe(4)
  })
})

describe('设备主动上报，数据解析', () => {
  it('All', () => {
    // deviceName: 000060009140
    const request = '{"inputConfig":{"identifier":"all"},"result":{"data":"HDWB:L9103M0140B4233C00U5F01T48031823011224PB5F85201000000B4233C000232019622B4233C000100000000000000000000000000000000EE18EE177F230014FF7ADE3DCEED0000EE00300312170C1800000000000000000000000000000000000000000000E80300000000000000000000000000000600286463000000000000B4000000055F010807C40950C30000000000003200011099220000000000000000E8FD7F0540E803E803E803E803000000000000E803E803E803E803E803E803E803E803E803E803E8030C10FF0000000087000000000000000000D84022E307704D0010171200000000FFFFFF18000000000000000000000000000000106707902410400886894362C505J1200000000EE18EE177F230014FF7ADE3DCEED00001700000000EE18EE177F230014FF7ADE3DCEED00000000000000000C00000000F6E772F5E1F9B423FEFBFDBFDF51CEED007600137940216608018318150100000000000000000000000000000000EF7C1B04000000003D191000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000823900000000000000000000000000000000000000000000S3A", "deviceName":"000060009140"}}'
    const result = rawDataToProtocol(request)
    // expect(result).toBe('HD45:AA039C400001B255')
    expect(result.method).toBe('thing.event.property.post')
    expect(result.identifier).toBe('all')
    expect(result.data).toMatchObject({
      Temp: 20.19,
      Time: '1734948228000',
      Version: '22960132',
      WaterCFV: 0,
    })
  })
})
