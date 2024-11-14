import { Card, Collapse, Flex, Space, Typography } from 'antd';
import { formatUnix } from '../util/format';
import { ignoreError } from '../util/promise';
import MySyntaxHighlighter from '../widget/MySyntaxHighlither';
import { useEffect, useState } from 'react';
import { api } from '../api/api';
import { asyncFetchJson } from '../util/fetch';

export function MainView(props: { siteInfo: any, backendInfo: any, userInfo: any }) {
    const [notice, setNotice] = useState('');

    useEffect(() => {
        if (props.userInfo != null) {
            asyncFetchJson(api.guest.kv("site_notice", "user"), (ret) => {
                setNotice(ret.data)
            })
        }
    }, [JSON.stringify(props.userInfo)])

    function renderExpireTime() {
        if (props.userInfo != null && props.userInfo.admin) {
            return <Typography.Title level={4}>面板授权到期时间: {ignoreError(() => formatUnix(props.backendInfo.license_expire))}</Typography.Title>
        }
        return null
    }
    return (
        <Flex vertical>
            <Typography.Paragraph>
                <Typography.Title level={4}>欢迎使用</Typography.Title>
                <Typography.Title level={4}>nyanpass 面板版本: {ignoreError(() => props.backendInfo.version)}</Typography.Title>
                <a href='https://nyanpass.pages.dev'>官方文档（请挂代理访问），花点时间看看，你想问的问题 90% 答案都在里面。</a>
                {renderExpireTime()}
            </Typography.Paragraph>
            <Card title="站点公告">
                <MySyntaxHighlighter>{notice}</MySyntaxHighlighter>
            </Card>
            <Collapse items={[
                {
                    key: '1',
                    label: '站点信息',
                    children: <MySyntaxHighlighter language='json'>{JSON.stringify(props.siteInfo, null, 2)}</MySyntaxHighlighter>
                }, {
                    key: '2',
                    label: '后端信息',
                    children: <MySyntaxHighlighter language='json'>{JSON.stringify(props.backendInfo, null, 2)}</MySyntaxHighlighter>
                }
            ]} style={{ width: "100%" }} />
        </Flex>
    )
}
