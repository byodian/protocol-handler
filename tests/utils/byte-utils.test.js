import { DATA_TYPES, hexStringToArrayBuffer } from '@src/lib/bytes-utils'
import { expect } from 'vitest'
import { beforeAll, describe, it } from 'vitest'

describe('数据解析器', () => {
  it('UINT_32 parser', () => {
    const hexString = '00002946'
    const buffer = hexStringToArrayBuffer(hexString)
    const frame = new Uint8Array(buffer)
    expect(DATA_TYPES.UINT_32.parse(frame) / 100).toBe(105.66)
  })

  it('BCD 码解析器', () => {
    const hexString = '22 94 01 19'
    const buffer = hexStringToArrayBuffer(hexString)
    const frame = new Uint8Array(buffer)
    expect(DATA_TYPES.BCD.parse(frame)).toBe('2294119')
  })

  it('BCD 码解析器', () => {
    const hexString = '07 4D'
    const buffer = hexStringToArrayBuffer(hexString)
    const frame = new Uint8Array(buffer)
    expect(DATA_TYPES.UINT_16.parse(frame)).toBe(1869)
  }) 
})
