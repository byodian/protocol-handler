import { protocolToRawData, rawDataToProtocol } from '@src/handler/2576736683-script-handler'
import { expect } from 'vitest'
import { describe, it } from 'vitest'

describe('protocolToRawData 云到设备', () => {
  it('Ua', () => {
    const jsonString = { address: 1, type: 'get', params: { identifier: 'Ua' } }
    const data = protocolToRawData(jsonString)
    // expect(data).toBe('010400080001B008')
    expect(data).toBe('AQQACAABsAg=')
  })

  it('Ia', () => {
    const jsonString = { address: 1, type: 'get', params: { identifier: 'Ia' } }
    const data = protocolToRawData(jsonString)
    // expect(data).toBe('010400090001E1C8')
    expect(data).toBe('AQQACQAB4cg=')
  })

  it('PEnergy', () => {
    const jsonString = { address: 1, type: 'get', params: { identifier: 'PEnergy' } }
    const data = protocolToRawData(jsonString)
    // expect(data).toBe('0104002500026000')
    expect(data).toBe('AQQAJQACYAA=')
  })

  it('Relay get', () => {
    const jsonString = { address: 1, type: 'get', params: { identifier: 'Relay' } }
    const data = protocolToRawData(jsonString)
    // expect(data).toBe('010100010001AC0A')
    expect(data).toBe('AQEAAQABrAo=')
  })

  it('Relay action', () => {
    const jsonString = { address: 1, type: 'action', params: { identifier: 'Relay', inputData: { Relay: 1 } } }
    const data = protocolToRawData(jsonString)
    // expect(data).toBe('01050001FF00DDFA')
    expect(data).toBe('AQUAAf8A3fo=')
  })
})

