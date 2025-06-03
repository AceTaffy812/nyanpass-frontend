import { useRef, useEffect, useState } from 'react';
import { api } from '../api/api';
import { asyncFetchJson, promiseFetchJson } from '../util/fetch';
import { byteConverter, formatInfoTraffic, formatUnix } from '../util/format';
import { ignoreError, ignoreErrorAndBlank } from '../util/promise';
import { Button, Card, Flex, Form, Input, InputNumber, Popconfirm, Select, SelectProps, Space, Switch, Tag, Typography } from 'antd';
import { DisconnectOutlined, LinkOutlined, LockOutlined, PlusCircleOutlined, SettingOutlined, SyncOutlined } from '@ant-design/icons';
import { MyModal } from '../util/MyModal';
import { showCommonError } from '../util/commonError';
import { displayCurrency } from '../util/ui';
import { myvar, reloadMyVar } from '../myvar';
import { FrontInviteConfig } from '../api/model_front';
import { generateBigCharacter, isNotBlank } from '../util/misc';

const telegramReceiveOptions: SelectProps['options'] = [
  { label: "收款信息", value: "income" },
  { label: "设备离线与恢复", value: "updown" },
];

export function UserInfoView(props: { userInfo: any }) {
  const { userInfo } = props;
  const mounted = useRef(false);
  const [affConfig, setAffConfig] = useState(new FrontInviteConfig());
  const [requesting, setRequesting] = useState(false);
  const [autoRenew, setAutoRenew] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      asyncFetchJson(api.user.aff_config(), (ret) => {
        if (ret.data != null) {
          setAffConfig(ret.data)
        }
      })
      // 打开用户页时立即刷新用户信息
      reloadMyVar({ userInfo: true })
    }
  }, [])

  useEffect(() => {
    if (userInfo != null) {
      setAutoRenew(userInfo.auto_renew)
    }
  }, [userInfo])

  function resetPassword(values: any) {
    window._.unset(values, "confirm")
    setRequesting(true)
    return promiseFetchJson(api.user.resetpassword(values), (ret) => {
      showCommonError(ret, ["重置成功", "重置失败"])
    }, undefined, () => {
      try {
        myvar.window.TODO_PROMISE_RESLOVE()
      } catch (error) { }
      setRequesting(false)
    })
  }

  function switchAutoRenew(checked: boolean) {
    setAutoRenew(checked)
    setRequesting(true)
    return promiseFetchJson(api.user.update_column("auto_renew", checked), (ret) => {
      reloadMyVar({ userInfo: true })
    }, undefined, () => {
      try {
        myvar.window.TODO_PROMISE_RESLOVE()
      } catch (error) { }
      setRequesting(false)
    })
  }

  function btn_telegram_bind_onclick() {
    return promiseFetchJson(api.user.telegram_bind(), (ret) => {
      showCommonError(ret, ["绑定 Telegram", "绑定 Telegram"])
    })
  }

  function btn_telegram_unbind_onclick() {
    return promiseFetchJson(api.user.telegram_bind(true), (ret) => {
      showCommonError(ret, ["取消绑定 Telegram", "取消绑定 Telegram"], () => reloadMyVar({ userInfo: true }))
    })
  }

  function resetInviteCode(create: boolean) {
    MyModal.confirm({
      icon: <p />,
      title: create ? "创建邀请代码" : "重置邀请代码",
      content: create ? null : <p>旧的邀请代码将被无法继续使用。</p>,
      onOk: () => {
        return promiseFetchJson(api.user.update_column("invite_code", generateBigCharacter(10)), (ret) => {
          reloadMyVar({ userInfo: true })
        })
      }
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
        <p>余额支付: {ignoreErrorAndBlank(() => userInfo.renew_price, 0)} {displayCurrency}</p>
        <h3>Tips:</h3>
        <p>续费操作相当于重新购买当前套餐，重置到期时间和流量。</p>
        <p>若当前套餐被隐藏，仍可续费。</p>
        <p>若当前套餐被删除，则不可续费。</p>
        <p>若套餐限时，则续费后的有效期按当前时间开始算。</p>
      </div>,
      onOk: () => {
        return promiseFetchJson(api.user.renew(), (ret) => {
          showCommonError(ret, ["续费成功", "续费失败"], () => reloadMyVar({ userInfo: true }))
        })
      }
    })
  }

  function btn_telegram_notify_onclick() {
    MyModal.confirm({
      icon: <p />,
      title: "Telegram 推送设置",
      content: <Flex vertical>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>接受的推送类型</Typography.Text>
          <Select
            mode="multiple"
            allowClear
            defaultValue={isNotBlank(userInfo.telegram_notify) ? userInfo.telegram_notify.split(",") : []}
            onChange={e => userInfo.telegram_notify = e.join(",")}
            options={telegramReceiveOptions}
          />
        </Flex>
      </Flex>,
      onOk: () => {
        return promiseFetchJson(api.user.update_column("telegram_notify", userInfo.telegram_notify), (ret) => {
          showCommonError(ret, ["设置成功", "设置失败"], () => reloadMyVar({ userInfo: true }))
        })
      }
    })
  }

  const editingAffDepositAmount = useRef(0);
  function btn_aff_deposit_onclick() {
    MyModal.confirm({
      icon: <p />,
      title: "划转余额",
      content: <div>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>划转的金额</Typography.Text>
          <div className='dq-3'>
            <InputNumber
              min={0}
              step={0.01}
              addonAfter={displayCurrency}
              defaultValue={editingAffDepositAmount.current}
              onChange={e => editingAffDepositAmount.current = e!}
            ></InputNumber>
          </div>
        </Flex>
        <h3>Tips:</h3>
        <p>Aff 佣金划转到余额后，可以站内消费，不可提现。</p>
      </div>,
      onOk: () => {
        return promiseFetchJson(api.user.aff_deposit(editingAffDepositAmount.current), (ret) => {
          showCommonError(ret, ["划转成功", "划转失败"], () => reloadMyVar({ userInfo: true }))
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
  const connection_limit = ignoreError(() => userInfo.connection_limit) > 0 ? <Flex>
    <Typography.Text strong>连接数限制</Typography.Text>
    <Typography.Text>{ignoreError(() => userInfo.connection_limit)}</Typography.Text>
  </Flex> : <></>
  const tgNotify = ignoreError(() => userInfo.admin) == true ? <Flex className='ant-flex3'>
    <Typography.Text strong>Telegram 推送信息</Typography.Text>
    <Button icon={<SettingOutlined />} onClick={btn_telegram_notify_onclick}>设置</Button>
  </Flex> : <></>

  const invite_code = ignoreError(() => userInfo.invite_code, "");

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
            <Typography.Text>{ignoreError(() => userInfo.group_name)}</Typography.Text>
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
            <Typography.Text>{ignoreErrorAndBlank(() => userInfo.renew_price, 0)} {displayCurrency}</Typography.Text>
            <Button icon={<SyncOutlined />} onClick={btn_renew_onclick}>立即续费</Button>
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
          {connection_limit}
          <Flex className='ant-flex3'>
            <Typography.Text strong>钱包余额</Typography.Text>
            <Typography.Text>{ignoreError(() => userInfo.balance)} {displayCurrency}</Typography.Text>
            <Button icon={<PlusCircleOutlined />} onClick={() => myvar.nav("/shop")}>充值</Button>
          </Flex>
          <Flex className='ant-flex3'>
            <Typography.Text strong>Telegram 关联</Typography.Text>
            <Typography.Text>{ignoreError(() => userInfo.telegram_id)}</Typography.Text>
            <Popconfirm title="关联 Telegram 帐号" onConfirm={btn_telegram_bind_onclick}>
              <Button icon={<LinkOutlined />}>关联</Button>
            </Popconfirm>
            <Popconfirm title="取消关联 Telegram 帐号" onConfirm={btn_telegram_unbind_onclick}>
              <Button danger icon={<DisconnectOutlined />}>取消关联</Button>
            </Popconfirm>
          </Flex>
          {tgNotify}
        </Space>
      </Card>
      <Card title="账户设置">
        <Flex vertical className='ant-flex2'>
          <Flex>
            <Typography.Paragraph style={{ marginBottom: 0 }}>
              <Typography.Title level={4} style={{ marginTop: 0 }}>自动续费</Typography.Title>
              <blockquote>如果您的套餐临近到期，或者流量用完，系统将自动续费。请保证余额充足，否则会续费失败。</blockquote>
            </Typography.Paragraph>
            <Switch style={{ alignSelf: "center" }}
              loading={requesting}
              checked={autoRenew}
              onClick={switchAutoRenew}
              title='开启' />
          </Flex>
          <Flex vertical>
            <Typography.Paragraph style={{ marginBottom: 0 }}>
              <Typography.Title level={4}>重置密码</Typography.Title>
              <blockquote>如果您的密码已泄漏，可以在这里重置。重置操作会强制下线您在其他地方的登录。</blockquote>
            </Typography.Paragraph>
            <Form
              form={form}
              disabled={requesting}
              onFinish={resetPassword}
            >
              <Flex vertical>
                <Form.Item
                  name="current_password"
                  rules={[{ required: true, message: "请输入当前密码" }]}
                >
                  <Input
                    prefix={<LockOutlined />}
                    placeholder="当前密码"
                  />
                </Form.Item>

                <Form.Item
                  name="new_password"
                  rules={[{ required: false }]} // 可以为空，表示生成随机密码
                >
                  <Input
                    prefix={<LockOutlined />}
                    placeholder="新密码，留空随机生成。"
                  />
                </Form.Item>

                <Form.Item
                  name="confirm"
                  dependencies={['new_password']}
                  rules={[
                    {
                      validator: (_, value, callback) => {
                        const newPassword = form.getFieldValue('new_password');
                        if (!newPassword) {
                          return Promise.resolve(); // 如果新密码为空，不做校验
                        }
                        if (!value) {
                          return Promise.reject(new Error('请确认密码'));
                        }
                        if (value !== newPassword) {
                          return Promise.reject(new Error('两次密码输入不一致'));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input
                    prefix={<LockOutlined />}
                    placeholder="确认新密码"
                  />
                </Form.Item>

                <Form.Item>
                  <Popconfirm
                    title="确认要重置密码吗？"
                    onConfirm={async () => {
                      try {
                        await form.validateFields();
                      } catch (e) {
                        return
                      }
                      myvar.window.TODO_PROMISE = new Promise((resolve) => myvar.window.TODO_PROMISE_RESLOVE = resolve)
                      form.submit()
                      return myvar.window.TODO_PROMISE
                    }}
                    okText="确认"
                    cancelText="取消"
                  >
                    <Button type="primary" danger htmlType="button">重置密码</Button>
                  </Popconfirm>
                </Form.Item>

              </Flex>
            </Form>
          </Flex>
        </Flex>
      </Card>
      <Card title="邀请注册" hidden={!affConfig.enable}>
        <Flex vertical>
          <Card title="邀请注册链接">
            <Flex vertical>
              {invite_code == "" ? <a onClick={() => resetInviteCode(true)}>您还没有邀请码，请先创建邀请码。</a> : <Typography.Paragraph copyable style={{ marginBottom: 0 }}>{location.origin + "/#register/" + invite_code}</Typography.Paragraph>}
              <Flex>
                <Button onClick={() => myvar.nav("/afflog")}>查看邀请记录</Button>
                <Button danger onClick={() => resetInviteCode(false)}>重置邀请码</Button>
              </Flex>
            </Flex>
          </Card>
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            <Typography.Title level={5}>佣金比例: {(Number(affConfig.commission_rate) * 100).toFixed(2)}% ({affConfig.cycle ? "循环返利" : "首次消费返利"})</Typography.Title>
            <Flex className='ant-flex2'>
              <Typography.Title level={5}>佣金余额: {ignoreError(() => userInfo.aff_balance)} {displayCurrency}</Typography.Title>
              <Button onClick={btn_aff_deposit_onclick}>划转余额</Button>
            </Flex>
          </Typography.Paragraph>
        </Flex>
      </Card>
    </Flex>
  )
}
