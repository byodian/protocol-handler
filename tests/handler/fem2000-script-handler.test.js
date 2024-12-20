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

    console.log('FlowRate', protocolToRawData('{"address":"1","functionCode": "0x04","params":{"FlowRate": true }}'))
    console.log('FlowVelocity', protocolToRawData('{"address":"1","functionCode": "0x04","params":{"FlowVelocity": true }}'))
    console.log('FlowRateUnit', protocolToRawData('{"address":"1","functionCode": "0x04","params":{"FlowRateUnit": true }}'))
    console.log('TotalFlowUnit', protocolToRawData('{"address":"1","functionCode": "0x04","params":{"TotalFlowUnit": true }}'))
    console.log('AlarmEmptyPipe', protocolToRawData('{"address":"1","functionCode": "0x04","params":{"AlarmEmptyPipe": true }}'))
    console.log('AlarmSystem', protocolToRawData('{"address":"1","functionCode": "0x04","params":{"AlarmSystem": true }}'))
    console.log('AlarmLowerLimit', protocolToRawData('{"address":"1","functionCode": "0x04","params":{"AlarmLowerLimit": true }}'))
    console.log('TotalFlow', protocolToRawData('{"address":"1","functionCode": "0x04","params":{"TotalFlow": true }}'))

  } catch (error) {
    console.error('解析错误:', error)
  }
})

describe('设备到云消息解析', () => {
  it('FlowRate', () => {
    const hex = '{"data":"01 04 04 C4 1C 60 00 2F 72","identifier":"FlowRate"}'
    const result = rawDataToProtocol(hex)
    expect(result.data).toBe(-625.5)
    expect(result.identifier).toBe('FlowRate')
    expect(result.method).toBe('thing.service.property.get')
  })
})

describe('云到设备消息解析', () => {
  it('FlowRate', () => {
    const jsonString = '{"address":"1","functionCode":"0x04","params":{"FlowRate":true}}'
    const data = protocolToRawData(jsonString)
    expect(data).toBe('01041010000274CE')
  })
})
