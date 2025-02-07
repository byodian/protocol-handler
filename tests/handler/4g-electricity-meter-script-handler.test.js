import { protocolToRawData, rawDataToProtocol } from '@src/handler/4g-electricity-meter-script-handler'
import { it } from 'vitest'
import { describe } from 'vitest'
import { expect } from 'vitest'

describe('protocolToRawData 云到设备', () => {
  it('Ua', () => {
    const jsonString = { type: 'get', params: { identifier: 'Ua' } }
    const result = protocolToRawData(jsonString)
    expect(result).toBe('HD45:AA039C400001B255')
  })

  it('Time', () => {
    const jsonString = { type: 'get', params: { identifier: 'Time' } }
    const result = protocolToRawData(jsonString)
    expect(result).toBe('HD45:AA03A41000047F27')
  })

  it('Time Set', () => {
    const jsonString = { type: 'set', params: { identifier: 'Time', inputData: { Time: 1735017725743 } } }
    const result = protocolToRawData(jsonString)
    expect(result).toBe('HD45:AA10A41000040814180C02180D1605AA2D')
  })

  it('Ia', () => {
    const jsonString = { type: 'get', params: { identifier: 'Ia' } }
    const result = protocolToRawData(jsonString)
    expect(result).toBe('HD45:AA039C4300020254')
  })

  it('P', () => {
    const jsonString = { type: 'get', params: { identifier: 'P' } }
    const result = protocolToRawData(jsonString)
    expect(result).toBe('HD45:AA039C5700024250')
  })

  it('S', () => {
    const jsonString = { type: 'get', params: { identifier: 'S' } }
    const result = protocolToRawData(jsonString)
    expect(result).toBe('HD45:AA039C4B00028396')
  })

  it('Q', () => {
    const jsonString = { type: 'get', params: { identifier: 'Q' } }
    const result = protocolToRawData(jsonString)
    expect(result).toBe('HD45:AA039C5F0002C392')
  })

  it('Version', () => {
    const jsonString = { type: 'get', params: { identifier: 'Version' } }
    const result = protocolToRawData(jsonString)
    expect(result).toBe('HD45:AA039DA00002F25E')
  })
})

describe('rawDataToProtocol 设备到云', () => {
  it('Ua', () => {
    const jsonString = { inputConfig: { identifier: 'Ua' }, result: { data: 'HD45:AA030255F16348' } }
    const result = rawDataToProtocol(jsonString)
    expect(result.data).toBe(220.01)
    expect(result.method).toBe('thing.service.property.get')
  })

  it('P', () => {
    const jsonString = { inputConfig: { identifier: 'P' }, result: { data: 'HD45:AA0304001FC2F60019' } }
    const result = rawDataToProtocol(jsonString)
    expect(result.data).toBe(208.1526)
    expect(result.method).toBe('thing.service.property.get')
  })

  it('S', () => {
    const jsonString = { inputConfig: { identifier: 'S' }, result: { data: 'HD45:AA0304001B203488E9' } }
    const result = rawDataToProtocol(jsonString)
    expect(result.data).toBe(177.7716)
    expect(result.method).toBe('thing.service.property.get')
  })

  it('Time', () => {
    const jsonString = { inputConfig: { identifier: 'Time' }, result: { data: 'HD45:AA030814180C01090F032F65B0' } }
    const result = rawDataToProtocol(jsonString)
    expect(result.data).toBe('1733727827000')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('Version', () => {
    const jsonString = { inputConfig: { identifier: 'Version' }, result: { data: 'HD45:AA0304213401862B39' } }
    const result = rawDataToProtocol(jsonString)
    expect(result.data).toBe('21340186')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('Temp', () => {
    const jsonString = { inputConfig: { identifier: 'Temp' }, result: { data: 'HD45:AA0302074D5F99' } }
    const result = rawDataToProtocol(jsonString)
    expect(result.data).toBe(18.69)
    expect(result.method).toBe('thing.service.property.get')
  })

  it('PEnergy', () => {
    const jsonString = { inputConfig: { identifier: 'PEnergy' }, result: { data: 'HD45:AA0304003335B287D3' } }
    const result = rawDataToProtocol(jsonString)
    expect(result.data).toBe(33560.82)
    expect(result.method).toBe('thing.service.property.get')
  })

  it('Qa', () => {
    const jsonString = { inputConfig: { identifier: 'Qa' }, result: { data: 'HD45:FE0304FFFFFFFFF4A8' } }
    const result = rawDataToProtocol(jsonString)
    expect(result.data).toBe(-0.0001)
    expect(result.method).toBe('thing.service.property.get')
  })

  it('Qb', () => {
    const jsonString = { inputConfig: { identifier: 'Qb' }, result: { data: 'HD45:AA03048000000108F9' } }
    const result = rawDataToProtocol(jsonString)
    expect(result.data).toBe(-214748.3647)
    expect(result.method).toBe('thing.service.property.get')
  })

  it('PF', () => {
    const jsonString = { inputConfig: { identifier: 'PF' }, result: { data: 'HD45:AA030203DE1D34' } }
    const result = rawDataToProtocol(jsonString)
    expect(result.data).toBe(0.099)
    expect(result.method).toBe('thing.service.property.get')
  })
})

describe('设备主动上报', () => {
  it('All', () => {
    const request = { inputConfig: {}, result: { data: 'HDLB:L7503M01401EA64104U3500T26340919041224PB5F852010000001EA6410402270136221EA641040100000000000000000000000024B780000041050000FA260028612900601A2B0002131A2209130C18000000000000000000002AE93C00D8632800A02E63001027AB090000000000000000000000004E003A6463000000000000120000000535000807C40950C3000000000000C803013099210000000000000D00E8FD7F05401027102710271027000000000000102710271027102710271027004010271027102710270712800100000087000000000000000000988F17B408000000302511567D8000FFFFFF1A00020072F7C3FF0000000000000000363634812110990486892362C5EFJ0956B380000041050000FA26005A5D2900601A2B0013567D80000041050000FA26005A51290060F02A000000000000000C366076000EFE03000EDE240028F325005690270000072926606070680801831815010C000000290F020C1000000008011A0B733A3204FFD8282C050D106301000329513500000001000000150000001400000000000000000000000000000000000000000000000000000000000000000049960001540500000014S29', deviceName: '001089042526' } }
    const result = rawDataToProtocol(request)
    // expect(result).toBe('HD45:AA039C400001B255')
    expect(result.method).toBe('thing.event.property.post')
    expect(result.identifier).toBe('all')
    expect(result.data).toMatchObject({
      FPEnergy: 32951.35,
      FPEnergy1: 1345,
      FPEnergy2: 9978,
      FPEnergy3: 10593.4,
      FPEnergy4: 11034.96,
      FQEnergy: 0.15,
      GridFreq: 49.96,
    })
  })
})
