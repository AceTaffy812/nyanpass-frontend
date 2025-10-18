import React from 'react';
import { Table, Typography, Card, Space, Tag } from 'antd';
import { MyModal } from '../util/MyModal';

const { Text, Title } = Typography;

interface DiagnoseAgentResult {
    name: string;
    result: string;
}

interface DiagnoseGroupResult {
    gid: number;
    gn: string;
    result: DiagnoseAgentResult[];
}

interface DiagnoseResult {
    task_count: number;
    inbound: DiagnoseGroupResult;
    outbounds: DiagnoseGroupResult[];
    backend: string[];
}

/**
 * 诊断分组结果组件
 */
const DiagnoseGroupResultView: React.FC<{ group: DiagnoseGroupResult }> = ({ group }) => {
    const dataSource = (group.result ?? []).map((item, index) => ({
        key: index,
        ...item,
    }));

    const columns = [
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => (
                // 名称超长时尾部省略
                <Text ellipsis={true} style={{ display: 'block' }}>
                    {text || '-'}
                </Text>
            ),
        },
        {
            title: '诊断结果详情',
            dataIndex: 'result',
            key: 'result',
            render: (text: string) => (
                <div style={{
                    // 修复：从 'pre-wrap' 改为 'pre'
                    whiteSpace: 'pre',
                    // wordBreak: 'keep-all', // 'pre' 已经禁用了换行，此属性不再需要
                    overflowX: 'auto',
                    margin: 0,
                    fontFamily: 'monospace',
                    paddingRight: '8px'
                }}>
                    {text}
                </div>
            ),
            // --- 修复结束 ---
        },
    ];

    return (
        <Card
            title={<Text strong>{group.gn}</Text>}
            size="small"
            style={{ marginBottom: 8 }}
            bodyStyle={{ padding: 8 }}
            extra={<Tag color="blue">GID: {group.gid}</Tag>}
        >
            {dataSource.length == 0 ? <Text type="secondary">无数据</Text> : <Table
                dataSource={dataSource}
                columns={columns}
                pagination={false}
                size="small"
                bordered
            />}
        </Card>
    );
};

/**
 * 诊断结果的主要内容组件
 */
const DiagnoseResultContent: React.FC<{ data: DiagnoseResult }> = ({ data }) => {
    if (data == null) return ''
    return (
        <Space direction="vertical" style={{ width: '100%' }} size={8}>

            {/* 1. Inbound 结果 */}
            <Title level={5} style={{ margin: '8px 0 0' }}>入口诊断 (Inbound)</Title>
            <DiagnoseGroupResultView group={data.inbound} />

            {/* 2. Outbounds 结果 */}
            <Title level={5} style={{ margin: '0 0 0' }}>出口诊断 (Outbounds)</Title>
            {data.outbounds && data.outbounds.length > 0 ? (
                data.outbounds.map((group, index) => (
                    <DiagnoseGroupResultView key={index} group={group} />
                ))
            ) : (
                <Text type="secondary">没有出口诊断结果。</Text>
            )}

            {/* 3. Backend 原始信息 (超长时横向滚动) */}
            <Title level={5} style={{ margin: '8px 0 0' }}>面板反馈 (Backend)</Title>
            <Card size="small" bodyStyle={{ padding: 8 }}>
                <div style={{ overflowX: 'auto' }}>
                    <pre style={{
                        margin: 0,
                        whiteSpace: 'pre', // 强制不换行，保留 \n 换行
                        lineHeight: '1.5',
                        fontFamily: 'monospace',
                    }}>
                        {data.backend.join('\n')}
                    </pre>
                </div>
            </Card>
        </Space>
    );
};

export const showDiagnoseResult = (title: string, data: DiagnoseResult) => {
    MyModal.info({
        title: title,
        width: 800,
        maskClosable: true,
        icon: null,
        content: <DiagnoseResultContent data={data} />,
        okText: '关闭',
        onOk() {
            // Modal 关闭时的回调
        },
    });
};
