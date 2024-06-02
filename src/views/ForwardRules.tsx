import { Card, Flex, Button, Table, Typography, Modal, Input, Select, Tooltip, Tag, message, Collapse, CollapseProps, InputNumber, FloatButton } from "antd";
import { byteConverter, formartDests, formatInfoTraffic, formatUnix } from "../util/format";
import React, { useEffect, useRef, useState } from "react";
import { asyncFetchJson, promiseFetchJson } from "../util/fetch";
import { api } from "../api/api";
import { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { ignoreError, ignoreErrorAndBlank } from "../util/promise";
import { myFilter as myFilter, findObjByIdId, isNotBlank, tryParseJSONObject, cleanupDefaultValue, batchIds } from "../util/misc";
import { commonEx, showCommonError } from "../util/commonError";
import { DeviceGroupType, FrontForwardConfig, SelectorType, parseFrontForwardConfig, translateBackendString } from "../api/model_front";
import { copyToClipboard, renderP, renderSelectBackendString, renderSelectIdName, tableShowTotal } from "../util/ui";
import { BackwardOutlined, BarChartOutlined, CheckSquareOutlined, CopyOutlined, DeleteOutlined, EditFilled, EditOutlined, FileAddOutlined, FireOutlined, PauseCircleOutlined, PlayCircleOutlined, QuestionCircleOutlined, SearchOutlined, SyncOutlined } from "@ant-design/icons";
import { MyMessage, MyModal } from "../util/MyModal";
import { clone } from "lodash-es";
import { MEditor, getEditor } from "../widget/MEditor";
import MySyntaxHighlighter from "../widget/MySyntaxHighlither";
import { apiForward } from "../api/forward";
import { FilterValue, SorterResult } from "antd/es/table/interface";
import { ReqSearchRules, TableParams, tableParams2Qs } from "../api/model_api";
import { IPPortWidget } from "../widget/IPPortWidget";
import { render2Node } from "../util/reactw";
import { reloadMyVar } from "../myvar";

export function ForwardRulesView(props: { userInfo: any }) {
  const { userInfo } = props;

  const url = new URL(location as any)
  const affectId = url.searchParams.get("affect")
  const gotoId = url.searchParams.get("goto")

  const forward = new apiForward(affectId)

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [deviceGroupList, setDeviceGroupList] = useState<any>([])
  const [currentInboundDgId, setCurrentInboundDgId] = useState(0)
  const [currentOutboundDgId, setCurrentOutboundDgId] = useState(0)
  const [mncEditingObj, setMncEditingObj] = useState<any>({});
  const [mncOpen, setMncOpen] = useState(false)

  const searchObj = useRef<ReqSearchRules | null>(null)
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    try {
      const dgIn = findObjByIdId(deviceGroupList, currentInboundDgId)
      const dgOut = findObjByIdId(deviceGroupList, currentOutboundDgId)
      if (dgIn == null) return
      const dgInConfig = dgIn.config_parsed
      // const dgOutConfig = dgOut.config_parsed
      {
        const rkdk = document.getElementById("id-rkdk")
        if (rkdk != null) {
          let str = dgIn.port_range
          if (str == null || str == "") {
            rkdk.style.display = 'none'
          } else {
            rkdk.style.display = ''
            render2Node(renderP("可用端口: " + str), rkdk)
          }
        }
      }
      {
        const rkxx = document.getElementById("id-rkxx")
        const rkxxFlex = document.getElementById("id-rkxx-flex")
        if (rkxx != null && rkxxFlex != null) {
          let str = []
          if (dgInConfig.disable_udp) {
            str.push("屏蔽 UDP")
          }
          if (isNotBlank(dgInConfig.blocked_protocol)) {
            str.push("屏蔽协议: " + JSON.stringify(dgInConfig.blocked_protocol))
          }
          if (isNotBlank(dgInConfig.blocked_host)) {
            str.push("屏蔽域名 " + JSON.stringify(dgInConfig.blocked_host))
          }
          if (isNotBlank(dgInConfig.blocked_path)) {
            str.push("屏蔽路径: " + JSON.stringify(dgInConfig.blocked_path))
          }
          if (isNotBlank(dgInConfig.allowed_host)) {
            str.push("允许域名: " + JSON.stringify(dgInConfig.allowed_host))
          }
          // 更新入口信息
          {
            if (str.length == 0) {
              rkxxFlex.style.display = "none"
            } else {
              rkxxFlex.style.display = ""
              render2Node(renderP(str.join("\n")), rkxx)
            }
          }
        }
      }
      {
        const chukou = document.getElementById("id-chukou")
        if (chukou != null) {
          if (dgInConfig.direct) {
            chukou.style.display = "none"
            editingObj.current.device_group_out = null
            setCurrentOutboundDgId(0)
          } else {
            chukou.style.display = ""
          }
        }
      }
      {
        const ljxx = document.getElementById("id-ljxx")
        const ljxxFlex = document.getElementById("id-ljxx-flex")
        if (ljxx != null && ljxxFlex != null) {
          let str = []
          let disable_mux = dgInConfig.disable_mux
          if (dgOut != null) {
            if (dgOut.display_protocol == "tls" || dgOut.display_protocol == "tls_simple") {
              str.push("协议: TLS 隧道")
            } else if (dgOut.display_protocol == "ws") {
              str.push("协议: WS 隧道")
            } else if (dgOut.display_protocol == "direct") {
              str.push("协议: 直接转发")
              disable_mux = true
            } else {
              str.push("协议: 未知")
            }
            if (disable_mux != true) {
              str.push("延迟优化: 开启")
            }
          }
          if (dgInConfig.direct) {
            str.push("转发类型: 入口直出")
          }
          // 更新出口信息
          if (str.length == 0) {
            ljxxFlex.style.display = "none"
          } else {
            ljxxFlex.style.display = ""
            render2Node(renderP(str.join(" / ")), ljxx)
          }
        }
      }
    } catch (error) {
      console.log(error)
    }
    // TODO 啊？
    try {
      const dgIn = findObjByIdId(deviceGroupList, currentInboundDgId);
      let options = renderSelectIdName(myFilter(deviceGroupList, "type", [DeviceGroupType.OutboundBySite]));
      if (dgIn != null && isNotBlank(dgIn.allowed_out)) {
        const allowed = String(dgIn.allowed_out).trim().split(",").map(v => {
          const n = Number(v)
          if (isNaN(n)) return 0
          return n
        })
        options = myFilter(options, "value", allowed)
      }
      const disallowUserOutbound = dgIn != null && String(dgIn.allowed_out).includes("禁止单端")
      if (!disallowUserOutbound) {
        options.push(...renderSelectIdName(myFilter(deviceGroupList, "type", [DeviceGroupType.OutboundByUser])));
      }
      // console.log(options)
      render2Node(<Flex className='neko-settings-flex-line'>
        <Typography.Text strong>出口</Typography.Text>
        <Select
          value={editingObj.current.device_group_out} // 每次都渲染，直接更新 value
          options={options}
          onChange={(e) => { editingObj.current.device_group_out = e; setCurrentOutboundDgId(e) }}
        ></Select>
      </Flex>, document.getElementById("id-chukou")!)
    } catch (error) {
      console.log(error)
    }
  }, [currentInboundDgId, currentOutboundDgId])

  const editingObj = useRef<any>(null)
  const editingForwardConfig = useRef(new FrontForwardConfig())

  const [data, setData] = useState<any[]>([]);
  const [ruleCount, setRuleCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      showSizeChanger: true,
      current: 1,
      pageSize: 10,
      pageSizeOptions: [10, 20, 50, 100, 200, 500, 1000],
      showTotal: tableShowTotal,
    },
  });

  // 处理后端返回的搜索结果
  function searchedRetProcess(newSearch: boolean) {
    return (ret: any) => {
      if (ret.code == 0) {
        if (ret.data.length == 0) {
          MyMessage.info("没有符合该条件的规则")
          if (!newSearch) {
            searchObj.current = null; setSearched(false); updateData(); //退回全部规则
          } else {
            throw commonEx
          }
        }
        for (let i = 0; i < ret.data.length; i++) {
          ret.data[i].display_name = ret.data[i].name + " (#" + ret.data[i].id + ")"
          ret.data[i].display_traffic = formatInfoTraffic(ret.data[i], true)
        }
        setData(ret.data)
        setSearched(true)
        if (newSearch) MyMessage.info(`找到 ${ret.data.length} 条规则`)
      } else {
        MyMessage.error(`搜索出错: ${ret.code} ${ret.msg}`)
        if (!newSearch) {
          searchObj.current = null; setSearched(false); updateData(); //退回全部规则
        } else {
          throw commonEx
        }
      }
    }
  }

  const updateData = () => {
    setLoading(true);
    let qs = tableParams2Qs(tableParams)
    if (gotoId != null) {
      qs = "id=" + gotoId
    }
    if (searchObj.current != null) {
      asyncFetchJson(api.user.search(searchObj.current), (ret) => {
        setLoading(false);
        searchedRetProcess(false)(ret)
      })
    } else {
      asyncFetchJson(forward.forward_list(qs), (ret) => {
        setLoading(false);
        if (ret.data != null) {
          for (let i = 0; i < ret.data.length; i++) {
            ret.data[i].display_name = ret.data[i].name + " (#" + ret.data[i].id + ")"
            ret.data[i].display_traffic = formatInfoTraffic(ret.data[i], true)
          }
          setData(ret.data)
          setRuleCount(ret.count)
          setTableParams({
            ...tableParams,
            pagination: {
              ...tableParams.pagination,
              showTotal: tableShowTotal, // 这种黄色的可能不能... 而是要自己指定
              total: ret.count,
            },
          })
        }
      })
    }
    // 还有其他要东西加载。。。
    asyncFetchJson(forward.affectId ? api.admin.devicegroup_list("uid=" + forward.affectId) : api.user.devicegroup_list(), (ret) => {
      if (ret.data != null) {
        for (let i = 0; i < ret.data.length; i++) {
          // 不post这个对象，可以安全乱改
          if (ret.data[i].type == DeviceGroupType.OutboundByUser) {
            ret.data[i].name = ret.data[i].name + " (用户自带设备)"
          } else {
            ret.data[i].name = ret.data[i].name + " (倍率 " + ret.data[i].ratio + ")"
          }
          const haveOnline = ret.data[i].display_num > 0
          if (!haveOnline) ret.data[i].name = "[无在线设备] " + ret.data[i].name
          ret.data[i].config_parsed = ignoreError(() => JSON.parse(ret.data[i].config), {})
        }
        setDeviceGroupList(ret.data)
      }
    })
  }
  useEffect(updateData, [tableParams2Qs(tableParams)]);

  // 按钮

  function copyRules(e: string[] | number[] | React.Key[]) {
    let copyStr = new Array<String>()
    e.forEach(e => {
      const obj = findObjByIdId(data, Number(e))
      const cfg = parseFrontForwardConfig(obj.config) as any
      cfg.name = obj.name;
      cfg.listen_port = obj.listen_port;
      copyStr.push(JSON.stringify(cfg));
    })
    if (copyStr.length == 0) return
    copyToClipboard(copyStr.reverse().join("\n"), `成功复制 ${copyStr.length} 条规则`)
  }

  function deleteRules(e: string[] | number[] | React.Key[]) {
    if (e.length == 0) return
    let content = <p>你确定要删除 {e.length} 条规则吗？</p>
    if (e.length == 1) content = <p>你确定要删除 {findObjByIdId(data, Number(e[0])).display_name} 吗？</p>
    MyModal.confirm({
      icon: <p />,
      title: "删除规则",
      content: content,
      onOk: () => {
        return promiseFetchJson(forward.forward_delete(e), (ret) => {
          showCommonError(ret, ["", "删除规则失败"], updateData)
        })
      }
    })
  }

  function resetTraffic(e: string[] | number[] | React.Key[]) {
    if (e.length == 0) return
    MyModal.confirm({
      icon: <p />,
      title: "清空流量",
      content: <p>你确定要清空 {e.length} 条规则的流量吗？</p>,
      onOk: () => {
        return promiseFetchJson(forward.forward_reset_traffic(e), (ret) => {
          showCommonError(ret, ["", "清空流量失败"], updateData)
        })
      }
    })
  }

  function pauseRule(obj: any) {
    obj = clone(obj)
    obj.paused = !obj.paused
    return promiseFetchJson(forward.forward_update(obj.id, obj), (ret) => {
      showCommonError(ret, ["", "规则更新失败"], updateData)
    })
  }

  function pauseRules(ids: any[], pause: boolean) {
    return promiseFetchJson(forward.batch_update([{ ids: ids, column: "paused", value: pause }]), (ret) => {
      showCommonError(ret, ["", "规则更新失败"], updateData)
    })
  }

  function batchUpdateRules(ids: any[]) {
    if (ids.length == 0) return;
    const obj = {
      qdDgIn: "",
      qdDgOut: "",
    }
    ids = batchIds(ids)
    MyModal.confirm({
      icon: <p />,
      title: `批量更新 ${ids.length} 条规则`,
      content: <Flex vertical>
        <h3>批量更改可能需要等待一段时间才能生效。</h3>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>入口 (留空不更新)</Typography.Text>
          <Select
            options={renderSelectIdName(myFilter(deviceGroupList, "type", [DeviceGroupType.Inbound]))}
            onChange={(e) => { obj.qdDgIn = String(e) }}
          ></Select>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>出口 (留空不更新)</Typography.Text>
          <Select
            options={(() => {
              const list: any[] = [{ value: "0", label: "#0 (无需出口)" }]
              list.push(...renderSelectIdName(myFilter(deviceGroupList, "type", [DeviceGroupType.OutboundBySite, DeviceGroupType.OutboundByUser])))
              return list
            })()}
            onChange={(e) => { obj.qdDgOut = String(e) }}
          ></Select>
        </Flex>
      </Flex>,
      onOk: () => {
        const req: any[] = []
        if (isNotBlank(obj.qdDgIn)) req.push({ ids: ids, column: "device_group_in", value: obj.qdDgIn })
        if (isNotBlank(obj.qdDgOut)) req.push({ ids: ids, column: "device_group_out", value: obj.qdDgOut })
        if (req.length > 0) {
          return promiseFetchJson(forward.batch_update(req), (ret) => {
            showCommonError(ret, ["更新成功", "更新失败"], updateData)
          })
        }
      }
    })
  }

  function diagnose(e: number) {
    if (e <= 0) return
    asyncFetchJson(forward.forward_diagnose(e), (ret) => {
      MyModal.info({
        width: 800,
        title: "诊断结果 (#" + e + ")",
        content: <MySyntaxHighlighter>{ret.msg}</MySyntaxHighlighter>
      })
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
      return promiseFetchJson(forward.forward_update(mncEditingObj.id, mncEditingObj), (ret) => {
        showCommonError(ret, ["", "规则更新失败"], updateData)
      })
    } catch (e: any) {
      MyModal.error({
        title: "保存出错",
        content: e,
      })
    }
  }

  function btn_search_rules_onclick() {
    const obj = new ReqSearchRules()
    MyModal.confirm({
      icon: <p />,
      title: "搜索规则",
      content: <Flex vertical>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>规则名称 (模糊)</Typography.Text>
          <Input
            onChange={(e) => obj.name = e.target.value} />
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>入口</Typography.Text>
          <Select
            options={renderSelectIdName(myFilter(deviceGroupList, "type", [DeviceGroupType.Inbound]))}
            onChange={(e) => { obj.gid_in = e }}
          ></Select>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>出口</Typography.Text>
          <Select
            options={renderSelectIdName(myFilter(deviceGroupList, "type", [DeviceGroupType.OutboundBySite, DeviceGroupType.OutboundByUser]))}
            onChange={(e) => { obj.gid_out = e }}
          ></Select>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>监听端口 (精确)</Typography.Text>
          <InputNumber style={{ width: "100%" }}
            min="1"
            step="1"
            onChange={(e) => obj.listen_port = Number(e)} />
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>目标地址或端口 (模糊)</Typography.Text>
          <Input
            onChange={(e) => obj.dest = e.target.value} />
        </Flex>
      </Flex>,
      onOk: () => {
        searchObj.current = obj
        return promiseFetchJson(api.user.search(obj), searchedRetProcess(true))
      }
    })
  }

  function showUserStatistic() {
    asyncFetchJson(api.user.get_statistic(), ret => {
      MyModal.info({
        title: "统计数据，流量不计倍率。",
        content: <div>
          <p>今日流量: {byteConverter(ret.data.traffic_today, "GB").toFixed(2)} GiB</p>
          <p>昨日流量: {byteConverter(ret.data.traffic_yesterday, "GB").toFixed(2)} GiB</p>
        </div>,
      })
    })
  }

  // 表格

  const columns: ColumnsType<any> = [
    { title: '规则名', key: 'name', dataIndex: 'display_name', sorter: true },
    {
      title: '入口', key: 'device_group_in', dataIndex: 'id', render: function (e: number) {
        let fw = findObjByIdId(data, e)
        if (fw == null) return <Typography.Text>加载失败</Typography.Text>
        let devWtf = findObjByIdId(deviceGroupList, fw.device_group_in)
        if (devWtf == null) {
          devWtf = { name: "加载失败 #" + fw.device_group_in, connect_host: "加载失败" }
        } else {
          devWtf = clone(devWtf) // 乱改对象之前，先复制
        }
        devWtf.port_range = fw.listen_port
        devWtf.display_name = fw.display_name
        return <Flex vertical gap={1}>
          <Typography.Text>入口: {ignoreError(() => devWtf.name, "#" + fw.device_group_in)}</Typography.Text>
          <IPPortWidget data={devWtf} canOnlyPort={true} />
        </Flex>

      }, sorter: true
    },
    { title: '已用流量', key: 'traffic_used', dataIndex: 'display_traffic', sorter: true },
    {
      title: '出口', key: 'device_group_out', dataIndex: 'id', render: function (e: number) {
        let fw = findObjByIdId(data, e)
        const chukou = <Typography.Text >出口: {ignoreError(() => findObjByIdId(deviceGroupList, fw.device_group_out).name, "#" + fw.device_group_out)}</Typography.Text>
        const luodi = <Typography.Text>{formartDests(fw.config)}</Typography.Text>
        if (fw.device_group_out == 0) {
          return luodi
        }
        return <Flex vertical gap={1}>
          {chukou}
          {luodi}
        </Flex>
      }, sorter: true
    },
    {
      title: '状态', key: 'status', dataIndex: 'id', render: (e: any) => {
        const obj = findObjByIdId(data, e);
        const style: any = {}
        let str = translateBackendString(obj.status);
        if (obj.status == "ForwardRuleStatus_Failed") {
          style.color = "red"
        }
        if (obj.paused) {
          str = "已暂停"
          style.color = "blueviolet"
        }
        const tt = "最近更新: " + obj.display_updated_at
        return <Tooltip title={tt}><p style={style}>{str}</p></Tooltip>
      }
    },
    {
      title: '操作', key: 'action', dataIndex: 'id', render: function (e: number) {
        return <Flex gap={8}>
          <Tooltip title={findObjByIdId(data, e).paused ? "恢复" : "暂停"}><Button icon={findObjByIdId(data, e).paused ? <PlayCircleOutlined /> : <PauseCircleOutlined />} onClick={() => pauseRule(findObjByIdId(data, e))} /></Tooltip>
          <Tooltip title="诊断"><Button icon={<QuestionCircleOutlined />} onClick={() => diagnose(e)} /></Tooltip>
          <Tooltip title="复制"><Button icon={<CopyOutlined />} onClick={() => editRule(findObjByIdId(data, e), true)} /></Tooltip>
          <Tooltip title="编辑"><Button icon={<EditOutlined />} onClick={() => editRule(findObjByIdId(data, e))} /></Tooltip>
          <Tooltip title="高级编辑"><Button icon={<EditFilled />} onClick={() => expertEdit(findObjByIdId(data, e))} /></Tooltip>
          <Tooltip title="删除"><Button icon={<DeleteOutlined />} onClick={() => deleteRules([e])} /></Tooltip>
        </Flex>
      }
    },
  ];

  // 编辑规则

  function editRule(obj: any, isCopy?: boolean) {
    let isCreate = false
    let isBatch = obj == "batchAdd"
    if (isBatch) {
      obj = null
    } else {
      obj = clone(obj)
    }
    if (obj == null) {
      obj = {}
      isCreate = true
    } else if (isCopy) {
      obj.id = 0
      obj.listen_port = null
      isCreate = true
    }
    editingObj.current = obj
    editingForwardConfig.current = parseFrontForwardConfig(obj.config)
    //
    let collaspedItems: CollapseProps['items'] = [
      {
        key: '1',
        label: '高级选项',
        children: <Flex vertical>
          <Flex className='neko-settings-flex-line' gap={"1em"}>
            <Tooltip title={<p>当目标地址大于一个时，连接使用的负载均衡策略</p>}>
              <Typography.Text strong>负载均衡 (?)</Typography.Text>
            </Tooltip>
            <Select
              defaultValue={ignoreErrorAndBlank(() => editingForwardConfig.current.dest_policy, "random")}
              options={renderSelectBackendString(SelectorType)}
              onChange={(e) => editingForwardConfig.current.dest_policy = e}
            ></Select>
            <Typography.Text strong>Proxy Protocol</Typography.Text>
            <Select
              defaultValue={ignoreErrorAndBlank(() => editingForwardConfig.current.proxy_protocol, 0)}
              options={[
                { value: 0, label: "关闭" },
                { value: 1, label: "v1 (TCP)" },
                { value: 2, label: "v2 (TCP+UDP)" },
                { value: 3, label: "v2 (TCP)" },
              ]}
              onChange={(e) => editingForwardConfig.current.proxy_protocol = e}
            ></Select>
            <Flex className='neko-settings-flex-line'>
              <Tooltip title="0 表示不限速; 所有规则的总速率不会超过用户的限速">
                <Typography.Text strong>规则限速 (?)</Typography.Text>
              </Tooltip>
              <div className='dq-3'>
                <InputNumber
                  addonAfter="Mbps"
                  min="0"
                  step="1"
                  defaultValue={byteConverter(editingForwardConfig.current.speed_limit, "M_Net").toFixed(0)}
                  onChange={(e) => editingForwardConfig.current.speed_limit = Math.round(byteConverter(Number(e), "M_Net", true))}
                ></InputNumber>
              </div>
            </Flex>
          </Flex>
        </Flex>
      },
    ];
    if (isBatch) {
      collaspedItems = [{
        key: '2',
        label: 'JSON 设置',
        children: <Flex vertical>
          <Input.TextArea
            rows={6}
            placeholder="覆盖除 dest 以外的配置，请确保格式正确。"
            onChange={(e) => editingObj.current.json_settings = e.target.value}
          ></Input.TextArea>
        </Flex>
      }]
    }
    //
    const renderDiZhi = () => {
      if (isBatch) {
        return <>
          <Typography.Text strong>批量规则</Typography.Text>
          <Input.TextArea
            rows={6}
            placeholder={"一行一个，空行会被忽略。"}
            onChange={(e) => editingObj.current.content = e.target.value}
          ></Input.TextArea>
        </>
      }
      return <>
        <Typography.Text strong>目标地址</Typography.Text>
        <Input.TextArea
          rows={5}
          placeholder={"一行一个，空行会被忽略，格式如下:\n\n1.2.3.4:5678\n[2001::]:80\nexample.com:443"}
          defaultValue={ignoreError(() => editingForwardConfig.current.dest.join("\n"))}
          onChange={(e) => editingForwardConfig.current.dest = e.target.value.split("\n").map(v => v.trim()).filter(isNotBlank)}
        ></Input.TextArea>
      </>
    }
    //
    MyModal.confirm({
      icon: <p />,
      title: isCreate ? "添加规则" : "编辑规则 " + obj.display_name,
      content: <Flex vertical>
        <Flex className='neko-settings-flex-line' style={isBatch ? { display: "none" } : {}}>
          <Typography.Text strong>名称</Typography.Text>
          <Input
            defaultValue={obj.name}
            onChange={(e) => editingObj.current.name = e.target.value}
          ></Input>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>入口</Typography.Text>
          <Select
            defaultValue={obj.device_group_in}
            options={renderSelectIdName(myFilter(deviceGroupList, "type", [DeviceGroupType.Inbound]))}
            onChange={(e) => { editingObj.current.device_group_in = e; setCurrentInboundDgId(e) }}
          ></Select>
        </Flex>
        <Flex className='neko-settings-flex-line' id="id-rkxx-flex" style={{ display: "none" }}>
          <Typography.Text strong>入口信息</Typography.Text>
          <Card bodyStyle={{ padding: "1em" }}>
            <div id="id-rkxx" className="always-wrap-text" />
          </Card>
        </Flex>
        <Flex className='neko-settings-flex-line' style={isBatch ? { display: "none" } : {}} >
          <Typography.Text strong >监听端口</Typography.Text>
          <div id="id-rkdk" className="left-margin" />
          <Input // 允许留空，所以不能用 InputNumber
            placeholder="留空则随机"
            defaultValue={obj.listen_port}
            onChange={(e) => editingObj.current.listen_port = Number(e.target.value)}
          ></Input>
        </Flex>
        <div id="id-chukou" style={{ width: "100%" }}></div>
        <Flex className='neko-settings-flex-line' id="id-ljxx-flex" style={{ display: "none" }}>
          <Typography.Text strong>连接信息</Typography.Text>
          <Card bodyStyle={{ padding: "1em" }}>
            <Typography.Text id="id-ljxx" className="always-wrap-text" />
          </Card>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          {renderDiZhi()}
        </Flex>
        <Collapse items={collaspedItems} style={{ width: "100%" }} />
      </Flex>,
      onOk: () => {
        // 省略
        if (editingForwardConfig.current.proxy_protocol == 0) {
          editingForwardConfig.current.proxy_protocol = undefined
        }
        editingObj.current.config = JSON.stringify(cleanupDefaultValue(editingForwardConfig.current));
        if (isBatch) {
          if (isNotBlank(editingObj.current.json_settings)) {
            editingObj.current.config = editingObj.current.json_settings
          } else {
            editingObj.current.config = null
          }
          return promiseFetchJson(forward.forward_batch_create(editingObj.current), (ret) => {
            showCommonError(ret, ["规则更新成功", "规则更新失败"], updateData)
          })
        }
        return promiseFetchJson(isCreate ? forward.forward_create(editingObj.current) : forward.forward_update(obj.id, editingObj.current), (ret) => {
          showCommonError(ret, ["", "规则更新失败"], updateData)
        })
      }
    })
    // call effect (?)
    setCurrentInboundDgId(0)
    setCurrentOutboundDgId(0)
    setTimeout(() => {
      setCurrentInboundDgId(obj.device_group_in)
      setCurrentOutboundDgId(obj.device_group_out)
    }, 300);
  }

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<any> | SorterResult<any>[]
  ) => {
    setTableParams({
      pagination,
      filters,
      sorter,
    });

    // `dataSource` is useless since `pageSize` changed
    if (pagination.pageSize !== tableParams.pagination?.pageSize) {
      setData([]);
    }
  };

  function renderTitle() {
    let title = ""
    if (affectId == null) {
      title = "我的转发规则"
    } else {
      title = `用户转发规则 (UID=${affectId})`
    }
    if (gotoId != null) {
      title += ` (规则ID=${gotoId})`
    }
    //
    let title2 = <span>{title}</span>
    // 用户规则搜索按钮
    let search = <Button icon={<SearchOutlined />} onClick={btn_search_rules_onclick}>搜索规则</Button>
    if (searched) search = <Button icon={<BackwardOutlined />} onClick={() => { searchObj.current = null; setSearched(false); updateData() }}>返回所有规则</Button>
    if (affectId != null) search = <></>
    // 统计数据按钮
    let tjsjButton = <Button icon={<BarChartOutlined />} onClick={showUserStatistic}>统计数据</Button>
    if (affectId != null) tjsjButton = <></>
    return <Flex className="ant-flex2" style={{ marginBottom: "1em", marginTop: "1em" }}>
      {title2}
      {search}
      <Button icon={<SyncOutlined />} onClick={() => {
        updateData()
        reloadMyVar({ userInfo: true })
      }}>刷新</Button>
      {tjsjButton}
    </Flex>
  }

  function renderTags() {
    if (affectId != null) return <></>
    return <>
      <Tag>流量: {formatInfoTraffic(userInfo, true)}</Tag>
      <Tag>到期: {ignoreError(() => formatUnix(userInfo.expire, { color: true }))}</Tag>
      <Tag>规则数: {ruleCount} / {ignoreError(() => userInfo.max_rules)}</Tag>
    </>
  }

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
      <Card title={renderTitle()}>
        <Flex vertical className="ant-flex2">
          <Flex className="ant-flex2">
            {renderTags()}
            <Button icon={<FileAddOutlined />} onClick={() => editRule(null)} >添加规则</Button>
            <Button icon={<FileAddOutlined />} onClick={() => editRule("batchAdd")} >批量添加</Button>
            <Button icon={<CopyOutlined />} onClick={() => copyRules(selectedRowKeys)}>批量导出</Button>
            <Button icon={<CheckSquareOutlined />} onClick={() => batchUpdateRules(selectedRowKeys)}>批量切换</Button>
            <Button icon={<FireOutlined />} onClick={() => resetTraffic(selectedRowKeys)}>清空流量</Button>
            <Button icon={<DeleteOutlined />} onClick={() => deleteRules(selectedRowKeys)}>删除选中</Button>
          </Flex>
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={data}
            pagination={searched ? false : tableParams.pagination}
            onChange={handleTableChange}
            rowSelection={{ selectedRowKeys, onChange: (ks) => setSelectedRowKeys(ks) }}
          />
        </Flex>
      </Card>
      <FloatButton.Group shape="square">
        <Tooltip title="添加规则">
          <FloatButton shape="square" icon={<FileAddOutlined />} description="单条" onClick={() => editRule(null)}></FloatButton>
        </Tooltip>
        <Tooltip title="批量添加规则">
          <FloatButton shape="square" icon={<FileAddOutlined />} description="批量" onClick={() => editRule("batchAdd")}></FloatButton>
        </Tooltip>
        <Tooltip title="批量导出">
          <FloatButton shape="square" icon={<CopyOutlined />} description="导出" onClick={() => copyRules(selectedRowKeys)}></FloatButton>
        </Tooltip>
        <Tooltip title="批量切换">
          <FloatButton shape="square" icon={<CheckSquareOutlined />} description="切换" onClick={() => batchUpdateRules(selectedRowKeys)}></FloatButton>
        </Tooltip>
        <Tooltip title="清空流量">
          <FloatButton shape="square" icon={<FireOutlined />} description="流量" onClick={() => resetTraffic(selectedRowKeys)}></FloatButton>
        </Tooltip>
        <Tooltip title="批量暂停">
          <FloatButton shape="square" icon={<PauseCircleOutlined />} description="暂停" onClick={() => pauseRules(selectedRowKeys, true)}></FloatButton>
        </Tooltip>
        <Tooltip title="批量启动">
          <FloatButton shape="square" icon={<PlayCircleOutlined />} description="启动" onClick={() => pauseRules(selectedRowKeys, false)}></FloatButton>
        </Tooltip>
        <Tooltip title="删除选中">
          <FloatButton shape="square" icon={<DeleteOutlined />} description="删除" onClick={() => deleteRules(selectedRowKeys)}></FloatButton>
        </Tooltip>
      </FloatButton.Group>
    </>
  )
}
