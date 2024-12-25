# 物模型方法
METHOD = {
    'post': 'thing.event.property.post',
    'get': 'thing.service.property.get',
    'set': 'thing.service.property.set',
    'action': 'thing.service.{identifier}'
}

# 设备到云消息解析
# 将设备的自定义格式数据转换为标准协议的数据，设备上报数据到物联网平台时调用
# 示例输入参数：{"data":"FE0304229401197EF2","identifier":"Version"}
# 参数:
# - json_string (str): JSON 字符串，示例 {"data":"FE0304229401197EF2", "identifier":"Version"}
#     {
#         "data": "FE0304229401197EF2", 
#         "identifier": "Ua"
#     }
#
#     data - 原始报文帧
#     identifier - 属性标识符
# 返回:
# - dict: 包含解析后的数据，键包括 "data", "method"(物模型方法) 和 "identifier"。
#     {
#         "data": "22940119",
#         "method": "thing.event.property.post",
#         "identifier": "Version"
#     }
def raw_data_to_protocol(json_string: str):
  json_obj = {}
  return json_obj

# 云到设备消息解析
# 将标准协议的数据转换为设备能识别的格式数据，物联网平台给设备下发数据时调用
# 示例输入参数：{"address":"1","functionCode":"0x04","params":{"FlowRate":True}, "deviceName":"123456789012"}
# 参数:
# - json_string (dict): JSON 字符串，示例：
#     {
#         "address": "1", 
#         "functionCode": "0x04", 
#         "params": {"FlowRate": True}, 
#         "deviceName": "123456789012"
#     }
#     address - 设备地址
#     functionCode - 功能码
#     params - 单个标识符 key-value 对
#     deviceName - 设备id
# 返回:
# - str: 设备能识别的格式数据
def protocol_to_raw_data(json_string):
  raw_data = ''
  return raw_data
