import { useRef, useEffect, useState } from 'react';
import { api } from '../api/api';
import { asyncFetchJson, promiseFetchJson } from '../util/fetch';
import { byteConverter, formatInfoTraffic, formatUnix } from '../util/format';
import { ignoreError } from '../util/promise';
import { Button, Card, Flex, Form, Input, Space, Switch, Tag, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { MyModal } from '../util/MyModal';
import { showCommonError } from '../util/commonError';
import { displayCurrency } from '../util/ui';
import MySyntaxHighlighter from '../widget/MySyntaxHighlither';
import { reloadMyVar } from '../myvar';

export function UserInfoView(props: { userInfo: any }) {
  const { userInfo } = props;
  const mounted = useRef(false);
  const [notice, setNotice] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [autoRenew, setAutoRenew] = useState(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      asyncFetchJson(api.guest.kv("site_notice", "user"), (ret) => {
        setNotice(ret.data)
      })
    }
  }, [])

  useEffect(() => {
    if (userInfo != null) {
      setAutoRenew(userInfo.auto_renew)
    }
  }, [userInfo])

  function resetPassword(values: any) {
    MyModal.confirm({
      icon: <p />,
      title: "重置密码",
      content: <p>你确定要重置密码吗？</p>,
      onOk: () => {
        setRequesting(true)
        return promiseFetchJson(api.user.resetpassword(values), (ret) => {
          setRequesting(false)
          showCommonError(ret, ["重置成功", "重置失败"])
        })
      }
    })
  }

  function switchAutoRenew(checked: boolean) {
    setAutoRenew(checked)
    setRequesting(true)
    asyncFetchJson(api.user.update_column("auto_renew", checked), (ret) => {
      setRequesting(false)
      showCommonError(ret, true)
      reloadMyVar({ userInfo: true })
    })
  }

  function btn_telegram_bind_onclick() {
    asyncFetchJson(api.user.telegram_bind(), (ret) => {
      showCommonError(ret, ["绑定 Telegram", "绑定 Telegram"])
    })
  }

  function btn_telegram_unbind_onclick() {
    asyncFetchJson(api.user.telegram_bind(true), (ret) => {
      showCommonError(ret, ["取消绑定 Telegram", "取消绑定 Telegram"], () => reloadMyVar({ userInfo: true }))
    })
  }

  function btn_renew_onclick() {
    MyModal.confirm({
      width: 600,
      icon: <p />,
      title: "立即续费",
      content: <div>
        <p>当前套餐: {ignoreError(() => userInfo.plan_name)}</p>
        <p>当前失效时间: {ignoreError(() => formatUnix(userInfo.expire, { color: true }))}</p>
        <p>余额支付: {ignoreError(() => userInfo.renew_price)} {displayCurrency}</p>
        <h3>Tips:</h3>
        <p>续费操作相当于购买当前套餐，若当前套餐被隐藏，仍可续费。</p>
        <p>若当前套餐被删除，则不可续费。</p>
        <p>若套餐限时，则续费后的有效期按当前时间开始算。</p>
        <p>续费操作将重置流量。</p>
      </div>,
      onOk: () => {
        return promiseFetchJson(api.user.renew(), (ret) => {
          showCommonError(ret, ["续费成功", "续费失败"], () => reloadMyVar({ userInfo: true }))
        })
      }
    })
  }

  const speed_limit = ignoreError(() => userInfo.speed_limit) > 0 ? <Flex>
    <Typography.Text strong>速率限制</Typography.Text>
    <Typography.Text>{byteConverter(ignoreError(() => userInfo.speed_limit), "M_Net").toFixed(0)} Mbps</Typography.Text>
  </Flex> : <></>
  const ip_limit = ignoreError(() => userInfo.ip_limit) > 0 ? <Flex>
    <Typography.Text strong>IP 限制</Typography.Text>
    <Typography.Text>{ignoreError(() => userInfo.ip_limit)}</Typography.Text>
  </Flex> : <></>

  return (
    <Flex vertical>
      <Card title="用户信息">
        <Space direction="vertical" size={"middle"}>
          <Flex>
            <Typography.Text strong>用户名</Typography.Text>
            <Typography.Text>{ignoreError(() => userInfo.username)}</Typography.Text>
          </Flex>
          {(() => {
            if (userInfo != null && userInfo.admin) {
              return <Flex>
                <Typography.Text strong>用户类型</Typography.Text>
                <Typography.Text>管理员</Typography.Text>
              </Flex>
            }
          })()}
          <Flex>
            <Typography.Text strong>用户组</Typography.Text>
            <Typography.Text>{ignoreError(() => userInfo.group_id)}</Typography.Text>
          </Flex>
          <Flex>
            <Typography.Text strong>套餐</Typography.Text>
            <Typography.Text>{ignoreError(() => userInfo.plan_name)}</Typography.Text>
          </Flex>
          <Flex>
            <Typography.Text strong>套餐失效</Typography.Text>
            <Typography.Text>{ignoreError(() => formatUnix(userInfo.expire, { color: true }))}</Typography.Text>
          </Flex>
          <Flex className='ant-flex3'>
            <Typography.Text strong>续费价格</Typography.Text>
            <Typography.Text>{ignoreError(() => userInfo.renew_price)} {displayCurrency}</Typography.Text>
            <Button onClick={btn_renew_onclick}>立即续费</Button>
          </Flex>
          <Flex>
            <Typography.Text strong>流量</Typography.Text>
            <Typography.Text>{formatInfoTraffic(userInfo, true)}</Typography.Text>
          </Flex>
          <Flex>
            <Typography.Text strong>最大规则数</Typography.Text>
            <Typography.Text>{ignoreError(() => userInfo.max_rules)}</Typography.Text>
          </Flex>
          {speed_limit}
          {ip_limit}
          <Flex>
            <Typography.Text strong>钱包余额</Typography.Text>
            <Typography.Text>{ignoreError(() => userInfo.balance)} {displayCurrency}</Typography.Text>
          </Flex>
          <Flex className='ant-flex3'>
            <Typography.Text strong>Telegram 关联</Typography.Text>
            <Typography.Text>{ignoreError(() => userInfo.telegram_id)}</Typography.Text>
            <Button onClick={btn_telegram_bind_onclick}>关联 Telegram</Button>
            <Button onClick={btn_telegram_unbind_onclick}>解除关联</Button>
          </Flex>
        </Space>
      </Card>
      <Card title="站点公告">
        <MySyntaxHighlighter>{notice}</MySyntaxHighlighter>
      </Card>
      <Card title="账户设置">
        <Flex vertical className='ant-flex2'>
          <Flex>
            <Typography.Paragraph>
              <Typography.Title level={4}>自动续费</Typography.Title>
              <blockquote>如果您的套餐临近到期，或者流量用完，系统将自动续费。请保证余额充足，否则会续费失败。</blockquote>
            </Typography.Paragraph>
            <Switch style={{ alignSelf: "center" }}
              loading={requesting}
              checked={autoRenew}
              onClick={switchAutoRenew}
              title='开启' />
          </Flex>
          <Flex vertical>
            <Typography.Paragraph>
              <Typography.Title level={4}>重置密码</Typography.Title>
              <blockquote>如果您的密码已泄漏，可以在这里重置。重置操作会强制下线您在其他地方的登录。</blockquote>
            </Typography.Paragraph>
          </Flex>
          <Form
            disabled={requesting}
            onFinish={resetPassword}
          >
            <Flex className='neko-flex'>
              <Form.Item name="current_password" style={{ marginBottom: "unset" }}>
                <Input
                  prefix={<LockOutlined />}
                  placeholder="当前密码"
                />
              </Form.Item>
              <Form.Item name="new_password" style={{ marginBottom: "unset" }}>
                <Input
                  prefix={<LockOutlined />}
                  placeholder="新密码，留空随机生成。"
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: "unset" }}>
                <Button type="primary" htmlType="submit">重置密码</Button>
              </Form.Item>
            </Flex>
          </Form>
        </Flex>
      </Card>
    </Flex>
  )
}
