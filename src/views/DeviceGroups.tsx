import { Button, Card, Dropdown, Flex, Input, InputNumber, Modal, Select, Space, Switch, Tooltip, Typography, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { asyncFetchJson, promiseFetchJson } from '../util/fetch';
import { api } from '../api/api';
import { allFalseMap, cleanupDefaultValue, findObjByIdId, isNotBlank, myFilter, tryParseJSONObject } from '../util/misc';
import { showCommonError } from '../util/commonError';
import { DeviceGroupType, DeviceGroupType_AdminCanAdd, HideInServerStatus, translateBackendString } from '../api/model_front';
import { copyToClipboard, renderSelect2, renderSelectBackendString, renderSelectIdName } from '../util/ui';
import { CopyOutlined, DeleteOutlined, DisconnectOutlined, EditFilled, EditOutlined, FileAddOutlined, FireOutlined, InboxOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { MyModal } from '../util/MyModal';
import { clone } from 'lodash-es';
import { ignoreError, newPromiseRejectNow } from '../util/promise';
import { formatInfoTraffic } from '../util/format';
import { MEditor, getEditor } from '../widget/MEditor';
import { myvar } from '../myvar';
import { DragSortTable, ProColumns } from '@ant-design/pro-components';
import { noDistConfig } from '../distConfig';
import { IPPortWidget } from '../widget/IPPortWidget';

export function DeviceGroupsView(props: { isAdmin: boolean, adminShowUserOutbound: boolean }) {
  const api2 = props.isAdmin ? api.admin : api.user

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const editingObj = useRef<any>(null)
  const editingObjConfig = useRef<any>(null)
  const editingError = useRef({
    configJSON: false,
  })

  const [mncEditingObj, setMncEditingObj] = useState<any>({});
  const [mncOpen, setMncOpen] = useState(false)

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const updateData = () => {
    setLoading(true);
    const wtf = props.adminShowUserOutbound ? "adminShowUserOutbound=1" : ""
    asyncFetchJson(api2.devicegroup_list(wtf), (ret) => {
      setLoading(false);
      if (ret.data != null) {
        const newData: any[] = []
        for (let i = 0; i < ret.data.length; i++) {
          ret.data[i].display_name = ret.data[i].name + " (#" + ret.data[i].id + ")"
          ret.data[i].display_traffic = formatInfoTraffic(ret.data[i], true)
          if (ret.data[i].show_order == null) ret.data[i].show_order = 0
          //
          if (!props.isAdmin && ret.data[i].type != DeviceGroupType.OutboundByUser) {// 单端隧道不显示其他的
            continue
          }
          //
          newData.push(ret.data[i])
        }
        setData(newData)
      }
    })
  }
  useEffect(updateData, [JSON.stringify(props)])

  // 表格

  const columns: ProColumns[] = [
    { title: '排序', dataIndex: 'show_order', className: 'drag-visible', },
    { title: '名称', key: 'id', dataIndex: 'display_name', },
    { title: '用户组 ID', key: 'enable_for_gid', dataIndex: 'enable_for_gid' },
    {
      title: '类型', key: 'type', dataIndex: 'id', renderText: (e: number) => {
        const obj = findObjByIdId(data, e)
        const config = tryParseJSONObject(obj.config)
        if (obj.type == DeviceGroupType.Inbound && config.direct) {
          return "入口(直出)"
        }
        return translateBackendString(obj.type)
      }
    },
    { title: '连接地址(仅入口展示用)', key: 'connect_host', dataIndex: 'id', render: (n: any) => <IPPortWidget data={findObjByIdId(data, n)} /> },
    { title: '倍率', key: 'ratio', dataIndex: 'ratio' },
    { title: '已用流量', key: 'yyll', dataIndex: 'display_traffic' },
    { title: '在线设备', key: 'zxsbsl', dataIndex: 'display_num' },
    { title: '备注', key: 'note', dataIndex: 'note', render: (n: any) => n ? String(n).split("\n")[0] : "" },
    {
      title: '操作', key: 'action', dataIndex: 'id', renderText: function (e: number) {
        return <Flex gap={8}>
          <Dropdown
            menu={{
              items: [
                {
                  key: "copyCommand1",
                  icon: <CopyOutlined />,
                  label: "复制在线安装命令 (自动探测线路)",
                  onClick: () => copyOnekeyCommand(findObjByIdId(data, e), false)
                },
                {
                  key: "copyCommand2",
                  icon: <CopyOutlined />,
                  label: "复制在线安装命令 (海外主线路)",
                  onClick: () => copyOnekeyCommand(findObjByIdId(data, e), true)
                },
                {
                  key: "offlineCommand",
                  icon: <InboxOutlined />,
                  label: "离线部署",
                  onClick: () => offlineCommand(findObjByIdId(data, e))
                },
                {
                  key: "openConfig",
                  icon: <InfoCircleOutlined />,
                  label: "查看节点配置（调试用）",
                  onClick: () => window.open("/api/v1/client/config_v2?token=" + findObjByIdId(data, e).token, '_blank')
                }
              ]
            }}><Button>对接</Button></Dropdown>
          <Tooltip title="重置 token"><Button icon={<DisconnectOutlined />} onClick={() => resetToken(e)} /></Tooltip>
          <Tooltip title="编辑"><Button icon={<EditOutlined />} onClick={() => editDeviceGroup(findObjByIdId(data, e))} /></Tooltip>
          <Tooltip title="高级编辑"><Button icon={<EditFilled />} onClick={() => expertEdit(findObjByIdId(data, e))} /></Tooltip>
          <Tooltip title="删除"><Button icon={<DeleteOutlined />} onClick={() => deleteDeviceGroup(e)} /></Tooltip>
        </Flex>
      }
    },
  ];
  if (!props.isAdmin) columns.splice(2 - 0, 1) // 隐藏列
  if (!props.isAdmin) columns.splice(4 - 1, 1) // 隐藏列
  if (!props.isAdmin) columns.splice(5 - 2, 1) // 隐藏列

  const onTypeChange = (e: string) => {
    editingObj.current.type = e
    // 更新可视
    const visFw = document.querySelectorAll(".vis-fw")
    const visInbound = document.querySelectorAll(".vis-inbound")
    const visOutbound = document.querySelectorAll(".vis-outbound")
    if (e == DeviceGroupType.Inbound) {
      visFw.forEach((el) => (el as HTMLElement).style.display = "")
      visInbound.forEach((el) => (el as HTMLElement).style.display = "")
      visOutbound.forEach((el) => (el as HTMLElement).style.display = "none")
    } else if (e.includes("Outbound")) {
      visFw.forEach((el) => (el as HTMLElement).style.display = "")
      visInbound.forEach((el) => (el as HTMLElement).style.display = "none")
      visOutbound.forEach((el) => (el as HTMLElement).style.display = "")
    } else {
      visFw.forEach((el) => (el as HTMLElement).style.display = "none")
      visInbound.forEach((el) => (el as HTMLElement).style.display = "none")
      visOutbound.forEach((el) => (el as HTMLElement).style.display = "none")
    }
  }

  // 开启了直出?
  const onDirectChange = (e: boolean) => {
    editingObjConfig.current.direct = e
    // 更新可视
    const visSuidao = document.querySelectorAll(".vis-suidao")
    if (e || editingObj.current.type != DeviceGroupType.Inbound) {
      visSuidao.forEach((el) => (el as HTMLElement).style.display = "none")
    } else {
      visSuidao.forEach((el) => (el as HTMLElement).style.display = "")
    }
  }

  function renderYJYC() {
    return <Flex className='neko-settings-flex-line vis-inbound' style={{ display: "none" }}>
      <Tooltip title='通过监听每个网卡的 IP 地址实现 UDP 源进源出，优先级高于 BIND_INBOUND。双 IP 的机器且对 UDP 有需求的，建议打开。'>
        <Typography.Text style={{ flex: 1 }} strong>UDP 智能绑定 (源进源出) (?)</Typography.Text>
      </Tooltip>
      <Switch
        defaultChecked={editingObjConfig.current.udp_smart_bind}
        onChange={(e) => editingObjConfig.current.udp_smart_bind = e} />
    </Flex>
  }

  function editDeviceGroup(obj: any, isNew?: boolean) {
    obj = clone(obj)
    if (isNew) obj = {}
    editingObj.current = obj
    editingObjConfig.current = ignoreError(() => JSON.parse(obj.config), {})
    // 啊啊啊
    if (props.isAdmin && !isNew) {
      setTimeout(() => {
        onTypeChange(editingObj.current.type)
        onDirectChange(editingObjConfig.current.direct)
      }, 300);
    }
    const beizhu = props.isAdmin ? "备注 (仅管理员可见)" : "备注 (仅自己可见)"
    //
    MyModal.confirm({
      icon: <p />,
      title: isNew ? "添加设备组" : "编辑设备组 " + obj.display_name,
      content: <Flex vertical>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>名称</Typography.Text>
          <Input
            defaultValue={obj.name}
            onChange={(e) => editingObj.current.name = e.target.value}
          ></Input>
        </Flex>
        <Flex className='neko-settings-flex-line' style={props.isAdmin ? {} : { display: "none" }}>
          <Tooltip title={<p>有权使用此组转发的用户组 ID (使用英文逗号分割， 0 表示无套餐用户可以查看探针。)</p>}>
            <Typography.Text strong>用户组 ID (?)</Typography.Text>
          </Tooltip>
          <Input
            defaultValue={obj.enable_for_gid}
            onChange={(e) => editingObj.current.enable_for_gid = e.target.value}
          ></Input>
        </Flex>
        <Flex className='neko-settings-flex-line vis-fw' style={props.isAdmin ? {} : { display: "none" }}>
          <Typography.Text strong>倍率</Typography.Text>
          <div className='dq-3'>
            <InputNumber
              min={0}
              step={0.01}
              addonAfter="x"
              defaultValue={obj.ratio == null ? 0 : Number(obj.ratio)}
              onChange={(e) => editingObj.current.ratio = e?.toString()}
            ></InputNumber>
          </div>
        </Flex>
        <Flex className='neko-settings-flex-line' style={props.isAdmin ? {} : { display: "none" }}>
          <Typography.Text strong>类型</Typography.Text>
          <Select
            disabled={!isNew}
            defaultValue={obj.type}
            options={renderSelectBackendString(DeviceGroupType_AdminCanAdd)}
            onChange={onTypeChange}
          ></Select>
        </Flex>
        {/* 入口 */}
        <Flex className='neko-settings-flex-line vis-inbound vis-suidao' style={{ display: "none" }}>
          <Tooltip title={<div>
            <p>选填，允许使用的「出口」设备组 ID (以英文逗号分割)</p>
            <p>设置后，用户选择本入口时，未允许使用的出口将不会出现在出口选项中。</p>
            <p>格式填错可能导致无法创建转发规则。</p>
          </div>}>
            <Typography.Text strong>限制出口 (?)</Typography.Text>
          </Tooltip>
          <Input
            defaultValue={obj.allowed_out}
            onChange={(e) => editingObj.current.allowed_out = e.target.value.trim()}
          ></Input>
        </Flex>
        <Flex className='neko-settings-flex-line vis-inbound' style={{ display: "none" }}>
          <Tooltip title={<div>
            <p>仅前端显示，无其他作用</p>
            <p>格式任意，一行一个</p>
          </div>}>
            <Typography.Text strong>连接地址 (?)</Typography.Text>
          </Tooltip>
          <Input.TextArea
            defaultValue={obj.connect_host}
            onChange={(e) => editingObj.current.connect_host = e.target.value.trim()}
          ></Input.TextArea>
        </Flex>
        <Flex className='neko-settings-flex-line vis-inbound' style={{ display: "none" }}>
          <Tooltip title={<p>入口允许监听的端口范围，示例： 10000-50000 (注意：格式错误会导致无法创建规则)</p>}>
            <Typography.Text strong>端口范围 (?)</Typography.Text>
          </Tooltip>
          <Input
            defaultValue={obj.port_range}
            placeholder='2000-65535'
            onChange={(e) => editingObj.current.port_range = e.target.value}
          ></Input>
        </Flex>
        <Flex className='neko-settings-flex-line vis-inbound' style={{ display: "none" }}>
          <Tooltip title='无需对端出口节点，由入口直接转发。适用于入口机器可以直接访问国际互联网的情景。'>
            <Typography.Text style={{ flex: 1 }} strong>入口直出 (专线) (?)</Typography.Text>
          </Tooltip>
          <Switch
            defaultChecked={editingObjConfig.current.direct}
            onChange={onDirectChange} />
        </Flex>
        {renderYJYC()}
        {/* 出口 */}
        <Flex className='neko-settings-flex-line vis-outbound' style={props.isAdmin ? {} : { display: "none" }}>
          <Tooltip title={<div>
            <p>选填，允许使用的「入口」设备组 ID (以英文逗号分割)</p>
            <p>设置后，用户选择某个入口时，若本出口不允许使用，则不会出现在出口选项中。</p>
            <p>格式填错可能导致无法创建转发规则。</p>
          </div>}>
            <Typography.Text strong>限制入口 (?)</Typography.Text>
          </Tooltip>
          <Input
            defaultValue={obj.allowed_in}
            onChange={(e) => editingObj.current.allowed_in = e.target.value.trim()}
          ></Input>
        </Flex>
        <Flex className='neko-settings-flex-line vis-outbound' style={!props.isAdmin ? {} : { display: "none" }}>
          <Tooltip title={"如需调整协议的具体参数，请使用“高级编辑”功能。"}>
            <Typography.Text strong>协议 (?)</Typography.Text>
          </Tooltip>
          <Select
            defaultValue={editingObjConfig.current.protocol}
            options={[
              { value: "ws", label: "ws" },
              { value: "ws2", label: "ws2" },
              { value: "tls_simple", label: "tls_simple" },
            ]}
            onChange={(e) => editingObjConfig.current.protocol = e}
          ></Select>
        </Flex>
        <Flex className='neko-settings-flex-line vis-outbound' style={!props.isAdmin ? {} : { display: "none" }}>
          <Tooltip title='若组内的服务器未与面板通信的时间超过此数值，则视为下线，从负载中移除。'>
            <Typography.Text strong>负载下线 (?)</Typography.Text>
          </Tooltip>
          <div className='dq-3'>
            <InputNumber
              min="20"
              step="1"
              addonAfter="秒"
              defaultValue={(obj.down_sec >= 20) ? obj.down_sec : 60}
              onChange={(e) => editingObj.current.down_sec = e}
            ></InputNumber>
          </div>
        </Flex>
        <Flex className='neko-settings-flex-line vis-outbound'>
          <Typography.Text strong>故障转移组</Typography.Text>
          <Select
            defaultValue={obj.fallback_group ?? 0}
            options={renderSelectIdName(
              ([{ id: 0, name: "无" }] as any[]).concat(
                ...myFilter(data.filter(o => o.id != obj.id), "type", [DeviceGroupType.OutboundBySite, DeviceGroupType.OutboundByUser])
              ), undefined, true)}
            onChange={(e) => editingObj.current.fallback_group = e}
          ></Select>
        </Flex>
        {/* 最后 */}
        <Flex className='neko-settings-flex-line' style={props.isAdmin ? {} : { display: "none" }}>
          <Typography.Text className='dq-1'>在探针中隐藏</Typography.Text>
          <div className='dq-2'>
            <Select
              defaultValue={obj.hide_status ?? 0}
              options={renderSelect2(HideInServerStatus)}
              onChange={(e) => editingObj.current.hide_status = e}
            ></Select>
          </div>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>{beizhu}</Typography.Text>
          <Input.TextArea
            defaultValue={obj.note}
            onChange={(e) => editingObj.current.note = e.target.value.trim()}
          ></Input.TextArea>
        </Flex>
      </Flex>,
      onOk: () => {
        if (!allFalseMap(editingError.current)) return newPromiseRejectNow(null)
        editingObj.current.config = JSON.stringify(cleanupDefaultValue(editingObjConfig.current))
        return promiseFetchJson(isNew ? api2.devicegroup_create(editingObj.current) : api2.devicegroup_update(obj.id, editingObj.current), (ret) => {
          showCommonError(ret, ["", "设备组更新失败"], updateData)
        })
      }
    })
  }

  function deleteDeviceGroup(e: number) {
    MyModal.confirm({
      icon: <p />,
      title: "删除设备组",
      content: <p>你确定要删除设备组 {findObjByIdId(data, e).display_name} 吗？</p>,
      onOk: () => {
        return promiseFetchJson(api2.devicegroup_delete([e]), (ret) => {
          showCommonError(ret, ["", "删除设备组失败"], updateData)
        })
      }
    })
  }

  function resetToken(e: number) {
    const obj = findObjByIdId(data, e);
    MyModal.confirm({
      icon: <p />,
      title: "重置 token",
      content: <div>
        <p>你确定要重置设备组 {obj.display_name} 的 token 吗？</p>
        <p>重置后，一定要卸载节点端，用新的命令重新对接，机器才会上线。</p>
        <p>当前token: {obj.token}</p>
      </div>,
      onOk: () => {
        return promiseFetchJson(api2.devicegroup_reset_token(e), (ret) => {
          showCommonError(ret, ["重置成功", "重置失败"], updateData)
        })
      }
    })
  }

  function resetTraffic(e: string[] | number[] | React.Key[]) {
    if (e.length == 0) return
    MyModal.confirm({
      icon: <p />,
      title: "清空流量",
      content: <p>你确定要清空 {e.length} 个设备组的流量吗？</p>,
      onOk: () => {
        return promiseFetchJson(api2.devicegroup_reset_traffic(e), (ret) => {
          showCommonError(ret, ["", "清空流量失败"], updateData)
        })
      }
    })
  }

  function argsForGroup(obj: any) {
    let str = `"是否为出口 -t ${obj.token} -u ${location.origin}"`
    if (obj.type == DeviceGroupType.Inbound || obj.type == DeviceGroupType.AgentOnly) {
      str = str.replace("是否为出口 ", "")
    } else {
      str = str.replace("是否为出口", "-o")
    }
    return str
  }

  function copyOnekeyCommand(obj: any, isOverSeas: boolean) {
    if (!myvar.nyanpass_config_ok) {
      noDistConfig()
    }
    let copyStr = `bash <(curl -fLSs ${isOverSeas ? myvar.distConfig.clientScriptOverseas : myvar.distConfig.clientScript}) rel_nodeclient ${argsForGroup(obj)}`
    copyToClipboard(copyStr, `对接命令复制成功: ${obj.display_name}`)
  }

  function offlineCommand(obj: any) {
    if (!myvar.nyanpass_config_ok) {
      noDistConfig()
    }
    const copyStr_Install_Command = `unzip -d /tmp/nyanpass -o offline.zip && bash /tmp/nyanpass/offline.sh ${argsForGroup(obj)}`
    const downloadCards: JSX.Element[] = []
    for (const [key, value] of Object.entries(myvar.distConfig.offlinePkgs)) {
      if (isNotBlank(key) && isNotBlank(value)) {
        downloadCards.push(<a target="_blank" href={String(value)}>{key}</a>)
      }
    }
    if (downloadCards.length == 0) {
      for (const [key, value] of Object.entries(myvar.defaultDistConfig.offlinePkgs)) {
        if (isNotBlank(key) && isNotBlank(value)) {
          downloadCards.push(<a target="_blank" href={String(value)}>{key}</a>)
        }
      }
    }
    //
    MyModal.info({
      title: "离线部署",
      content: <div>
        <Space direction='vertical'>
          <Typography.Text strong>请按机器的架构下载合适的包：</Typography.Text>
          {downloadCards}
        </Space>
        <hr />
        <Space direction='vertical'>
          <div></div>
          <Space>
            <Typography.Text strong>{obj.display_name}</Typography.Text>
            <Typography.Text>的离线对接命令：</Typography.Text>
          </Space>
          <div></div>
        </Space>
        <Card>
          <Typography.Paragraph copyable>{copyStr_Install_Command}</Typography.Paragraph>
        </Card>
        <p>使用方法：上传离线包到【无法在线对接的机器】并重命名为 offline.zip。然后切换到【离线包所在目录】运行以上命令。</p>
        <p>提示：离线安装依赖 unzip 命令，请自行安装。</p>
      </div>
    })
  }

  function expertEdit(obj: any) {
    setMncEditingObj(obj)
    setMncOpen(true)
  }

  function expertEditClose(ok: boolean) {
    setMncOpen(false)
    if (!ok) return
    try {
      const m = getEditor()
      const config = m!.getValue()
      if (tryParseJSONObject(config) == null) {
        message.error("输入的JSON无效。")
        return
      }
      mncEditingObj.config = config
      return promiseFetchJson(api2.devicegroup_update(mncEditingObj.id, mncEditingObj), (ret) => {
        showCommonError(ret, ["", "更新失败"], updateData)
      })
    } catch (e: any) {
      MyModal.error({
        title: "保存出错",
        content: e,
      })
    }
  }

  const handleDragSortEnd = (
    beforeIndex: number,
    afterIndex: number,
    newData: any,
  ) => {
    setData(newData)
    setLoading(true)
    asyncFetchJson(api.common.reorder(props.isAdmin ? "/api/v1/admin/devicegroup/reorder" : "/api/v1/user/devicegroup/reorder", newData), (ret) => {
      setLoading(false)
      showCommonError(ret, true)
    })
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  return (
    <>
      <Modal
        closable={false}
        maskClosable={false}
        open={mncOpen}
        title={mncEditingObj.display_name}
        onOk={() => expertEditClose(true)}
        onCancel={() => expertEditClose(false)}>
        <MEditor value={mncEditingObj.config} />
      </Modal>
      <Card title={"设备组管理 " + (props.isAdmin ? "(站点管理员)" : "(我的单端隧道)")}>
        <Flex vertical>
          <Flex>
            <Button icon={<FileAddOutlined />} onClick={() => editDeviceGroup(null, true)}>添加设备组</Button>
            <Button icon={<FireOutlined />} onClick={() => resetTraffic(selectedRowKeys)}>清空流量</Button>
          </Flex>
          <DragSortTable
            rowKey="id"
            pagination={false}
            search={false}
            options={false}
            loading={loading}
            columns={columns}
            dataSource={data}
            dragSortKey="show_order"
            onDragSortEnd={handleDragSortEnd}
            rowSelection={{ selectedRowKeys, onChange: onSelectChange }}
          />
        </Flex>
      </Card>
    </>
  )
}
