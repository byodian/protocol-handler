import { protocolToRawData, rawDataToProtocol } from '@src/handler/2576736683-script-handler'
import { expect } from 'vitest'
import { describe, it } from 'vitest'

describe('protocolToRawData 云到设备', () => {
  it('Ua', () => {
    const jsonString = '{"address":1,"type":"get","params":{"identifier":"Ua"}}'
    const data = protocolToRawData(jsonString)
    // expect(data).toBe('010400080001B008')
    expect(data).toBe('AQQACAABsAg=')
  })

  it('Ia', () => {
    const jsonString = '{"address":1,"type":"get","params":{"identifier":"Ia"}}'
    const data = protocolToRawData(jsonString)
    // expect(data).toBe('010400090001E1C8')
    expect(data).toBe('AQQACQAB4cg=')
  })

  it('PEnergy', () => {
    const jsonString = '{"address":1,"type":"get","params":{"identifier":"PEnergy"}}'
    const data = protocolToRawData(jsonString)
    // expect(data).toBe('0104002500026000')
    expect(data).toBe('AQQAJQACYAA=')
  })

  it('Relay get', () => {
    const jsonString = '{"address":1,"type":"get","params":{"identifier":"Relay"}}'
    const data = protocolToRawData(jsonString)
    // expect(data).toBe('010100010001AC0A')
    expect(data).toBe('AQEAAQABrAo=')
  })

  it('Relay action', () => {
    const jsonString = '{"address":1,"type":"action","params":{"identifier":"Relay","inputData": {"Relay":1}}}'
    const data = protocolToRawData(jsonString)
    // expect(data).toBe('01050001FF00DDFA')
    expect(data).toBe('AQUAAf8A3fo=')
  })
})

describe('rawDataToProtocol 设备到云', () => {
  it('Ua', () => {
    // {"data": "01040200FE38B0","identifier":"Ua"}
    const framJsonString = '{"inputConfig":{"identifier":"Ua","address":1,"port":1},"result":{"data":"AQQCAP44sA==","port":1}}'
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(254)
    expect(result.identifier).toBe('Ua')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('Relay get reply', () => {
    // {"data": "010101005188","identifier":"Relay"}
    const framJsonString = '{"inputConfig":{"identifier":"Relay","address":1,"port":1},"result":{"data":"AQEBAFGI","port":1}}'
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(0)
    expect(result.identifier).toBe('Relay')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('Relay action reply', () => {
    // {"data": "01050001FF00DDFA","identifier":"Relay"}
    const framJsonString = '{"inputConfig":{"identifier":"Relay","address":1,"port":1},"result":{"data":"AQUAAf8A3fo=","port":1}}'
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(1)
    expect(result.identifier).toBe('Relay')
    expect(result.method).toBe('thing.service.Relay')
  })
})
