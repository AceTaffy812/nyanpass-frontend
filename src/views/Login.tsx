import { useState } from 'react'
import { Button, Card, Flex, Form, Input, Typography } from "antd";
import { asyncFetchJson } from '../util/fetch';
import { myvar, reloadMyVar } from '../myvar';
import { showCommonError } from '../util/commonError';
import { api } from '../api/api';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { CaptchaApp } from "../widget/captcha/CaptchaApp.js"
import { ignoreError } from '../util/promise.js';


export function LoginView() {
  const [requesting, setRequesting] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  function onFinish(values: any) {
    setRequesting(true)
    myvar.captchaReset()
    var req: any = null
    if (isRegister) {
      req = api.auth.register(values.username, values.password, myvar.captchaKey)
    } else {
      req = api.auth.login(values.username, values.password)
    }
    asyncFetchJson(req, (ret) => {
      setRequesting(false)
      showCommonError(ret, true, () => {
        ignoreError(() => localStorage.setItem("Authorization", ret.data))
        if (ret.code == 0) {
          reloadMyVar()
          myvar.nav("/")
        }
      })
    }, () => setRequesting(false))
  }

  function renderCaptcha() {
    if (isRegister) {
      return <div style={{ width: "100%" }}><CaptchaApp /></div>
    }
    return <></>
  }

  return (
    <Card title={isRegister ? "注册" : "登录"}>
      <Flex vertical className='neko-flex'>
        <Form
          disabled={requesting}
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[{ required: true }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true }]}
          >

            <Input
              prefix={<LockOutlined />}
              type="password"
              placeholder="密码"
            />

            {/* <Form.Item>
              <a href="">忘记密码</a>
            </Form.Item> */}

          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">{isRegister ? "注册" : "登录"}</Button>
          </Form.Item>

          <Flex className='neko-settings-flex-line' >
            {renderCaptcha()}
            <Typography.Link onClick={() => setIsRegister(!isRegister)}>{!isRegister ? "前往注册" : "前往登录"}</Typography.Link>
          </Flex>

        </Form>
      </Flex>
    </Card>
  )
}
