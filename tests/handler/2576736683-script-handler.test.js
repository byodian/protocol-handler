import { protocolToRawData, rawDataToProtocol } from '@src/handler/2576736683-script-handler'
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

describe('设备到云消息解析', () => {
  it('Ua', () => {
    const hex = '{"data":"01040200FE38B0","identifier":"Ua"}'
    const result = rawDataToProtocol(hex)
    expect(result.data).toBe(254)
    expect(result.identifier).toBe('Ua')
    expect(result.method).toBe('thing.service.property.get')
  })
})

describe('云到设备消息解析', () => {
  it('Ua', () => {
    const jsonString = '{"address":"1","functionCode":"04","params":{"Ua":true}}'
    const data = protocolToRawData(jsonString)
    expect(data).toBe('010400080001B008')
  })
})
