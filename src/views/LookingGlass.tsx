import { Button, Card, Flex, Input, Table, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { asyncFetchJson } from '../util/fetch';
import { api } from '../api/api';
import { ColumnsType } from 'antd/es/table';
import { isNotBlank } from '../util/misc';
import { translateBackendString } from '../api/model_front';
import { MyModal } from '../util/MyModal';
import MySyntaxHighlighter from '../widget/MySyntaxHighlither';

export function LookingGlassView() {
    const mounted = useRef(false);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [target, setTarget] = useState('');

    const updateData = () => {
        setLoading(true);
        asyncFetchJson(api.user.devicegroup_list(), (ret) => {
            setLoading(false);
            if (ret.data != null) {
                const newData: any[] = []
                for (let i = 0; i < ret.data.length; i++) {
                    ret.data[i].display_name = ret.data[i].name + " (#" + ret.data[i].id + ")"
                    newData.push(ret.data[i])
                }
                setData(newData)
            }
        })
    }
    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true
            updateData()
        }
    }, []);

    // 表格

    const columns: ColumnsType<any> = [
        { title: '名称', key: 'id', dataIndex: 'display_name', },
        { title: '类型', key: 'type', dataIndex: 'type', render: (s: string) => { return translateBackendString(s) } },
        { title: '在线设备', key: 'zxsbsl', dataIndex: 'display_num' },
        {
            title: '操作', key: 'action', dataIndex: 'id', render: function (e: number) {
                return <Flex gap={8}>
                    <Button onClick={() => ping(e)}>ping</Button>
                </Flex>
            }
        },
    ];

    function ping(e: number) {
        if (!isNotBlank(target)) return
        asyncFetchJson(api.user.devicegroup_looking_glass(e, "ping", target), (ret) => {
            MyModal.info({
                width: 800,
                title: "ping 结果",
                content: <MySyntaxHighlighter>{ret.msg}</MySyntaxHighlighter>
            })
        })
    }

    return (
        <>
            <Card title={"LookingGlass"}>
                <Flex vertical>
                    <Flex className='neko-flex'>
                        <Typography.Text>目标主机 IP 或域名</Typography.Text>
                        <Input value={target}
                            onChange={(e) => setTarget(e.target.value)} />
                    </Flex>
                    <Table style={{ flex: 2 }}
                        rowKey="id"
                        loading={loading}
                        columns={columns}
                        dataSource={data}
                    />
                </Flex>
            </Card>
        </>
    )
}