describe('rawDataToProtocol 设备到云', () => {
  it('Ua', () => {
    // 01040200FE38B0
    const framJsonString = { inputConfig: { identifier: 'Ua', address: 1, port: 1 }, result: { data: 'AQQCAP44sA==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(254)
    expect(result.identifier).toBe('Ua')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('Ub', () => {
    // 01040200FE38B0
    const framJsonString = { inputConfig: { identifier: 'Ub', address: 1, port: 1 }, result: { data: 'AQQCAP44sA==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(254)
    expect(result.identifier).toBe('Ub')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('Uc', () => {
    // 01040200FE38B0
    const framJsonString = { inputConfig: { identifier: 'Uc', address: 1, port: 1 }, result: { data: 'AQQCAP44sA==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(254)
    expect(result.identifier).toBe('Uc')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('Relay get reply', () => {
    const framJsonString = { inputConfig: { identifier: 'Relay', address: 1, port: 1 }, result: { data: 'AQEBAZBI', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(1)
    expect(result.identifier).toBe('Relay')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('Ia', () => {
    // 010402000A3937
    const framJsonString = { inputConfig: { identifier: 'Ia', address: 1, port: 1 }, result: { data: 'AQQCAAo5Nw==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(0.1)
    expect(result.identifier).toBe('Ia')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('Ib', () => {
    // 010402000A3937
    const framJsonString = { inputConfig: { identifier: 'Ib', address: 1, port: 1 }, result: { data: 'AQQCAAo5Nw==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(0.1)
    expect(result.identifier).toBe('Ib')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('Ic', () => {
    // 010402000A3937
    const framJsonString = { inputConfig: { identifier: 'Ic', address: 1, port: 1 }, result: { data: 'AQQCAAo5Nw==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(0.1)
    expect(result.identifier).toBe('Ic')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('GridFreq', () => {
    // 010402000A3937
    const framJsonString = { inputConfig: { identifier: 'GridFreq', address: 1, port: 1 }, result: { data: 'AQQCAAo5Nw==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(1.0)
    expect(result.identifier).toBe('GridFreq')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('Leakage', () => {
    // 010402000A3937
    const framJsonString = { inputConfig: { identifier: 'Leakage', address: 1, port: 1 }, result: { data: 'AQQCA+i5jg==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(1000)
    expect(result.identifier).toBe('Leakage')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('TempA', () => {
    // 010402003238E5
    const framJsonString = { inputConfig: { identifier: 'TempA', address: 1, port: 1 }, result: { data: 'AQQCADI45Q==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(10)
    expect(result.identifier).toBe('TempA')
    expect(result.method).toBe('thing.service.property.get')
  })
  
  it('TempB', () => {
    // 010402003238E5
    const framJsonString = { inputConfig: { identifier: 'TempB', address: 1, port: 1 }, result: { data: 'AQQCADI45Q==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(10)
    expect(result.identifier).toBe('TempB')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('TempC', () => {
    // 010402003238E5
    const framJsonString = { inputConfig: { identifier: 'TempC', address: 1, port: 1 }, result: { data: 'AQQCADI45Q==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(10)
    expect(result.identifier).toBe('TempC')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('PFa', () => {
    // 0104020063F919
    const framJsonString = { inputConfig: { identifier: 'PFa', address: 1, port: 1 }, result: { data: 'AQQCAGP5GQ==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(0.99)
    expect(result.identifier).toBe('PFa')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('PFb', () => {
    // 0104020063F919
    const framJsonString = { inputConfig: { identifier: 'PFb', address: 1, port: 1 }, result: { data: 'AQQCAGP5GQ==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(0.99)
    expect(result.identifier).toBe('PFb')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('PFc', () => {
    // 0104020063F919
    const framJsonString = { inputConfig: { identifier: 'PFc', address: 1, port: 1 }, result: { data: 'AQQCAGP5GQ==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(0.99)
    expect(result.identifier).toBe('PFc')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('Pa', () => {
    // 0104020F63FCE9
    const framJsonString = { inputConfig: { identifier: 'Pa', address: 1, port: 1 }, result: { data: 'AQQCD2P86Q==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(3939)
    expect(result.identifier).toBe('Pa')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('Pb', () => {
    // 0104020F63FCE9
    const framJsonString = { inputConfig: { identifier: 'Pb', address: 1, port: 1 }, result: { data: 'AQQCD2P86Q==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(3939)
    expect(result.identifier).toBe('Pb')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('Pc', () => {
    // 0104020F63FCE9
    const framJsonString = { inputConfig: { identifier: 'Pc', address: 1, port: 1 }, result: { data: 'AQQCD2P86Q==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(3939)
    expect(result.identifier).toBe('Pc')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('Qa', () => {
    // 0104020F63FCE9
    const framJsonString = { inputConfig: { identifier: 'Qa', address: 1, port: 1 }, result: { data: 'AQQCD2P86Q==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(3939)
    expect(result.identifier).toBe('Qa')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('Qb', () => {
    // 0104020F63FCE9
    const framJsonString = { inputConfig: { identifier: 'Qb', address: 1, port: 1 }, result: { data: 'AQQCD2P86Q==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(3939)
    expect(result.identifier).toBe('Qb')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('Qc', () => {
    // 0104020F63FCE9
    const framJsonString = { inputConfig: { identifier: 'Qc', address: 1, port: 1 }, result: { data: 'AQQCD2P86Q==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(3939)
    expect(result.identifier).toBe('Qc')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('P', () => {
    // 0104020F63FCE9
    const framJsonString = { inputConfig: { identifier: 'P', address: 1, port: 1 }, result: { data: 'AQQCD2P86Q==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(3939)
    expect(result.identifier).toBe('P')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('Q', () => {
    // 0104020F63FCE9
    const framJsonString = { inputConfig: { identifier: 'Q', address: 1, port: 1 }, result: { data: 'AQQCD2P86Q==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(3939)
    expect(result.identifier).toBe('Q')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('S', () => {
    // 0104020F63FCE9
    const framJsonString = { inputConfig: { identifier: 'S', address: 1, port: 1 }, result: { data: 'AQQCD2P86Q==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(3939)
    expect(result.identifier).toBe('S')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('PEnergy', () => {
    // 0104040F630F0A8D79
    const framJsonString = { inputConfig: { identifier: 'PEnergy', address: 1, port: 1 }, result: { data: 'AQQED2MPCo15', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(3942.850)
    expect(result.identifier).toBe('PEnergy')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('Relay action reply', () => {
    // 01050001FF00DDFA
    const framJsonString = { inputConfig: { identifier: 'Relay', address: 1, port: 1 }, result: { data: 'AQUAAf8A3fo=', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(1)
    expect(result.identifier).toBe('Relay')
    expect(result.method).toBe('thing.service.Relay')
  })
})
