import { protocolToRawData, rawDataToProtocol } from '@src/handler/4g-electricity-meter-script-handler'
import { it } from 'vitest'
import { describe } from 'vitest'
import { beforeAll } from 'vitest'
import { expect } from 'vitest'

beforeAll(() => {
  // 使用示例
  try {
    // 云到设备消息
    console.log('down: Ua', protocolToRawData('{"address":"1","functionCode": "0x03","params":{"Ua": true }}'))
    console.log('down: Ia', protocolToRawData('{"address":"1","functionCode": "0x03","params":{"Ia": true }}'))
    console.log('down: P', protocolToRawData('{"address":"1","functionCode": "0x03","params":{"P": true }}'))
    console.log('down: S', protocolToRawData('{"address":"1","functionCode": "0x03","params":{"S": 32 }}'))
    console.log('down: Q', protocolToRawData('{"address":"1","functionCode": "0x03","params":{"Q": true }}'))
    console.log('down: Time', protocolToRawData('{"address":"1","functionCode": "0x03","params":{"Q": true }}'))
    console.log('down: Version', protocolToRawData('{"address":"1","functionCode": "0x03","params":{"Version": true }}'))
 
    // 设备到消息
    console.log('Up: Ua', rawDataToProtocol('{"data":"HD45:AA 03 02 55 F1 63 48","identifier":"Ua"}'))
    console.log('Up: P', rawDataToProtocol('{"data":"HD45:AA 03 04 00 1F C2 F6 00 19","identifier":"P"}'))
    console.log('Up: S', rawDataToProtocol('{"data":"HD45:AA 03 04 00 00 29 46 7E 9B","identifier":"S"}'))
    console.log('Up: S', rawDataToProtocol('{"data":"HD45:AA 03 04 00 1B 20 34 88 E9","identifier":"S"}'))
    console.log('Up: Time', rawDataToProtocol('{"data":"HD45:AA 03 08 14 18 0C 01 09 0F 03 2F 65 B0","identifier":"Time"}'))
    console.log('Up: Version', rawDataToProtocol('{"data":"HD45:AA 03 04 21 34 01 86 2B 39","identifier":"Version"}'))
    console.log('Up: Temp', rawDataToProtocol('{"data":"HD45:AA 03 02 07 4D 5F 99","identifier":"Temp"}'))
    console.log('Up: PEnergy', rawDataToProtocol('{"data":"HD45:AA0304003335B287D3","identifier":"PEnergy"}'))
    console.log('Up: Time', rawDataToProtocol('{"data":"HD45:FE030814180C01090F032F7181","identifier":"Time"}'))

  } catch (error) {
    console.error('解析错误:', error)
  }
})

describe('云到设备，数据解析', () => {
  it('Ua', () => {
    const jsonString = '{"address":"254","functionCode": "0x03","params":{"Ua": true }}'
    const result = protocolToRawData(jsonString)
    expect(result).toBe('HD45:AA039C400001B255')
  })

  it('Time Set', () => {
    const jsonString = '{"address":"254","functionCode": "0x10","params":{"Time": 1735017725743 }}'
    const result = protocolToRawData(jsonString)
    expect(result).toBe('HD45:AA10A41000040814180C02180D1605AA2D')
  })
})

describe('设备主动上报，数据解析', () => {
  it('All', () => {
    const request = '{"data":  "HDLB:L7503M01401EA64104U3500T26340919041224PB5F852010000001EA6410402270136221EA641040100000000000000000000000024B780000041050000FA260028612900601A2B0002131A2209130C18000000000000000000002AE93C00D8632800A02E63001027AB090000000000000000000000004E003A6463000000000000120000000535000807C40950C3000000000000C803013099210000000000000D00E8FD7F05401027102710271027000000000000102710271027102710271027004010271027102710270712800100000087000000000000000000988F17B408000000302511567D8000FFFFFF1A00020072F7C3FF0000000000000000363634812110990486892362C5EFJ0956B380000041050000FA26005A5D2900601A2B0013567D80000041050000FA26005A51290060F02A000000000000000C366076000EFE03000EDE240028F325005690270000072926606070680801831815010C000000290F020C1000000008011A0B733A3204FFD8282C050D106301000329513500000001000000150000001400000000000000000000000000000000000000000000000000000000000000000049960001540500000014S29","identifier": "all"}'
    const result = rawDataToProtocol(request)
    // expect(result).toBe('HD45:AA039C400001B255')
    expect(result.method).toBe('thing.event.property.post')
    expect(result.identifier).toBe('all')
  })
})
