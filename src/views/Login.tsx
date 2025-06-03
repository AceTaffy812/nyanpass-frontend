import { useState } from 'react'
import { Button, Card, Flex, Form, Input, Tag, Typography } from "antd";
import { asyncFetchJson } from '../util/fetch';
import { myvar, reloadMyVar } from '../myvar';
import { showCommonError } from '../util/commonError';
import { api } from '../api/api';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { CaptchaApp } from "../widget/captcha/CaptchaApp.js"
import { ignoreError, ignoreErrorAndBlank } from '../util/promise.js';
import { useParams } from 'react-router-dom';

export function LoginView(props: { reg: boolean, siteInfo: any }) {
  const [requesting, setRequesting] = useState(false);
  const [isRegister, setIsRegister] = useState(props.reg);
  const params = useParams();
  const [inviter, setInviter] = useState(params["inviter"]);

  const [form] = Form.useForm();

  function onFinish(values: any) {
    window._.unset(values, "confirm")

    setRequesting(true)
    myvar.captchaReset()

    var req: any = null
    if (isRegister) {
      req = api.auth.register(values, inviter, myvar.captchaKey)
    } else {
      req = api.auth.login(values.username, values.password)
    }

    asyncFetchJson(req, (ret) => {
      showCommonError(ret, true, () => {
        ignoreError(() => localStorage.setItem("Authorization", ret.data))
        if (ret.code == 0) {
          reloadMyVar()
          myvar.nav("/")
        }
      })
    }, undefined, () => setRequesting(false))
  }

  function renderCaptcha() {
    // register_captcha_policy == 1 即开启默认的交互验证
    if (isRegister && props.siteInfo.register_captcha_policy == 1) {
      return <Form.Item><CaptchaApp /></Form.Item>
    }
    return null
  }

  const YaoQingZhe = <Input
    addonBefore={"邀请代码"}
    defaultValue={inviter}
    value={inviter}
    onChange={e => setInviter(e.target.value)}
    placeholder="选填"
  />
  const qdAllowRegister = props.siteInfo.allow_register && props.siteInfo.register_policy != 2

  return <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start', // 顶部对齐
      paddingTop: '15vh', // 推下来，约占屏幕高度的1/3
    }}>
    <Card
      style={{
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        borderRadius: 12,
      }}
      bordered={false}
      title={isRegister ? "注册" : "登录"}
    >
      <Form
        form={form}
        disabled={requesting}
        onFinish={onFinish}
        style={{ width: "100%" }}
      >
        <Flex vertical>

          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          {isRegister && (
            <Form.Item
              name="confirm"
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次密码输入不一致'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="确认密码"
                autoComplete="new-password"
              />
            </Form.Item>
          )}

          {isRegister && ignoreErrorAndBlank(() => props.siteInfo.register_policy, 0) === 0 ? <Form.Item>{YaoQingZhe}</Form.Item> : null}

          {renderCaptcha()}

          <Flex className='neko-flex'>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                {isRegister ? '注册' : '登录'}
              </Button>
            </Form.Item>
            {qdAllowRegister && (
              <Typography.Link onClick={() => {
                setIsRegister(!isRegister);
                // 切换模式时清空 confirm 字段
                form.resetFields(['confirm']);
              }}>
                {!isRegister ? '前往注册' : '前往登录'}
              </Typography.Link>
            )}
          </Flex>

        </Flex>
      </Form>
    </Card>
  </div>
}
