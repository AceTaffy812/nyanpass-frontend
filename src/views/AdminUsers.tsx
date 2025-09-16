import { Button, Card, Checkbox, Collapse, CollapseProps, DatePicker, Flex, Input, InputNumber, Select, Switch, Table, Tooltip, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { asyncFetchJson, promiseFetchJson } from '../util/fetch';
import { api } from '../api/api';
import { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { byteConverter, formatDests, formatBoolean, formatInfoTraffic, formatUnix, strongColor } from '../util/format';
import { allFalseMap, batchIds, cleanupDefaultValue, findObjByIdId, isNotBlank, myFilter } from '../util/misc';
import { BackwardOutlined, CheckSquareOutlined, DeleteOutlined, DisconnectOutlined, EditOutlined, PaperClipOutlined, PauseCircleOutlined, PlayCircleOutlined, RedEnvelopeOutlined, SearchOutlined, ShoppingOutlined, UserAddOutlined, UserOutlined } from '@ant-design/icons';
import { commonEx, showCommonError } from '../util/commonError';
import { ignoreError, newPromiseRejectNow } from '../util/promise';
import { reloadMyVar } from '../myvar';
import { closeCurrentDialog, MyMessage, MyModal } from '../util/MyModal';
import { clone } from 'lodash-es';
import { displayCurrency, filtersBoolean, getPageSize, renderSelectBackendString, renderSelectIdName, setPageSize, tableSearchDropdown, tableShowTotal } from '../util/ui';
import { ReqSearchRules, TableParams, tableParams2Qs } from '../api/model_api';
import dayjs, { unix } from 'dayjs';
import { FilterValue, SorterResult } from 'antd/es/table/interface';
import { DeviceGroupType, FrontForwardConfig, FrontInviteConfig, SelectorType, translateBackendString } from '../api/model_front';
import { InviteSettings, editingInviteSettings } from '../widget/InviteSettings';
import { apiForward } from '../api/forward';
import { MyQuestionMark } from '../widget/MyQuestionMark';

export function AdminUsersView(props: { userInfo: any }) {
  const forward = new apiForward("0") // 影响全局的转发规则接口

  const newUsername = useRef("")
  const searchObj = useRef<ReqSearchRules | null>(null)
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
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      showSizeChanger: true,
      current: 1,
      pageSize: getPageSize("AdminUsers"),
      pageSizeOptions: [10, 20, 50, 100, 200, 500, 1000],
      showTotal: tableShowTotal,
    },
  });

  // 处理后端返回的搜索结果
  function searchedRetProcess(newSearch: boolean) {
    return (ret: any) => {
      if (ret.code == 0) {
        if (ret.data.length == 0) {
          searchObj.current = null;
          MyMessage.info("没有符合该条件的规则")
          if (!newSearch) {
            setSearched(false); updateData(); //退回全部规则
          } else {
            throw commonEx
          }
        }
        for (let i = 0; i < ret.data.length; i++) {
          ret.data[i].display_name = ret.data[i].name + " (#" + ret.data[i].id + ")"
          ret.data[i].display_traffic = formatInfoTraffic(ret.data[i], true)
        }
        setSearchedRules(ret.data) // 与 ForwardRules 不同
        setSearched(true)
        if (newSearch) MyMessage.info(`找到 ${ret.data.length} 条规则`)
      } else {
        searchObj.current = null;
        MyMessage.error(`搜索出错: ${ret.code} ${ret.msg}`)
        if (!newSearch) {
          setSearched(false); updateData(); //退回全部规则
        } else {
          throw commonEx
        }
      }
    }
  }

  const updateData = () => {
    setLoading(true);
    if (searchObj.current != null) {
      asyncFetchJson(forward.search_rules(searchObj.current, ''), (ret) => {
        searchedRetProcess(false)(ret)
      }, undefined, () => setLoading(false))
    } else {
      asyncFetchJson(api.admin.user_list(tableParams2Qs(tableParams)), (ret) => {
        if (ret.data != null) {
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
      }, undefined, () => setLoading(false))
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
        if (ret.data != null) {
          const newData: any[] = []
          for (let i = 0; i < ret.data.length; i++) {
            ret.data[i].name = ret.data[i].name + " (#" + ret.data[i].id + ")" // 这里直接改name
            newData.push(ret.data[i])
          }
          setDeviceGroupList(newData)
        }
      })
      asyncFetchJson(api.admin.usergroup_list(), (ret) => {
        if (ret.data != null) {
          for (let i = 0; i < ret.data.length; i++) {
            ret.data[i].display_name = ret.data[i].name + " (#" + ret.data[i].id + ")"
            if (ret.data[i].id == 0) ret.data[i].display_name = "0"
          }
          setUserGroups(ret.data)
        }
      })
    }
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
    const obj = new ReqSearchRules()
    MyModal.confirm({
      icon: <p />,
      title: "搜索用户规则",
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
        return promiseFetchJson(forward.search_rules(obj, ""), searchedRetProcess(true))
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
    { title: '流量', key: 'traffic_used', dataIndex: 'id', render: (e) => formatInfoTraffic(findObjByIdId(data, e), true), sorter: true },
    {
      title: '套餐', key: 'plan_id', dataIndex: 'plan_id',
      render: (e) => ignoreError(() => findObjByIdId(plans, e).display_name, `#${e}`),
      filterDropdown: tableSearchDropdown("搜索套餐 ID"),
    },
    {
      title: '用户组', key: 'group_id', dataIndex: 'group_id',
      render: (e) => ignoreError(() => findObjByIdId(userGroups, e).display_name, `#${e}`),
      filterDropdown: tableSearchDropdown("搜索用户组 ID"),
    },
    { title: '最大规则数', key: 'max_rules', dataIndex: 'max_rules', sorter: true },
    { title: '钱包余额', key: 'balance', dataIndex: 'balance', render: (e: any) => e + " " + displayCurrency, sorter: true },
    {
      title: 'Telegram', key: 'telegram_id', dataIndex: 'telegram_id',
      render: (e: any) => e > 0 ? e : null, sorter: true,
      filterDropdown: tableSearchDropdown("搜索 Telegram ID"),
    },
    { title: '管理员', key: 'admin', dataIndex: 'admin', render: formatBoolean, filters: filtersBoolean },
    { title: '封禁', key: 'banned', dataIndex: 'banned', render: formatBoolean, filters: filtersBoolean },
    {
      title: '操作', key: 'action', dataIndex: 'id', render: function (e: number) {
        return <Flex gap={8}>
          <Tooltip title="管理规则"><Button icon={<PaperClipOutlined />} onClick={() => {
            window.open(`?affect=${e}#/forward_rules`, '_blank');
          }} /></Tooltip>
          <Tooltip title="重置密码"><Button icon={<DisconnectOutlined />} onClick={() => resetUserPassword(e)} /></Tooltip>
          <Tooltip title="编辑"><Button icon={<EditOutlined />} onClick={() => editUser(findObjByIdId(data, e))} /></Tooltip>
          <Tooltip title="编辑用户套餐"><Button icon={<ShoppingOutlined />} onClick={() => changePlan(findObjByIdId(data, e))} /></Tooltip>
          <Tooltip title="邀请注册"><Button icon={<RedEnvelopeOutlined />} onClick={() => editInviteConfig(findObjByIdId(data, e))} /></Tooltip>
          <Tooltip title="删除"><Button icon={<DeleteOutlined />} onClick={() => deleteUser(e)} /></Tooltip>
        </Flex>
      }
    },
    { title: '备注', key: 'note', dataIndex: 'note', render: (n: any) => n ? String(n).split("\n")[0] : "" },
  ];

  function editUser(obj: any) {
    obj = clone(obj)
    editingObj.current = obj
    MyModal.confirm({
      icon: <p />,
      title: "编辑用户 " + obj.username + " (UID=" + obj.id + ")",
      content: <Flex vertical>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text className="dq-1">
            封禁
            <MyQuestionMark title="禁止此用户登录或使用规则，请勿与“管理员”选项一同设置。" />
          </Typography.Text>

          <Switch
            defaultChecked={editingObj.current.banned}
            onChange={(e) => editingObj.current.banned = e} />
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text className="dq-1">管理员</Typography.Text>
          <Switch
            defaultChecked={editingObj.current.admin}
            onChange={(e) => editingObj.current.admin = e} />
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>
            用户组 ID
            <MyQuestionMark title="组 ID 必须 >= 0, 分组为 0 的用户无法使用转发。" />
          </Typography.Text>
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
          <Typography.Text strong>
            用户限速
            <MyQuestionMark title="0 表示不限速，不同入口的限制可以叠加。" />
          </Typography.Text>
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
          <Typography.Text strong>
            用户 IP 限制
            <MyQuestionMark title="0 表示不限，不同入口的限制可以叠加。" />
          </Typography.Text>
          <div className='dq-3'>
            <InputNumber
              min="0"
              step="1"
              defaultValue={editingObj.current.ip_limit}
              onChange={(e) => editingObj.current.ip_limit = e}
            ></InputNumber>
          </div>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>
            用户连接数限制
            <MyQuestionMark title="0 表示不限，不同入口的限制可以叠加。" />
          </Typography.Text>
          <div className='dq-3'>
            <InputNumber
              min="0"
              step="1"
              defaultValue={editingObj.current.connection_limit}
              onChange={(e) => editingObj.current.connection_limit = e}
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
            if (props.userInfo != null && props.userInfo.id == obj.id) reloadMyVar({ userInfo: true })
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
    MyModal.confirm({
      icon: <p />,
      title: "编辑邀请注册设置 " + obj.username + " (UID=" + obj.id + ")",
      content: <Flex vertical>
        {obj.inviter > 0 ? <p>此用户的邀请人 ID: {obj.inviter}</p> : null}
        <Flex className='neko-settings-flex-line'>
          <Typography.Text className="dq-1">
            跟随全站设置
            <MyQuestionMark title="关闭此选项后，可为此用户单独调整邀请返利倍率等设置。" />
          </Typography.Text>
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
            options={renderSelectIdName(plans, "display_name")}
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
            更新限速与连接限制</Checkbox>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Checkbox
            onChange={(e) => editingObj.current.calc_expire = e.target.checked}>
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
          editingObj.current.connection_limit = plan.connection_limit
        }
        // calc_expire 由后端处理
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
      content: "用户组与余额均为 0 的用户，即从未付费的用户，将被删除，且不可恢复。同时这些用户的规则、单端设备等将被删除。",
      onOk: () => {
        return promiseFetchJson(api.admin.user_delete_unused(), (ret) => {
          showCommonError(ret, ["清理成功", "清理失败"], updateData)
        })
      }
    })
  }

  function btn_delete_unused_rules_onclick() {
    MyModal.confirm({
      icon: <p />,
      title: "清理无效规则",
      content: "清理用户或入口或出口已被删除的规则。",
      onOk: () => {
        return promiseFetchJson(api.admin.user_delete_unused_rules(), (ret) => {
          showCommonError(ret, ["清理成功", "清理失败"], updateData)
        })
      }
    })
  }

  function deleteRules(e: string[] | number[] | React.Key[]) {
    if (e.length == 0) return
    let content = <p>你确定要删除 {e.length} 条规则吗？</p>
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

  function deleteUser(e: number) {
    MyModal.confirm({
      icon: <p />,
      title: "删除用户",
      content: <p>你确定要删除用户 {findObjByIdId(data, e).username} 吗？</p>,
      onOk: () => {
        return promiseFetchJson(api.admin.user_delete([e]), (ret) => {
          showCommonError(ret, ["", "删除用户失败"], updateData)
        })
      }
    })
  }

  function pauseRules(ids: any[], pause: boolean) {
    if (ids.length == 0) return;
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
    const configObj = new FrontForwardConfig;

    ids = batchIds(ids)

    const selectedObjects: any[] = []
    searchedRules.forEach(obj => { // 与 ForwardRules 不同
      if (ids.includes(obj.id)) selectedObjects.push({
        ...obj,
        config: JSON.parse(obj.config)
      });
    })

    let collaspedItems: CollapseProps['items'] = [
      {
        key: '1',
        label: '高级选项 (留空不更新)',
        children: <Flex vertical>
          <Flex className='neko-settings-flex-line'>
            <Typography.Text strong>负载均衡策略</Typography.Text>
            <Select
              defaultValue={undefined}
              options={renderSelectBackendString(SelectorType)}
              onChange={(e) => configObj.dest_policy = e}
            ></Select>
          </Flex>
          <Flex className='neko-settings-flex-line'>
            <Typography.Text strong>
              接受 Proxy Protocol
              <MyQuestionMark title="如果打开，用户在连接时必须发送 Proxy 头，否则连接将失败。" />
            </Typography.Text>
            <Select
              defaultValue={undefined}
              options={[
                { value: 0, label: "关闭" },
                { value: 1, label: "开启 (TCP)" },
              ]}
              onChange={(e) => configObj.accept_proxy_protocol = e}
            ></Select>
          </Flex>
          <Flex className='neko-settings-flex-line'>
            <Typography.Text strong>
              发送 Proxy Protocol
              <MyQuestionMark title="如果打开，转发目标必须支持读取 Proxy 头，否则连接将失败。" />
            </Typography.Text>
            <Select
              defaultValue={undefined}
              options={[
                { value: 0, label: "关闭" },
                { value: 1, label: "v1 (TCP)" },
                { value: 2, label: "v2 (TCP+UDP)" },
                { value: 3, label: "v2 (TCP)" },
              ]}
              onChange={(e) => configObj.proxy_protocol = e}
            ></Select>
          </Flex>
          <Flex className='neko-settings-flex-line'>
            <Typography.Text strong>
              规则限速
              <MyQuestionMark title="0 表示不限速; 单一入口下，所有规则的总速率不会超过用户的限速。" />
            </Typography.Text>
            <div className='dq-3'>
              <InputNumber
                addonAfter="Mbps"
                min="0"
                step="1"
                defaultValue={undefined}
                onChange={(e) => configObj.speed_limit = Math.round(byteConverter(Number(e), "M_Net", true))}
              ></InputNumber>
            </div>
          </Flex>
          <Flex className='neko-settings-flex-line'>
            <Typography.Text strong>
              IP 限制
              <MyQuestionMark title="0 表示不限，单一入口下，同时受用户的限制。" />
            </Typography.Text>
            <div className='dq-3'>
              <InputNumber
                min="0"
                step="1"
                defaultValue={undefined}
                onChange={(e) => configObj.ip_limit = Number(e)}
              ></InputNumber>
            </div>
          </Flex>
          <Flex className='neko-settings-flex-line'>
            <Typography.Text strong>
              连接数限制
              <MyQuestionMark title="0 表示不限，单一入口下，同时受用户的限制。" />
            </Typography.Text>
            <div className='dq-3'>
              <InputNumber
                min="0"
                step="1"
                defaultValue={undefined}
                onChange={(e) => configObj.connection_limit = Number(e)}
              ></InputNumber>
            </div>
          </Flex>
        </Flex>
      },
    ];
    MyModal.confirm({
      icon: <p />,
      title: `批量更新 ${ids.length} 条规则`,
      content: <Flex vertical>
        <h3>注意：在此页面操作规则时，不会检查每个规则所在用户的权限。如果用户无权使用某个入口或出口，切换之后可能导致规则失效，请小心操作。</h3>
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
        <Collapse items={collaspedItems} style={{ width: "100%" }} />
        <Flex className="ant-flex2">
          <Button icon={<PauseCircleOutlined />} onClick={() => { closeCurrentDialog(); pauseRules(ids, true) }}>批量暂停选中规则</Button>
          <Button icon={<PlayCircleOutlined />} onClick={() => { closeCurrentDialog(); pauseRules(ids, false) }}>批量恢复选中规则</Button>
        </Flex>
      </Flex>,
      onOk: () => {
        const req: any[] = []
        if (isNotBlank(obj.qdDgIn)) req.push({ ids: ids, column: "device_group_in", value: obj.qdDgIn })
        if (isNotBlank(obj.qdDgOut)) req.push({ ids: ids, column: "device_group_out", value: obj.qdDgOut })

        let needUpdateConfig = false;
        for (const key in configObj) {
          //@ts-ignore
          if (configObj[key] !== undefined) {
            needUpdateConfig = true;
            break;
          }
        }

        const overwriteCfg = {
          ...(configObj.dest_policy !== undefined ? { dest_policy: configObj.dest_policy } : {}),
          ...(configObj.accept_proxy_protocol !== undefined ? { accept_proxy_protocol: configObj.accept_proxy_protocol } : {}),
          ...(configObj.proxy_protocol !== undefined ? { proxy_protocol: configObj.proxy_protocol } : {}),
          ...(configObj.speed_limit !== undefined ? { speed_limit: configObj.speed_limit } : {}),
          ...(configObj.ip_limit !== undefined ? { ip_limit: configObj.ip_limit } : {}),
          ...(configObj.connection_limit !== undefined ? { connection_limit: configObj.connection_limit } : {})
        }

        if (needUpdateConfig) {
          selectedObjects.forEach(obj => {
            obj.config = {
              ...obj.config,
              ...overwriteCfg
            }
            req.push({ ids: [obj.id], column: 'config', value: JSON.stringify(cleanupDefaultValue(obj.config)) })
          })
        }

        if (req.length > 0) {
          return promiseFetchJson(forward.batch_update(req), (ret) => {
            showCommonError(ret, ["更新成功", "更新失败"], updateData)
          })
        }
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
      setPageSize("AdminUsers", Number(pagination.pageSize));
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
            <Button icon={<DeleteOutlined />} onClick={btn_delete_unused_rules_onclick}>清理无效规则</Button>
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
            <Button icon={<CheckSquareOutlined />} onClick={() => batchUpdateRules(searchedSelectedRowKeys)}>批量切换</Button>
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
              { title: '目标地址', key: 'lddz', dataIndex: 'config', render: (config: string) => formatDests(config) },
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
                    style.color = strongColor()
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
                      window.open(`?affect=${fw.uid}#/forward_rules`, '_blank');
                    }}>用户</Button>
                    <Button onClick={() => {
                      const fw = findObjByIdId(searchedRules, e)
                      window.open(`?affect=${fw.uid}&goto=${fw.id}#/forward_rules`, '_blank');
                    }}>规则</Button>
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
