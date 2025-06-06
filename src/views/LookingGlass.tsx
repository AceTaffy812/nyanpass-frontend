import { Button, Card, Flex, Input, InputRef, Table, Typography } from 'antd';
import { createRef, useEffect, useRef, useState } from 'react';
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

    const updateData = () => {
        setLoading(true);
        asyncFetchJson(api.common.node_status(), ret => {
            if (ret.data != null) {
                const treeData: any[] = ret.data.map((grp: any) => {
                    grp.display_name = `${grp.name} (#${grp.gid})`;
                    grp.display_num = grp.servers?.length ?? 0;
                    grp.children = grp.servers?.map((srv: any) => ({
                        ...srv,
                        display_name: `${grp.name} ${srv.name}`,
                        gid: grp.gid,
                    })) ?? [];
                    return grp;
                });
                setData(treeData);
            }
        }, undefined, () => setLoading(false))
    };

    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            updateData();
        }
    }, []);

    const pingServer = (srv: any) => {
        if (srv == null || !isNotBlank(srv.handle)) return;
        const inputRef = createRef<InputRef>();
        MyModal.confirm({
            icon: null,
            title: `服务器: ${srv.display_name}`,
            content: <div>
                <h4>请输入要 Ping 的目标主机 IP 或域名</h4>
                <Input ref={inputRef} />
            </div>,
            onOk: () => {
                return new Promise<void>((resolve, reject) => {
                    const target = inputRef.current?.input?.value.trim() || '';
                    if (!isNotBlank(target)) {
                        return reject();
                    }
                    asyncFetchJson(
                        api.user.devicegroup_looking_glass(srv.handle, 'ping', target),
                        ret => {
                            resolve();
                            MyModal.info({
                                width: 800,
                                title: `${srv.display_name} Ping 结果`,
                                content: <MySyntaxHighlighter>{ret.msg}</MySyntaxHighlighter>
                            });
                        }
                    );
                });
            }
        });
    };

    const columns: ColumnsType<any> = [
        { title: '名称', key: 'id', dataIndex: 'display_name', },
        {
            title: '类型',
            key: 'type',
            render: (_: any, record: any) =>
                record.children ? translateBackendString(record.gType) : null,
        },
        {
            title: '在线设备',
            key: 'online',
            render: (_: any, record: any) =>
                record.children ? record.display_num : <Flex gap={8}>
                    <Button onClick={() => pingServer(record)}>ping</Button>
                </Flex>,
        },
    ];

    return (
        <Card title="LookingGlass">
            <Table
                rowKey={record => record.children ? `group-${record.gid}` : `srv-${record.handle}`}
                loading={loading}
                columns={columns}
                dataSource={data}
                pagination={false}
            />
        </Card>
    );
}
