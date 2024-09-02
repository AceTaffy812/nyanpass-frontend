import { Button, Card, Flex, Input, InputNumber, Select, Table, TablePaginationConfig, Tooltip, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { asyncFetchJson, promiseFetchJson } from '../util/fetch';
import { api } from '../api/api';
import { allFalseMap, findObjByIdId, isNotBlank } from '../util/misc';
import { showCommonError } from '../util/commonError';
import { getPageSize, renderSelectIdName, setPageSize, tableShowTotal } from '../util/ui';
import { DeleteOutlined, FileAddOutlined } from '@ant-design/icons';
import { MyModal } from '../util/MyModal';
import { ignoreError, newPromiseRejectNow } from '../util/promise';
import { formatInfoTraffic } from '../util/format';
import { TableParams, tableParams2Qs } from '../api/model_api';
import { FilterValue, SorterResult } from 'antd/es/table/interface';
import { ColumnsType } from 'antd/lib/table';

export function AdminRedeemCode() {
  const editingObj = useRef<any>(null)
  const editingError = useRef({
    configJSON: false,
  })

  const [data, setData] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      showSizeChanger: true,
      current: 1,
      pageSize: getPageSize("AdminRedeemCode"),
      pageSizeOptions: [10, 20, 50, 100, 200, 500, 1000],
      showTotal: tableShowTotal,
    },
  });

  const updateData = () => {
    setLoading(true);
    asyncFetchJson(api.admin.shop_redeem_list(tableParams2Qs(tableParams)), (ret) => {
      setLoading(false);
      if (ret.data != null) {
        // for (let i = 0; i < ret.data.length; i++) {
        //   ret.data[i].display_name = ret.data[i].name + " (#" + ret.data[i].id + ")"
        //   ret.data[i].display_traffic = formatInfoTraffic(ret.data[i], true)
        // }
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
  }
  useEffect(updateData, [tableParams2Qs(tableParams)]);

  // 表格

  const columns: ColumnsType<any> = [
    { title: '序号', key: 'id', dataIndex: 'id', sorter: true },
    { title: '代码', key: 'code', dataIndex: 'code', sorter: true },
    { title: '套餐', key: 'plan_id', dataIndex: 'plan_id', render: (e) => ignoreError(() => findObjByIdId(plans, e).display_name, `#${e}`), sorter: true },
    { title: '折扣比例', key: 'discount_ratio', dataIndex: 'discount_ratio', sorter: true },
    { title: '剩余次数', key: 'count', dataIndex: 'count', sorter: true },
  ];

  function batchAddRedeemCode() {
    editingObj.current = {}
    MyModal.confirm({
      icon: <p />,
      title: "批量添加兑换码",
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
          <Tooltip title="示例: 9 折填 0.9; 免费兑换填 0">
            <Typography.Text strong>折扣比例 (?)</Typography.Text>
          </Tooltip>
          <div className='dq-3'>
            <InputNumber
              min={0}
              step={0.01}
              max={1}
              onChange={(e) => editingObj.current.discount_ratio = e} />
          </div>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>可用次数</Typography.Text>
          <div className='dq-3'>
            <InputNumber
              min={1}
              step={1}
              onChange={(e) => editingObj.current.count = e} />
          </div>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>兑换代码</Typography.Text>
          <Input.TextArea
            rows={6}
            placeholder={"一行一个，空行会被忽略"}
            onChange={(e) => editingObj.current.codes = e.target.value.split("\n").map(v => v.trim()).filter(isNotBlank)}
          ></Input.TextArea>
        </Flex>
      </Flex>,
      onOk: () => {
        if (!allFalseMap(editingError.current)) return newPromiseRejectNow(null)
        return promiseFetchJson(api.admin.shop_redeem_import(editingObj.current), (ret) => {
          showCommonError(ret, ["", "更新失败"], updateData)
        })
      }
    })
  }

  function batchDelete(e: string[] | number[] | React.Key[]) {
    if (e.length == 0) return
    let content = <p>你确定要删除 {e.length} 条吗？</p>
    MyModal.confirm({
      icon: <p />,
      title: "删除兑换码",
      content: content,
      onOk: () => {
        return promiseFetchJson(api.admin.shop_redeem_delete(e), (ret) => {
          showCommonError(ret, ["", "删除失败"], updateData)
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
      setPageSize("AdminRedeemCode", Number(pagination.pageSize));
      setData([]);
    }
  };

  return (
    <Card title="兑换码管理">
      <Flex vertical>
        <Flex>
          <Button icon={<FileAddOutlined />} onClick={() => batchAddRedeemCode()}>批量添加兑换码</Button>
          <Button icon={<DeleteOutlined />} onClick={() => batchDelete(selectedRowKeys)}>删除选中</Button>
        </Flex>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={tableParams.pagination}
          onChange={handleTableChange}
          rowSelection={{ selectedRowKeys, onChange: (ks) => setSelectedRowKeys(ks) }}
        />
      </Flex>
    </Card>
  )
}
