import { Button, Card, Checkbox, DatePicker, Flex, Input, InputNumber, Select, Switch, Table, Tooltip, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { asyncFetchJson, promiseFetchJson } from '../util/fetch';
import { api } from '../api/api';
import { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { byteConverter, formartDests as displayDests, formatBoolean, formatInfoTraffic, formatUnix } from '../util/format';
import { allFalseMap, findObjByIdId, isNotBlank, myFilter } from '../util/misc';
import { BackwardOutlined, DeleteOutlined, EditOutlined, LogoutOutlined, PaperClipOutlined, RedEnvelopeOutlined, SearchOutlined, ShoppingOutlined, UserAddOutlined, UserOutlined } from '@ant-design/icons';
import { commonEx, showCommonError } from '../util/commonError';
import { ignoreError, newPromiseRejectNow } from '../util/promise';
import { myvar, reloadMyVar } from '../myvar';
import { MyMessage, MyModal } from '../util/MyModal';
import { clone } from 'lodash-es';
import { displayCurrency, filtersBoolean, renderSelectIdName, tableSearchDropdown, tableShowTotal } from '../util/ui';
import { ReqSearchRules, TableParams, tableParams2Qs } from '../api/model_api';
import dayjs, { unix } from 'dayjs';
import { FilterValue, SorterResult } from 'antd/es/table/interface';
import { DeviceGroupType, FrontInviteConfig, PlanType, translateBackendString } from '../api/model_front';
import { InviteSettings, editingInviteSettings } from '../widget/InviteSettings';
import { apiForward } from '../api/forward';

export function AdminUsersView() {
  const newUsername = useRef("")
  const searchObj = useRef(new ReqSearchRules())
  const [searched, setSearched] = useState(false);
  const [searchedRules, setSearchedRules] = useState<any[]>([]);
  const [searchedSelectedRowKeys, setSearchedSelectedRowKeys] = useState<React.Key[]>([]);
  const [deviceGroupList, setDeviceGroupList] = useState<any>([])

  const editingObj = useRef<any>(null)
  const editingError = useRef({
    expireTime: false,
  })

  const [data, setData] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
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

  const updateData = () => {
    setSearched(false);
    setLoading(true);
    asyncFetchJson(api.admin.user_list(tableParams2Qs(tableParams)), (ret) => {
      setLoading(false);
      if (ret.data != null) {
        for (let i = 0; i < ret.data.length; i++) {
          ret.data[i].display_traffic = formatInfoTraffic(ret.data[i], true)
        }
        setData(ret.data)
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
    asyncFetchJson(api.admin.shop_plan_list(), (ret) => {
      if (ret.data != null) {
        for (let i = 0; i < ret.data.length; i++) {
          ret.data[i].display_name = ret.data[i].name + " (#" + ret.data[i].id + ")"
          ret.data[i].display_traffic = formatInfoTraffic(ret.data[i], true)
        }
        setPlans(ret.data)
      }
    })
    asyncFetchJson(api.admin.devicegroup_list(""), (ret) => {
      setLoading(false);
      if (ret.data != null) {
        const newData: any[] = []
        for (let i = 0; i < ret.data.length; i++) {
          ret.data[i].name = ret.data[i].name + " (#" + ret.data[i].id + ")" // 这里直接改name
          newData.push(ret.data[i])
        }
        setDeviceGroupList(newData)
      }
    })
  }
  useEffect(updateData, [tableParams2Qs(tableParams)]);

  // 按钮

  function btn_create_onclick() {
    MyModal.confirm({
      icon: <p />,
      title: "添加用户",
      content: <Flex vertical>
        <Input
          prefix={<UserOutlined />}
          placeholder="用户名"
          onChange={(e) => newUsername.current = e.target.value} />
      </Flex>,
      onOk: () => {
        const req = api.admin.user_create(newUsername.current)
        // 清空
        newUsername.current = ""
        return promiseFetchJson(req, (ret) => {
          showCommonError(ret, ["添加用户成功", "添加用户失败"], updateData)
        })
      }
    })
  }

  function btn_search_rules_onclick() {
    searchObj.current = new ReqSearchRules()
    MyModal.confirm({
      icon: <p />,
      title: "搜索用户规则",
      content: <Flex vertical>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>规则名称 (模糊)</Typography.Text>
          <Input
            onChange={(e) => searchObj.current.name = e.target.value} />
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>入口</Typography.Text>
          <Select
            options={renderSelectIdName(myFilter(deviceGroupList, "type", [DeviceGroupType.Inbound]))}
            onChange={(e) => { searchObj.current.gid_in = e }}
          ></Select>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>出口</Typography.Text>
          <Select
            options={renderSelectIdName(myFilter(deviceGroupList, "type", [DeviceGroupType.OutboundBySite, DeviceGroupType.OutboundByUser]))}
            onChange={(e) => { searchObj.current.gid_out = e }}
          ></Select>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>监听端口 (精确)</Typography.Text>
          <InputNumber style={{ width: "100%" }}
            min="1"
            step="1"
            onChange={(e) => searchObj.current.listen_port = Number(e)} />
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>落地地址或端口 (模糊)</Typography.Text>
          <Input
            onChange={(e) => searchObj.current.dest = e.target.value} />
        </Flex>
      </Flex>,
      onOk: () => {
        return promiseFetchJson(api.admin.search(searchObj.current), (ret) => {
          if (ret.code == 0) {
            if (ret.data.length == 0) {
              MyMessage.info("没有符合该条件的规则")
              throw commonEx
            }
            for (let i = 0; i < ret.data.length; i++) {
              ret.data[i].display_name = ret.data[i].name + " (#" + ret.data[i].id + ")"
              ret.data[i].display_traffic = formatInfoTraffic(ret.data[i], true)
            }
            setSearchedSelectedRowKeys([])
            setSearchedRules(ret.data)
            setSearched(true)
          } else {
            MyMessage.error(`搜索出错: ${ret.code} ${ret.msg}`)
            throw commonEx
          }
        })
      }
    })
  }

  // 表格

  const columns: ColumnsType<any> = [
    {
      title: 'UID', key: 'id', dataIndex: 'id', sorter: true,
      filterDropdown: tableSearchDropdown("搜索 UID"),
    },
    {
      title: '用户名', key: 'username', dataIndex: 'username', sorter: true,
      filterDropdown: tableSearchDropdown("搜索用户名"),
    },
    { title: '过期时间', key: 'expire', dataIndex: 'expire', render: (e) => formatUnix(e, { color: true }), sorter: true },
    { title: '流量', key: 'traffic_used', dataIndex: 'display_traffic', sorter: true },
    {
      title: '套餐', key: 'plan_id', dataIndex: 'plan_id',
      render: (e) => ignoreError(() => `${findObjByIdId(plans, e).name} (#${e})`, e),
      filterDropdown: tableSearchDropdown("搜索套餐 ID"),
    },
    {
      title: '用户组', key: 'group_id', dataIndex: 'group_id',
      filterDropdown: tableSearchDropdown("搜索用户组 ID"),
    },
    { title: '最大规则数', key: 'max_rules', dataIndex: 'max_rules', sorter: true },
    { title: '钱包余额', key: 'balance', dataIndex: 'balance', render: (e: any) => e + " " + displayCurrency, sorter: true },
    { title: 'Telegram', key: 'telegram_id', dataIndex: 'telegram_id', },
    { title: '管理员', key: 'admin', dataIndex: 'admin', render: formatBoolean, filters: filtersBoolean },
    { title: '封禁', key: 'banned', dataIndex: 'banned', render: formatBoolean, filters: filtersBoolean },
    {
      title: '操作', key: 'action', dataIndex: 'id', render: function (e: number) {
        return <Flex gap={8}>
          <Tooltip title="管理规则"><Button icon={<PaperClipOutlined />} onClick={() => {
            window.open(`?affect=${e}#/forward_rules`, '_blank');
          }} /></Tooltip>
          <Tooltip title="重置密码"><Button icon={<LogoutOutlined />} onClick={() => resetUserPassword(e)} /></Tooltip>
          <Tooltip title="编辑"><Button icon={<EditOutlined />} onClick={() => editUser(findObjByIdId(data, e))} /></Tooltip>
          <Tooltip title="编辑用户套餐"><Button icon={<ShoppingOutlined />} onClick={() => changePlan(findObjByIdId(data, e))} /></Tooltip>
          <Tooltip title="邀请注册"><Button icon={<RedEnvelopeOutlined />} onClick={() => editInviteConfig(findObjByIdId(data, e))} /></Tooltip>
        </Flex>
      }
    },
    { title: '备注', key: 'note', dataIndex: 'note', },
  ];

  function editUser(obj: any) {
    obj = clone(obj)
    editingObj.current = obj
    MyModal.confirm({
      icon: <p />,
      title: "编辑用户 " + obj.username + " (UID=" + obj.id + ")",
      content: <Flex vertical>
        <Flex className='neko-settings-flex-line'>
          <Tooltip title="禁止此用户登录或使用规则，请勿与“管理员”选项一同设置。">
            <Typography.Text style={{ flex: 1 }} strong>封禁</Typography.Text>
          </Tooltip>
          <Switch
            defaultChecked={editingObj.current.banned}
            onChange={(e) => editingObj.current.banned = e} />
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text style={{ flex: 1 }} strong>管理员</Typography.Text>
          <Switch
            defaultChecked={editingObj.current.admin}
            onChange={(e) => editingObj.current.admin = e} />
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Tooltip title="组 ID 必须 >= 0, 分组为 0 的用户无法使用转发。">
            <Typography.Text strong>组ID (?)</Typography.Text>
          </Tooltip>
          <div className='dq-3'>
            <InputNumber
              min="0"
              step="1"
              defaultValue={editingObj.current.group_id > 0 ? editingObj.current.group_id : 0}
              onChange={(e) => editingObj.current.group_id = e}
            ></InputNumber>
          </div>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>已用流量</Typography.Text>
          <div className='dq-3'>
            <InputNumber
              addonAfter="GiB"
              min="0"
              step="0.01"
              defaultValue={byteConverter(editingObj.current.traffic_used, "GB").toFixed(2)}
              onChange={(e) => {
                editingObj.current.traffic_used = Math.round(byteConverter(Number(e), "GB", true));
                editingObj.current.update_traffic = true;
              }}
            ></InputNumber>
          </div>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>可用流量</Typography.Text>
          <div className='dq-3'>
            <InputNumber
              addonAfter="GiB"
              min="0"
              step="0.01"
              defaultValue={byteConverter(editingObj.current.traffic_enable, "GB").toFixed(2)}
              onChange={(e) => editingObj.current.traffic_enable = Math.round(byteConverter(Number(e), "GB", true))}
            ></InputNumber>
          </div>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>过期时间</Typography.Text>
          <div className='dq-3'>
            <DatePicker
              format="YYYY-MM-DD HH:mm:ss"
              defaultValue={unix(editingObj.current.expire)}
              showTime={{ defaultValue: dayjs('00:00:00', 'HH:mm:ss') }}
              onChange={(e) => editingObj.current.expire = e?.unix()}
            />
          </div>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>最大规则数</Typography.Text>
          <div className='dq-3'>
            <InputNumber
              precision={0}
              defaultValue={obj.max_rules}
              onChange={(e) => editingObj.current.max_rules = e}
            ></InputNumber>
          </div>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Tooltip title="0 表示不限速">
            <Typography.Text strong>用户限速 (?)</Typography.Text>
          </Tooltip>
          <div className='dq-3'>
            <InputNumber
              addonAfter="Mbps"
              min="0"
              step="1"
              defaultValue={byteConverter(editingObj.current.speed_limit, "M_Net").toFixed(0)}
              onChange={(e) => editingObj.current.speed_limit = Math.round(byteConverter(Number(e), "M_Net", true))}
            ></InputNumber>
          </div>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Tooltip title="0 表示不限 IP">
            <Typography.Text strong>用户 IP 限制 (?)</Typography.Text>
          </Tooltip>
          <div className='dq-3'>
            <InputNumber
              min="0"
              max='65535'
              step="1"
              defaultValue={editingObj.current.ip_limit}
              onChange={(e) => editingObj.current.ip_limit = e}
            ></InputNumber>
          </div>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>钱包余额</Typography.Text>
          <div className='dq-3'>
            <InputNumber
              min={0}
              step={0.01}
              addonAfter={displayCurrency}
              defaultValue={obj.balance}
              onChange={(e) => {
                editingObj.current.balance = e
                editingObj.current.update_balance = true
              }} />
          </div>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>备注 (仅管理员可见)</Typography.Text>
          <Input.TextArea
            defaultValue={obj.note}
            onChange={(e) => editingObj.current.note = e.target.value.trim()}
          ></Input.TextArea>
        </Flex>
      </Flex>,
      onOk: () => {
        if (!allFalseMap(editingError.current)) return newPromiseRejectNow(null)
        return promiseFetchJson(api.admin.user_update(obj.id, editingObj.current), (ret) => {
          showCommonError(ret, ["", "用户更新失败"], () => {
            updateData()
            // 如果更新的是当前用户
            myvar.userInfo.then((i: any) => { if (i.id == obj.id) reloadMyVar({ userInfo: true }) })
          })
        })
      }
    })
  }

  function editInviteConfig(obj: any) {
    obj = clone(obj)
    editingObj.current = obj
    editingObj.current.qd_follow_site_invite_config = !isNotBlank(obj.invite_config)
    setTimeout(() => {
      on_qd_follow_site_invite_config_Change(editingObj.current.qd_follow_site_invite_config)
    }, 300);
    let cfg = new FrontInviteConfig()
    try {
      cfg = JSON.parse(obj.invite_config);
    } catch (e: any) { }
    const yaoQingRen = obj.inviter > 0 ? <p>此用户的邀请人 ID: {obj.inviter}</p> : <></>
    MyModal.confirm({
      icon: <p />,
      title: "编辑邀请注册设置 " + obj.username + " (UID=" + obj.id + ")",
      content: <Flex vertical>
        {yaoQingRen}
        <Flex className='neko-settings-flex-line'>
          <Tooltip title="关闭此选项后，可为此用户单独调整邀请返利倍率等设置。">
            <Typography.Text style={{ flex: 1 }} strong>跟随全站设置 (?)</Typography.Text>
          </Tooltip>
          <Switch
            defaultChecked={editingObj.current.qd_follow_site_invite_config}
            onChange={(e) => on_qd_follow_site_invite_config_Change(e)} />
        </Flex>
        <div className='vis-custom' style={{ display: "none" }}>
          <InviteSettings data={cfg}></InviteSettings>
        </div>
      </Flex>,
      onOk: () => {
        if (editingObj.current.qd_follow_site_invite_config) {
          editingObj.current.invite_config = ""
        } else {
          editingObj.current.invite_config = JSON.stringify(editingInviteSettings)
        }
        return promiseFetchJson(api.admin.user_update(obj.id, editingObj.current), (ret) => {
          showCommonError(ret, ["", "用户更新失败"], updateData)
        })
      }
    })
  }

  const on_qd_follow_site_invite_config_Change = (e: boolean) => {
    editingObj.current.qd_follow_site_invite_config = e
    // 更新可视
    document.querySelectorAll(".vis-custom").forEach((el) => (el as HTMLElement).style.display = e ? "none" : "")
  }


  function changePlan(obj: any) {
    // TODO 改用 shop_plan_push 这个接口？
    obj = clone(obj)
    editingObj.current = obj
    MyModal.confirm({
      icon: <p />,
      title: "编辑用户套餐 " + obj.username + " (UID=" + obj.id + ")",
      content: <Flex vertical>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>套餐</Typography.Text>
          <Select
            defaultValue={editingObj.current.plan_id}
            options={renderSelectIdName(plans)}
            onChange={(e) => editingObj.current.plan_id = e}
          ></Select>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Checkbox
            onChange={(e) => editingObj.current.qd_update_traffic = e.target.checked}>
            更新流量</Checkbox>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Checkbox
            onChange={(e) => editingObj.current.qd_update_group = e.target.checked}>
            更新用户组</Checkbox>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Checkbox
            onChange={(e) => editingObj.current.qd_update_max_rules = e.target.checked}>
            更新最大规则数</Checkbox>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Checkbox
            onChange={(e) => editingObj.current.qd_update_limits = e.target.checked}>
            更新限速与 IP 限制</Checkbox>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Checkbox
            onChange={(e) => editingObj.current.qd_update_expire = e.target.checked}>
            更新到期时间</Checkbox>
        </Flex>
      </Flex>,
      onOk: () => {
        if (!allFalseMap(editingError.current)) return newPromiseRejectNow(null)
        const plan = findObjByIdId(plans, editingObj.current.plan_id)
        if (plan == null) return newPromiseRejectNow(null)
        if (editingObj.current.qd_update_traffic) {
          editingObj.current.traffic_used = 0
          editingObj.current.traffic_enable = plan.traffic
          editingObj.current.update_traffic = true;
        }
        if (editingObj.current.qd_update_group) {
          editingObj.current.group_id = plan.group_id
        }
        if (editingObj.current.qd_update_max_rules) {
          editingObj.current.max_rules = plan.max_rules
        }
        if (editingObj.current.qd_update_limits) {
          editingObj.current.speed_limit = plan.speed_limit
          editingObj.current.ip_limit = plan.ip_limit
        }
        if (editingObj.current.qd_update_expire) {
          if (plan.type == PlanType.Month) {
            editingObj.current.expire = dayjs().add(1, "month").unix()
          } else {
            editingObj.current.expire = 253392451749 // 9999-9-9
          }
        }
        return promiseFetchJson(api.admin.user_update(obj.id, editingObj.current), (ret) => {
          showCommonError(ret, ["", "用户更新失败"], updateData)
        })
      }
    })
  }

  function resetUserPassword(e: number) {
    MyModal.confirm({
      icon: <p />,
      title: "重置密码",
      content: <p>你确定要重置用户 {findObjByIdId(data, e).username} (UID={e}) 的密码吗？</p>,
      onOk: () => {
        return promiseFetchJson(api.user.resetpassword({}, e), (ret) => {
          showCommonError(ret, ["重置成功", "重置失败"])
        })
      }
    })
  }

  function btn_delete_unused_onclick() {
    MyModal.confirm({
      icon: <p />,
      title: "清理无效用户",
      content: "用户组与余额均为 0 的用户，即从未付费的用户，将被删除，且不可恢复。",
      onOk: () => {
        return promiseFetchJson(api.admin.user_delete_unused(), (ret) => {
          showCommonError(ret, ["清理成功", "清理失败"], updateData)
        })
      }
    })
  }

  function deleteRules(e: string[] | number[] | React.Key[]) {
    if (e.length == 0) return
    const apiFw = new apiForward("0");
    let content = <p>你确定要删除 {e.length} 条规则吗？</p>
    MyModal.confirm({
      icon: <p />,
      title: "删除规则",
      content: content,
      onOk: () => {
        return promiseFetchJson(apiFw.forward_delete(e), (ret) => {
          showCommonError(ret, ["", "删除规则失败"], updateData)
        })
      }
    })
  }

  // table

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

  return (
    <>
      <Card title="用户管理" style={{ display: searched ? "none" : "" }}>
        <Flex vertical>
          <Flex>
            <Button icon={<UserAddOutlined />} onClick={btn_create_onclick}>添加用户</Button>
            <Button icon={<SearchOutlined />} onClick={btn_search_rules_onclick}>搜索规则</Button>
            <Button icon={<DeleteOutlined />} onClick={btn_delete_unused_onclick}>清理无效用户</Button>
          </Flex>
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={data}
            pagination={tableParams.pagination}
            onChange={handleTableChange}
          />
        </Flex>
      </Card>
      <Card title={`找到 ${searchedRules.length} 条规则`} style={{ display: searched ? "" : "none" }}>
        <Flex vertical>
          <Flex>
            <Button icon={<BackwardOutlined />} onClick={() => setSearched(false)}>返回所有用户</Button>
            <Button icon={<DeleteOutlined />} onClick={() => deleteRules(searchedSelectedRowKeys)}>删除选中</Button>
          </Flex>
          <Table
            rowKey="id"
            columns={[
              { title: '用户', key: 'user', dataIndex: 'display_username' },
              { title: '规则名', key: 'name', dataIndex: 'display_name' },
              { title: '入口', key: 'listen_port', dataIndex: 'display_in' },
              { title: '监听端口', key: 'listen_port', dataIndex: 'listen_port' },
              { title: '出口', key: 'listen_port', dataIndex: 'display_out' },
              { title: '落地地址', key: 'lddz', dataIndex: 'config', render: (config: string) => displayDests(config) },
              { title: '已用流量', key: 'traffic_used', dataIndex: 'display_traffic' },
              {
                title: '状态', key: 'status', dataIndex: 'id', render: (e: any) => {
                  const obj = findObjByIdId(searchedRules, e);
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
                    <Button onClick={() => {
                      const fw = findObjByIdId(searchedRules, e)
                      window.open(`?affect=${fw.uid}&goto=${fw.id}#/forward_rules`, '_blank');
                    }} >定位</Button>
                  </Flex>
                }
              },
            ]}
            pagination={false}
            dataSource={searchedRules}
            rowSelection={{ selectedRowKeys: searchedSelectedRowKeys, onChange: (ks) => setSearchedSelectedRowKeys(ks) }}
          />
        </Flex>
      </Card>
    </>
  )
}
