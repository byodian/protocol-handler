import { protocolToRawData, rawDataToProtocol } from '@src/handler/fem2000-script-handler'
import { expect } from 'vitest'
import { describe, it } from 'vitest'
import { beforeAll } from 'vitest'

beforeAll(() => {
  // 使用示例
  try {
    // console.log(rawDataToProtocol('{"data":"010408000070713F0000005F22","identifier":"TotalFlow"}'))
    // console.log(rawDataToProtocol('{"data":"01 04 04 C4 1C 60 00 2F 72","identifier":"FlowRate"}'))
    // console.log(rawDataToProtocol('{"data":"01 04 02 00 01 78 F0","identifier":"AlarmEmptyPipe"}'))
    // console.log(protocolToRawData('{"address":"1","functionCode":"04","params":{"FlowRate":true}}'))
  } catch (error) {
    console.error('解析错误:', error)
  }
})

describe('protocolToRawData 云到设备 - 抄读数据', () => {
  it('FlowRate', () => {
    const jsonString = { address: '1', type: 'get', params: { identifier: 'FlowRate' } }
    const data = protocolToRawData(jsonString)
    // expect(data).toBe('01041010000274CE')
    expect(data).toBe('AQQQEAACdM4=')
  })

  it('FlowVelocity', () => {
    const jsonString = { address: '1', type: 'get', params: { identifier: 'FlowVelocity' } }
    const data = protocolToRawData(jsonString)
    // expect(data).toBe('010410120002D50E')
    expect(data).toBe('AQQQEgAC1Q4=')
  })

  it('FlowRateUnit', () => {
    const jsonString = { address: '1', type: 'get', params: { identifier: 'FlowRateUnit' } }
    const data = protocolToRawData(jsonString)
    // expect(data).toBe('01041020000134C0')
    expect(data).toBe('AQQQIAABNMA=')
  })

  it('TotalFlowUnit', () => {
    const jsonString = { address: '1', type: 'get', params: { identifier: 'TotalFlowUnit' } }
    const data = protocolToRawData(jsonString)
    // expect(data).toBe('0104102100016500')
    expect(data).toBe('AQQQIQABZQA=')
  })

  it('AlarmEmptyPipe', () => {
    const jsonString = { address: '1', type: 'get', params: { identifier: 'AlarmEmptyPipe' } }
    const data = protocolToRawData(jsonString)
    // expect(data).toBe('0104102400017501')
    expect(data).toBe('AQQQJAABdQE=')
  })

  it('AlarmSystem', () => {
    const jsonString = { address: '1', type: 'get', params: { identifier: 'AlarmSystem' } }
    const data = protocolToRawData(jsonString)
    // expect(data).toBe('01041025000124C1')
    expect(data).toBe('AQQQJQABJME=')
  })

  it('AlarmLowerLimit', () => {
    const jsonString = { address: '1', type: 'get', params: { identifier: 'AlarmLowerLimit' } }
    const data = protocolToRawData(jsonString)
    // expect(data).toBe('010410230001C4C0')
    expect(data).toBe('AQQQIwABxMA=')
  })

  it('TotalFlow', () => {
    const jsonString = { address: '1', type: 'get', params: { identifier: 'TotalFlow' } }
    const data = protocolToRawData(jsonString)
    // expect(data).toBe('010410180004750E')
    expect(data).toBe('AQQQGAAEdQ4=')
  })
})

describe('设备到云消息解析', () => {
  it('FlowRate', () => {
    // hex: 010404C41C60002F72
    const framJsonString = { inputConfig: { identifier: 'FlowRate', address: 1, port: 1 }, result: { data: 'AQQExBxgAC9y', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(-625.5)
    expect(result.identifier).toBe('FlowRate')
    expect(result.method).toBe('thing.service.property.get')
  })

  it('TotalFlow', () => {
    // hex: 010408000070713F0000005F22
    const framJsonString = { inputConfig: { identifier: 'TotalFlow', address: 1, port: 1 }, result: { data: 'AQQIAABwcT8AAABfIg==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(28785.5)
  })

  it('FlowRate', () => {
    // hex: 010404C41C60002F72
    const framJsonString = { inputConfig: { identifier: 'FlowRate', address: 1, port: 1 }, result: { data: 'AQQExBxgAC9y', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(-625.5)
  })

  it('AlarmEmptyPipe', () => {
    // hex: 010402000178F0
    const framJsonString = { inputConfig: { identifier: 'AlarmEmptyPipe', address: 1, port: 1 }, result: { data: 'AQQCAAF48A==', port: 1 } }
    const result = rawDataToProtocol(framJsonString)
    expect(result.data).toBe(1)
  })
})
