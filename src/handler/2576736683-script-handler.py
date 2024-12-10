"""
2576736683中长款485单相漏电器
"""

import json

FUNCTION_CODE = {
  "01": {
    "Relay": { "memoryAddr": "0001", "len": 1 },
  },
  "04": {
    "GridFreq": { "memoryAddr": "0004", "len": 1 }, 
    "Leakage": { "memoryAddr": "0005", "len": 1 },
    "TempA": { "memoryAddr": "0007", "len": 1 },
    "Ua": { "memoryAddr": "0008", "len": 1 },
    "Ia": { "memoryAddr": "0009", "len": 1 },
    "PFa": { "memoryAddr": "000A", "len": 1 },
    "Pa": { "memoryAddr": "000B", "len": 1 },
    "Qa": { "memoryAddr": "000C", "len": 1 },
    "Sa": { "memoryAddr": "000D", "len": 1 },
    "TempB": { "memoryAddr": "0010", "len": 1 },
    "Ub": { "memoryAddr": "0011", "len": 1 },
    "Ib": { "memoryAddr": "0012", "len": 1 },
    "PFb": { "memoryAddr": "0013", "len": 1 },
    "Pb": { "memoryAddr": "0014", "len": 1 },
    "Qb": { "memoryAddr": "0015", "len": 1 },
    "Sb": { "memoryAddr": "0016", "len": 1 },
    "TempC": { "memoryAddr": "0019", "len": 1 },
    "Uc": { "memoryAddr": "001A", "len": 1 },
    "Ic": { "memoryAddr": "001B", "len": 1 },
    "PFc": { "memoryAddr": "001C", "len": 1 },
    "Pc": { "memoryAddr": "001D", "len": 1 },
    "Qc": { "memoryAddr": "001E", "len": 1 },
    "Sc": { "memoryAddr": "001F", "len": 1 },
    "P": { "memoryAddr": "0022", "len": 1 },
    "Q": { "memoryAddr": "0023", "len": 1 },
    "S": { "memoryAddr": "0024", "len": 1 },
    "PEnergy": { "memoryAddr": "0025", "len": 2 }
  },
  "05": {
    "Relay": { "memoryAddr": "0001", "operationCode": { 1: "FF00", 0: "0000" } },
  },
  "06": {
    "Relay": { "memoryAddr": "000D", "operationCode": { 1: "FF00", 0: "0000" } },
  },
}

OPERATION_CODE = {
 "FF00": 1,
 "0000": 0
}

KEY_MEMORY_ADDR = "memoryAddr"
KEY_DATA_LEN = "len"
KEY_FUNCTION_CDODE = "functionCode"
KEY_PARAMS = "params"
KEY_ADDRESS = "address"
KEY_OPERATION_CODE = "operationCode"

"""
jsonData = '{"address":"1","functionCode":"04","params":{"Ua":true}}'
"""

def protocol_to_raw_data(jsonData):
  jsonData = json.loads(jsonData)
  if type(jsonData) is not dict:
    raise Exception("protocol_to_raw_data function argument must be dict")

  if "address" not in jsonData or "params" not in jsonData or "functionCode" not in jsonData:
    raise Exception("protocol json invalid, missing properties: address or params or functionCode")

  params = jsonData[KEY_PARAMS]
  if type(params) is not dict:
    params = json.loads(params)
  if len(params) != 1:
    raise Exception("find multiple identifiers, expecting one")

  # 功能码
  functionCode = jsonData[KEY_FUNCTION_CDODE]
  if functionCode not in FUNCTION_CODE.keys():
    raise Exception(f"function code {functionCode} is not supported")

  # 标识符 
  identifier = list(params.keys())[0]
  if identifier not in FUNCTION_CODE[functionCode].keys():
    raise Exception(f"identifier {identifier} is not supported")

  # 从机地址
  subDeviceAddress = int(jsonData[KEY_ADDRESS])
  subDeviceAddressHexStr = f"{subDeviceAddress:02X}"

  # 寄存器/线圈/起始地址
  identifierDict = FUNCTION_CODE[functionCode][identifier]
  memoryAddrHexStr = identifierDict[KEY_MEMORY_ADDR]

  if functionCode == "04" or functionCode == "01":
    # 数据长度
    dataLen = identifierDict[KEY_DATA_LEN]
    dataLenHexStr = f"{dataLen:04X}"
    result = subDeviceAddressHexStr + functionCode + memoryAddrHexStr + dataLenHexStr
    crc16 = swap_high_low_bytes(crc16_modbus(result))
    return result + crc16
  elif functionCode == "05":
    operationCodeDict = identifierDict[KEY_OPERATION_CODE]
    value = params[identifier]
    if (value not in operationCodeDict.keys()):
      raise Exception("operation code invalid")

    operationCodeHexStr = operationCodeDict[value]
    result = subDeviceAddressHexStr + functionCode + memoryAddrHexStr + operationCodeHexStr
    crc16 = swap_high_low_bytes(crc16_modbus(result))
    return result + crc16
  else:
    raise Exception(f"function code {functionCode} is not supported")

def raw_data_to_protocol(jsonString):
  jsonData = json.loads(jsonString)
  rawData = jsonData["data"]

  if type(rawData) is not str:
    raise Exception("raw_data_to_protocol function argument must be str")

  bytes_result = bytes.fromhex(rawData)
  if len(bytes_result) < 6:
    raise Exception("raw data format invalid")
  
  index = 1
  functionCode = bytes_result[index]
  functionCodeHexStr = f"{functionCode:02X}"

  if functionCodeHexStr == "04" or functionCodeHexStr == "01":
    index += 1
    dataLen = bytes_result[index]
    startIndex = index + 1
    endIndex = startIndex + dataLen
    data = int.from_bytes(bytes_result[startIndex:endIndex], byteorder = "big", signed = False)
    return data
  elif functionCodeHexStr == "05":
    startIndex = 4
    endIndex = 6
    key = bytes_to_hex_str(bytes_result[startIndex:endIndex])
    return OPERATION_CODE[key]
  else:
    raise Exception(f"function code {functionCodeHexStr} is not supported")

"""
工具函数
"""
def crc16_modbus(hex_raw_data):
  data = bytearray.fromhex(hex_raw_data)
  crc = 0xFFFF
  for pos in data:
    crc ^= pos
    for _ in range(8):
      if crc & 0x0001:
        crc = (crc >> 1) ^ 0xA001
      else:
        crc = crc >> 1

  return crc

def swap_high_low_bytes(hex_value):
  high_byte = (hex_value & 0xFF00) >> 8
  low_byte = hex_value & 0x00FF

  swapped_value = (low_byte << 8) | high_byte
  return f"{swapped_value:04X}"

def bytes_to_hex_str(bytes):
  return ''.join(["%02X" % b for b in bytes])