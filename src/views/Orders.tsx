import { Button, Card, Flex, Input, InputNumber, Select, Table, Tooltip, Typography, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { asyncFetchJson } from '../util/fetch';
import { api } from '../api/api';
import { ColumnsType } from 'antd/es/table';
import { translateBackendString } from '../api/model_front';
import { pagination2Qs } from '../api/model_api';
import { displayCurrency, tableShowTotal } from '../util/ui';
import { formatUnix } from '../util/format';

export function OrdersView() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState<any>({
        showSizeChanger: true,
        current: 1,
        pageSize: 10,
        pageSizeOptions: [10, 20, 50, 100, 200, 500, 1000],
        showTotal: tableShowTotal,
    });

    const updateData = () => {
        setLoading(true);
        asyncFetchJson(api.user.shop_order_list(pagination2Qs(pagination)), (ret) => {
            setLoading(false);
            if (ret.data != null) {
                setData(ret.data)
                setPagination({
                    ...pagination,
                    showTotal: tableShowTotal, // 这种黄色的可能不能... 而是要自己指定
                    total: ret.count,
                })
            }
        })
    }
    useEffect(updateData, [pagination2Qs(pagination)]);

    // 表格

    const columns: ColumnsType<any> = [
        { title: '订单号', key: 'order_no', dataIndex: 'order_no' },
        { title: '创建时间', key: 'open_time', dataIndex: 'open_time', render: (e: number) => formatUnix(e, { no1970: true }) },
        { title: '支付时间', key: 'paid_time', dataIndex: 'paid_time', render: (e: number) => formatUnix(e, { no1970: true }) },
        { title: '订单信息', key: 'message', dataIndex: 'message' },
        { title: '金额', key: 'amount', dataIndex: 'amount', render: (e: any) => e + " " + displayCurrency },
        { title: '类型', key: 'type', dataIndex: 'type', render: (e: any) => translateBackendString(e) },
        { title: '状态', key: 'status', dataIndex: 'status', render: (e: any) => translateBackendString(e) },
    ];


    // 1st refresh
    const mounted = useRef(false);
    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true
        }
    })

    return (
        <Card title="我的订单">
            <Flex vertical>
                <Table
                    rowKey="id"
                    loading={loading}
                    columns={columns}
                    dataSource={data}
                    pagination={pagination}
                    onChange={(pag: any) => setPagination(pag)}
                />
            </Flex>
        </Card>
    )
}
