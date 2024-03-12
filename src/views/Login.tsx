import { useEffect, useRef, useState } from 'react'
import { Button, Card, Flex, Form, Input, Tag, Typography } from "antd";
import { asyncFetchJson } from '../util/fetch';
import { myvar, reloadMyVar } from '../myvar';
import { showCommonError } from '../util/commonError';
import { api } from '../api/api';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { CaptchaApp } from "../widget/captcha/CaptchaApp.js"
import { ignoreError } from '../util/promise.js';
import { useParams } from 'react-router-dom';

export function LoginView(props: { reg: boolean, siteInfo: any }) {
  const [requesting, setRequesting] = useState(false);
  const [isRegister, setIsRegister] = useState(props.reg);
  const params = useParams();
  const [inviter, setInviter] = useState(params["inviter"]);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      const token = params["token"]
      if (token != null) {
        localStorage.setItem("Authorization", token);
        reloadMyVar()
        myvar.nav("/")
      }
    }
  }, [])

  function onFinish(values: any) {
    setRequesting(true)
    myvar.captchaReset()
    var req: any = null
    if (isRegister) {
      req = api.auth.register(values, inviter, myvar.captchaKey)
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
    // register_captcha_policy == 1 即开启默认的交互验证
    if (isRegister && props.siteInfo.register_captcha_policy == 1) {
      return <div style={{ width: "100%" }}><CaptchaApp /></div>
    }
    return <></>
  }

  const YaoQingZhe = <Input style={{ marginBottom: "1em" }}
    prefix={<Tag>邀请代码</Tag>}
    defaultValue={inviter}
    value={inviter}
    onChange={e => setInviter(e.target.value)}
    placeholder="选填"
  />
  const qdAllowRegister = props.siteInfo.allow_register && props.siteInfo.register_policy != 2

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

          {isRegister && props.siteInfo.register_policy == 0 ? YaoQingZhe : <></>}

          <Form.Item>
            <Button type="primary" htmlType="submit">{isRegister ? "注册" : "登录"}</Button>
          </Form.Item>

          <Flex className='neko-settings-flex-line' >
            {renderCaptcha()}
            {qdAllowRegister ? <Typography.Link onClick={() => setIsRegister(!isRegister)}>{!isRegister ? "前往注册" : "前往登录"}</Typography.Link> : <></>}
          </Flex>

        </Form>
      </Flex>
    </Card>
  )
}
