import { DATA_TYPES, hexStringToArrayBuffer, swapHexByteOrder } from '@src/lib/bytes-utils'
import { expect } from 'vitest'
import { describe, it } from 'vitest'

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
    expect(DATA_TYPES.BCD.parse(frame)).toBe('22940119')
  })

  it('BCD 码解析器', () => {
    const hexString = '07 4D'
    const buffer = hexStringToArrayBuffer(hexString)
    const frame = new Uint8Array(buffer)
    expect(DATA_TYPES.UINT_16.parse(frame)).toBe(1869)
  }) 

  it('swapHexByteOrder', () => {
    const hexString = '3B02'
    expect(parseInt(swapHexByteOrder(hexString), 16) / 100).toBe(5.71)
  })
})
