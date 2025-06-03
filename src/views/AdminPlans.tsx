import { Button, Card, Checkbox, Flex, Input, InputNumber, Select, Switch, Tooltip, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { asyncFetchJson, promiseFetchJson } from '../util/fetch';
import { api } from '../api/api';
import { allFalseMap, findObjByIdId } from '../util/misc';
import { showCommonError } from '../util/commonError';
import { displayCurrency, renderSelectBackendString } from '../util/ui';
import { DeleteOutlined, EditOutlined, FileAddOutlined, UploadOutlined } from '@ant-design/icons';
import { MyModal } from '../util/MyModal';
import { clone } from 'lodash-es';
import { newPromiseRejectNow } from '../util/promise';
import { byteConverter, formatBoolean, formatInfoTraffic } from '../util/format';
import { PlanType, translatePlanType } from '../api/model_front';
import { DragSortTable, ProColumns } from '@ant-design/pro-components';
import { MyQuestionMark } from '../widget/MyQuestionMark';

export function AdminPlansView() {
  const editingObj = useRef<any>(null)
  const editingError = useRef({
    configJSON: false,
  })

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(false);

  const updateData = () => {
    setLoading(true);
    asyncFetchJson(api.admin.shop_plan_list(), (ret) => {
      if (ret.data != null) {
        for (let i = 0; i < ret.data.length; i++) {
          ret.data[i].display_name = ret.data[i].name + " (#" + ret.data[i].id + ")"
          ret.data[i].display_traffic = formatInfoTraffic(ret.data[i], true)
          if (ret.data[i].show_order == null) ret.data[i].show_order = 0
        }
        setData(ret.data)
      }
    }, undefined, () => setLoading(false))
  }
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      updateData()
    }
  }, []);

  // 表格

  const columns: ProColumns[] = [
    { title: '排序', dataIndex: 'show_order', className: 'drag-visible', },
    { title: '名称', key: 'id', dataIndex: 'display_name', },
    { title: '类型', key: 'type', dataIndex: 'id', renderText: e => translatePlanType(findObjByIdId(data, e)) },
    { title: '分配用户组', key: 'group_id', dataIndex: 'group_id' },
    { title: '可用流量', key: 'liuliang', dataIndex: 'display_traffic' },
    { title: '规则数', key: 'max_rules', dataIndex: 'max_rules' },
    { title: '价格', key: 'price', dataIndex: 'price', renderText: (e: any) => e + " " + displayCurrency },
    { title: '隐藏', key: 'hide', dataIndex: 'hide', renderText: formatBoolean },
    {
      title: '操作', key: 'action', dataIndex: 'id', renderText: function (e: number) {
        return <Flex gap={8}>
          <Tooltip title="编辑"><Button icon={<EditOutlined />} onClick={() => editPlan(findObjByIdId(data, e))} /></Tooltip>
          <Tooltip title="推送套餐更新"><Button icon={<UploadOutlined />} onClick={() => pushPlan(findObjByIdId(data, e))} /></Tooltip>
          <Tooltip title="删除"><Button icon={<DeleteOutlined />} onClick={() => deletePlan(e)} /></Tooltip>
        </Flex>
      }
    },
  ];

  function editPlan(obj: any, isNew?: boolean) {
    obj = clone(obj)
    if (isNew) obj = {
      group_id: 1,
      multiple: 1,
    }
    editingObj.current = obj
    MyModal.confirm({
      icon: <p />,
      title: isNew ? "添加套餐" : "编辑套餐 " + obj.display_name,
      content: <Flex vertical>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>名称</Typography.Text>
          <Input
            defaultValue={obj.name}
            onChange={(e) => editingObj.current.name = e.target.value}
          ></Input>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text className='dq-1'>隐藏</Typography.Text>
          <Switch
            defaultChecked={editingObj.current.hide}
            onChange={(e) => editingObj.current.hide = e} />
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>价格</Typography.Text>
          <div className='dq-3'>
            <InputNumber
              min={0}
              step={0.01}
              addonAfter={displayCurrency}
              defaultValue={editingObj.current.price}
              onChange={(e) => editingObj.current.price = e} />
          </div>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>类型</Typography.Text>
          <Select
            defaultValue={obj.type}
            options={renderSelectBackendString(PlanType)}
            onChange={(e) => editingObj.current.type = e}
          ></Select>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>
            时长倍数
            <MyQuestionMark title="仅用于月付或日付类型。最小倍数是 1 倍，必需为整数。" />
          </Typography.Text>
          <div className='dq-3'>
            <InputNumber
              min="1"
              step="1"
              defaultValue={obj.multiple}
              onChange={(e) => editingObj.current.multiple = e}
            ></InputNumber>
          </div>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>
            分配用户组 ID
            <MyQuestionMark title="新购或者套餐变更时，为购买的用户分配的用户组。" />
          </Typography.Text>
          <div className='dq-3'>
            <InputNumber
              min="1"
              step="1"
              defaultValue={obj.group_id}
              onChange={(e) => editingObj.current.group_id = e}
            ></InputNumber>
          </div>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>流量</Typography.Text>
          <div className='dq-3'>
            <InputNumber
              addonAfter="GiB"
              min="0"
              step="0.01"
              defaultValue={byteConverter(editingObj.current.traffic, "GB").toFixed(2)}
              onChange={(e) => editingObj.current.traffic = Math.round(byteConverter(Number(e), "GB", true))}
            ></InputNumber>
          </div>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>最大规则数</Typography.Text>
          <div className='dq-3'>
            <InputNumber
              addonAfter="条"
              min="0"
              step="1"
              defaultValue={editingObj.current.max_rules}
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
          <Typography.Text strong>说明</Typography.Text>
          <Input
            defaultValue={obj.desc}
            onChange={(e) => editingObj.current.desc = e.target.value}
          ></Input>
        </Flex>
      </Flex>,
      onOk: () => {
        if (!allFalseMap(editingError.current)) return newPromiseRejectNow(null)
        return promiseFetchJson(isNew ? api.admin.shop_plan_create(editingObj.current) : api.admin.shop_plan_update(obj.id, editingObj.current), (ret) => {
          showCommonError(ret, ["", "套餐更新失败"], updateData)
        })
      }
    })
  }

  function deletePlan(e: number) {
    MyModal.confirm({
      icon: <p />,
      title: "删除套餐",
      content: <p>你确定要删除套餐 {findObjByIdId(data, e).display_name} 吗？</p>,
      onOk: () => {
        return promiseFetchJson(api.admin.shop_plan_delete([e]), (ret) => {
          showCommonError(ret, ["", "删除套餐失败"], updateData)
        })
      }
    })
  }

  function pushPlan(obj: any) {
    obj = clone(obj)
    editingObj.current = {} // 可以开新的 editingObj
    MyModal.confirm({
      icon: <p />,
      title: "推送套餐更新: " + obj.display_name,
      content: <Flex vertical>
        <p>将套餐的以下属性，推送给持有此套餐的用户？</p>
        <Flex className='neko-settings-flex-line'>
          <Checkbox
            onChange={(e) => editingObj.current.update_traffic = e.target.checked}>
            更新可用流量</Checkbox>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Checkbox
            onChange={(e) => editingObj.current.update_group = e.target.checked}>
            更新用户组</Checkbox>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Checkbox
            onChange={(e) => editingObj.current.update_max_rules = e.target.checked}>
            更新最大规则数</Checkbox>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Checkbox
            onChange={(e) => editingObj.current.update_limits = e.target.checked}>
            更新限速与连接限制</Checkbox>
        </Flex>
      </Flex>,
      onOk: () => {
        return promiseFetchJson(api.admin.shop_plan_push(obj.id, editingObj.current), (ret) => {
          showCommonError(ret, ["更新成功", "更新失败"], updateData)
        })
      }
    })
  }

  const handleDragSortEnd = (
    beforeIndex: number,
    afterIndex: number,
    newData: any,
  ) => {
    setData(newData)
    setLoading(true)
    asyncFetchJson(api.common.reorder("/api/v1/admin/shop/plan/reorder", newData), (ret) => {
      showCommonError(ret, true)
    }, undefined, () => setLoading(false))
  };

  return (
    <Card title="套餐管理">
      <Flex vertical>
        <Flex>
          <Button icon={<FileAddOutlined />} onClick={() => editPlan(null, true)}>添加套餐</Button>
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
        />
      </Flex>
    </Card>
  )
}
