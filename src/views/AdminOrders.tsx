import { Button, Card, Flex, Input, InputNumber, Table, Tooltip, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { asyncFetchJson, promiseFetchJson } from '../util/fetch';
import { api } from '../api/api';
import { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { OrderStatus, OrderType, translateBackendString } from '../api/model_front';
import { TableParams, tableParams2Qs } from '../api/model_api';
import { DeleteOutlined, FileAddOutlined, PropertySafetyOutlined } from '@ant-design/icons';
import { displayCurrency, renderFilterBackendString, tableSearchDropdown, tableShowTotal } from '../util/ui';
import { formatUnix } from '../util/format';
import { MyMessage, MyModal, MyModalCannotDismiss } from '../util/MyModal';
import { showCommonError } from '../util/commonError';
import { findObjByIdId } from '../util/misc';
import { FilterValue, SorterResult } from 'antd/es/table/interface';
import { newPromiseRejectNow } from '../util/promise';

export function AdminOrdersView() {
  const editingObj = useRef<any>(null)
  const [data, setData] = useState<any[]>([]);
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
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const updateData = () => {
    setLoading(true);
    asyncFetchJson(api.admin.shop_order_list(tableParams2Qs(tableParams)), (ret) => {
      setLoading(false);
      if (ret.data != null) {
        for (let i = 0; i < ret.data.length; i++) {
          ret.data[i].display_username = ret.data[i].username + " (#" + ret.data[i].uid + ")"
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
  }
  useEffect(updateData, [tableParams2Qs(tableParams)]);

  // 表格

  const columns: ColumnsType<any> = [
    { title: '订单号', key: 'order_no', dataIndex: 'order_no' },
    {
      title: '用户', key: 'uid', dataIndex: 'display_username',
      filterDropdown: tableSearchDropdown("搜索 UID")
    },
    { title: '创建时间', key: 'open_time', dataIndex: 'open_time', render: (e: number) => formatUnix(e, { no1970: true }) },
    { title: '支付时间', key: 'paid_time', dataIndex: 'paid_time', render: (e: number) => formatUnix(e, { no1970: true }) },
    { title: '订单信息', key: 'message', dataIndex: 'message' },
    { title: '金额', key: 'amount', dataIndex: 'amount', render: (e: any) => e + " " + displayCurrency },
    {
      title: '类型', key: 'type', dataIndex: 'type', render: (e: any) => translateBackendString(e),
      filters: renderFilterBackendString(OrderType),
    },
    {
      title: '状态', key: 'status', dataIndex: 'status', render: (e: any) => translateBackendString(e),
      filters: renderFilterBackendString(OrderStatus),
    },
    {
      title: '操作', key: 'action', dataIndex: 'id', render: function (e: number) {
        return <Flex gap={8}>
          {renderBudan(e)}
          <Tooltip title="删除"><Button icon={<DeleteOutlined />} onClick={() => deleteOrders([e])} /></Tooltip>
        </Flex>
      }
    },
  ];

  // 1st refresh
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
    }
  })

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  // 按钮

  function deleteOrders(e: string[] | number[] | React.Key[]) {
    if (e.length == 0) return
    MyModal.confirm({
      icon: <p />,
      title: "删除订单",
      content: <p>你确定要删除 {e.length} 条订单吗？</p>,
      onOk: () => {
        return promiseFetchJson(api.admin.shop_order_delete(e), (ret) => {
          showCommonError(ret, ["", "删除失败"], updateData)
        })
      }
    })
  }

  function accounting() {
    editingObj.current = {} // 可以开新的 editingObj
    MyModal.confirm({
      icon: <p />,
      title: "手动记账",
      content: <Flex vertical>
        <p>手动记账，金额计入用户余额，负数金额代表扣除。</p>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>用户 ID</Typography.Text>
          <div className='dq-3'>
            <InputNumber
              min={0}
              step={0}
              onChange={(e) => editingObj.current.uid = e} />
          </div>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>订单信息</Typography.Text>
          <Input
            onChange={(e) => editingObj.current.message = e.target.value}
          ></Input>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>金额</Typography.Text>
          <div className='dq-3'>
            <InputNumber
              step={0.01}
              addonAfter={displayCurrency}
              onChange={(e) => editingObj.current.amount = e} />
          </div>
        </Flex>
      </Flex>,
      onOk: () => {
        if (!editingObj.current.uid) return newPromiseRejectNow(null)
        if (!editingObj.current.amount) return newPromiseRejectNow(null)
        asyncFetchJson(api.admin.user_list("id=" + editingObj.current.uid), (ret) => {

          try {
            if (ret.data.length != 1) {
              MyMessage.error("该用户不存在");
              return
            }
            const user = ret.data[0];
            MyModalCannotDismiss.confirm({
              icon: <p />,
              title: `为用户 ${user.username} (#${user.id}) 记账 ${editingObj.current.amount} ${displayCurrency}`,
              content: <div>
                <p>操作前余额: {user.balance} {displayCurrency}</p>
                <p>操作后余额: {Number(user.balance) + Number(editingObj.current.amount)} {displayCurrency}</p>
                <p>若操作后余额为负数，则操作无法完成。</p>
              </div>,
              onOk: () => {
                asyncFetchJson(api.admin.shop_order_accounting(editingObj.current), (ret) => {
                  showCommonError(ret, ["", "更新失败"], updateData)
                })
              }
            })
          } catch (error: any) {
            MyMessage.error("查询用户失败")
            console.log(error)
          }

        })
      }
    })
  }

  function renderBudan(e: number) {
    const obj = findObjByIdId(data, e)
    if (obj.type == OrderType.DepositToBalance && obj.status == OrderStatus.Open) {
      return <Tooltip title="补单，设置为已支付"><Button icon={<PropertySafetyOutlined />} onClick={() => setAsPaid(e)} /></Tooltip>
    }
    return <></>
  }

  function setAsPaid(e: number) {
    const obj = findObjByIdId(data, e)
    MyModal.confirm({
      icon: <p />,
      title: "设置此订单为已支付，并执行后续事务？",
      content: <div>
        <p>用户: {obj.display_username}</p>
        <p>订单号: {obj.order_no}</p>
        <p>金额: {obj.amount}</p>
      </div>,
      onOk: () => {
        return promiseFetchJson(api.admin.shop_order_manual_callback(e), (ret) => {
          showCommonError(ret, ["补单成功", "补单失败"], updateData)
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
    <Card title="订单管理">
      <Flex vertical>
        <Flex>
          <Button icon={<FileAddOutlined />} onClick={accounting}>手动记账</Button>
          <Button icon={<DeleteOutlined />} onClick={() => deleteOrders(selectedRowKeys)}>删除选中</Button>
        </Flex>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={tableParams.pagination}
          onChange={handleTableChange}
          rowSelection={{ selectedRowKeys, onChange: onSelectChange }}
        />
      </Flex>
    </Card>
  )
}
