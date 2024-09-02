import { Card, Flex, Input, InputNumber, Select, Switch, Tabs } from 'antd';
import { Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { asyncFetchJson, promiseFetchJson } from '../util/fetch';
import { api } from '../api/api';
import { showCommonError } from '../util/commonError';
import { reloadMyVar } from '../myvar';
import { FrontInviteConfig, FrontPaymentInfo, FrontSiteInfo, HideInServerStatus, RegisterCaptchaPolicy, RegisterPolicy } from '../api/model_front';
import { displayCurrency, renderSelect2 } from '../util/ui';
import { cleanupDefaultValue } from '../util/misc';
import { InviteSettings, editingInviteSettings } from '../widget/InviteSettings';
import AsyncButton from '../widget/AsyncButton';

export function AdminSettingsView(props: { userInfo: any, siteInfo: FrontSiteInfo }) {
  const mounted = useRef(false);
  const { userInfo, siteInfo } = props;

  const [title, setTitle] = useState('');
  const [allowReg, setAllowReg] = useState(false);
  const [registerPolicy, setRegisterPolicy] = useState(0);
  const [registerCaptchaPolicy, setRegisterCaptchaPolicy] = useState(0);
  const [allowSingle, setAllowSingle] = useState(false);
  const [allowLookingGlass, setAllowLookingGlass] = useState(false);
  const [diagnoseHideIP, setDiagnoseHideIP] = useState(0);
  const [notice, setNotice] = useState('');
  const [inviteConfig, setInviteConfig] = useState(new FrontInviteConfig());

  const [min_deposit, set_min_deposit] = useState(10);
  const [enable_epay, set_enable_epay] = useState(false);
  const [epay_url, set_epay_url] = useState('');
  const [epay_pid, set_epay_pid] = useState('');
  const [epay_secret, set_epay_secret] = useState('');
  const [epay_callback_host, set_epay_callback_host] = useState('');
  const [epay_fee, set_epay_fee] = useState(0);
  const [enable_epusdt, set_enable_epusdt] = useState(false);
  const [epusdt_url, set_epusdt_url] = useState('');
  const [epusdt_secret, set_epusdt_secret] = useState('');
  const [epusdt_callback_host, set_epusdt_callback_host] = useState('');
  const [enable_cyber, set_enable_cyber] = useState(false);
  const [cyber_url, set_cyber_url] = useState('');
  const [cyber_pid, set_cyber_pid] = useState('');
  const [cyber_secret, set_cyber_secret] = useState('');
  const [cyber_callback_host, set_cyber_callback_host] = useState('');
  const [cyber_fee, set_cyber_fee] = useState(0);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      asyncFetchJson(api.guest.kv("site_notice", "admin"), (ret) => {
        setNotice(ret.data)
      })
      asyncFetchJson(api.guest.kv("invite_config", "admin"), (ret) => {
        try {
          let info = JSON.parse(ret.data)
          setInviteConfig(info)
        } catch (e: any) { }
      })
      asyncFetchJson(api.guest.kv("payment_info", "admin"), (ret) => {
        try {
          let info = JSON.parse(ret.data)
          set_min_deposit(info.min_deposit)
          if (info.gateways.length > 0) {
            set_enable_epay(info.gateways[0].enable)
            set_epay_url(info.gateways[0].url)
            set_epay_pid(info.gateways[0].pid)
            set_epay_secret(info.gateways[0].secret)
            set_epay_callback_host(info.gateways[0].callback_host)
            set_epay_fee(info.gateways[0].fee_ratio)
          }
          if (info.gateways.length > 1) {
            set_enable_epusdt(info.gateways[1].enable)
            set_epusdt_url(info.gateways[1].url)
            set_epusdt_secret(info.gateways[1].secret)
            set_epusdt_callback_host(info.gateways[1].callback_host)
          }
          if (info.gateways.length > 2) {
            set_enable_cyber(info.gateways[2].enable)
            set_cyber_url(info.gateways[2].url)
            set_cyber_pid(info.gateways[2].pid)
            set_cyber_secret(info.gateways[2].secret)
            set_cyber_callback_host(info.gateways[2].callback_host)
            set_cyber_fee(info.gateways[2].fee_ratio)
          }
        } catch (e: any) { }
      })
    }
  }, [])

  useEffect(() => {
    if (siteInfo != null) {
      setTitle(siteInfo.title)
      setAllowReg(siteInfo.allow_register)
      setAllowSingle(siteInfo.allow_single_tunnel)
      setAllowLookingGlass(siteInfo.allow_looking_glass)
      setRegisterPolicy(siteInfo.register_policy ?? 0)
      setRegisterCaptchaPolicy(siteInfo.register_captcha_policy ?? 0)
      setDiagnoseHideIP(siteInfo.diagnose_hide_ip ?? 0)
    }
  }, [siteInfo])

  function btn_save_siteinfo_onclick() {
    const newInfo: FrontSiteInfo = {
      title: title,
      allow_register: allowReg,
      allow_single_tunnel: allowSingle,
      allow_looking_glass: allowLookingGlass,
      register_policy: registerPolicy,
      register_captcha_policy: registerCaptchaPolicy,
      diagnose_hide_ip: diagnoseHideIP,
    }
    cleanupDefaultValue(newInfo)
    return promiseFetchJson(api.admin.kv_put("site_info", JSON.stringify(newInfo)), (ret) => {
      showCommonError(ret, ["保存成功", "保存失败"], () => {
        reloadMyVar({ siteInfo: true })
      })
    })
  }

  function btn_save_notice_onclick() {
    return promiseFetchJson(api.admin.kv_put("site_notice", notice), (ret) => {
      showCommonError(ret, ["保存成功", "保存失败"])
    })
  }

  function btn_save_payment_onclick() {
    // TODO wtf
    let payment = new FrontPaymentInfo()
    payment.min_deposit = min_deposit
    payment.gateways[0].enable = enable_epay
    payment.gateways[0].url = epay_url
    payment.gateways[0].pid = epay_pid
    payment.gateways[0].secret = epay_secret
    payment.gateways[0].callback_host = epay_callback_host
    payment.gateways[0].fee_ratio = epay_fee
    payment.gateways[1].enable = enable_epusdt
    payment.gateways[1].url = epusdt_url
    payment.gateways[1].secret = epusdt_secret
    payment.gateways[1].callback_host = epusdt_callback_host
    payment.gateways[2].enable = enable_cyber
    payment.gateways[2].url = cyber_url
    payment.gateways[2].pid = cyber_pid
    payment.gateways[2].secret = cyber_secret
    payment.gateways[2].callback_host = cyber_callback_host
    payment.gateways[2].fee_ratio = cyber_fee
    //
    return promiseFetchJson(api.admin.kv_put("payment_info", JSON.stringify(payment)), (ret) => {
      showCommonError(ret, ["保存成功", "保存失败"])
    })
  }

  function btn_save_invite_onclick() {
    return promiseFetchJson(api.admin.kv_put("invite_config", JSON.stringify(editingInviteSettings)), (ret) => {
      showCommonError(ret, ["保存成功", "保存失败"])
    })
  }

  return (
    <Flex vertical>
      <Card title="基本">
        <Flex vertical>
          <Flex className='neko-settings-flex-line'>
            <Typography.Text className='dq-1'>站点名称</Typography.Text>
            <Input className='dq-2' value={title} onChange={(e) => setTitle(e.target.value.trim())}></Input>
          </Flex>
          <Flex className='neko-settings-flex-line'>
            <Typography.Text className='dq-1'>允许注册</Typography.Text>
            <div className='dq-2' >
              <Switch checked={allowReg} onChange={(e) => setAllowReg(e)} />
            </div>
          </Flex>
          <Flex className='neko-settings-flex-line'>
            <Typography.Text className='dq-1'>邀请注册策略</Typography.Text>
            <div className='dq-2'>
              <Select
                value={registerPolicy}
                options={renderSelect2(RegisterPolicy)}
                onChange={(e) => setRegisterPolicy(e)}
              ></Select>
            </div>
          </Flex>
          <Flex className='neko-settings-flex-line'>
            <Typography.Text className='dq-1'>注册验证码</Typography.Text>
            <div className='dq-2'>
              <Select
                value={registerCaptchaPolicy}
                options={renderSelect2(RegisterCaptchaPolicy)}
                onChange={(e) => setRegisterCaptchaPolicy(e)}
              ></Select>
            </div>
          </Flex>
          <Flex className='neko-settings-flex-line'>
            <Typography.Text className='dq-1'>允许创建单端隧道</Typography.Text>
            <div className='dq-2' >
              <Switch checked={allowSingle} onChange={(e) => setAllowSingle(e)} />
            </div>
          </Flex>
          <Flex className='neko-settings-flex-line'>
            <Typography.Text className='dq-1'>允许 Looking Glass</Typography.Text>
            <div className='dq-2' >
              <Switch checked={allowLookingGlass} onChange={(e) => setAllowLookingGlass(e)} />
            </div>
          </Flex>
          <Flex className='neko-settings-flex-line'>
            <Typography.Text className='dq-1'>诊断结果隐藏 IP</Typography.Text>
            <div className='dq-2'>
              <Select
                value={diagnoseHideIP}
                options={renderSelect2(HideInServerStatus)}
                onChange={(e) => setDiagnoseHideIP(e)}
              ></Select>
            </div>
          </Flex>
        </Flex>
        <AsyncButton type="primary"
          style={{ margin: "1em 0 0 0", float: 'right' }}
          onClick={btn_save_siteinfo_onclick}
        >保存</AsyncButton>
      </Card>
      <Card title="站点公告">
        <Input.TextArea
          placeholder='以 < 开头则显示为 HTML'
          rows={4}
          value={notice}
          onChange={(e) => { setNotice(e.target.value.trim()) }}
        ></Input.TextArea>
        <AsyncButton type="primary"
          style={{ margin: "1em 0 0 0", float: 'right' }}
          onClick={btn_save_notice_onclick}
        >保存</AsyncButton>
      </Card>
      <Card title="支付设置">
        <Flex vertical>
          <Flex className='neko-settings-flex-line'>
            <Typography.Text className='dq-1'>最小充值金额</Typography.Text>
            <InputNumber className='dq-2'
              min={0}
              step={0.01}
              addonAfter={displayCurrency}
              value={min_deposit}
              onChange={(e) => set_min_deposit(e!)} />
          </Flex>
          <Card>
            <Tabs
              type="card"
              items={[
                {
                  label: `易支付`,
                  key: "epay",
                  children: <Flex vertical>
                    <Flex className='neko-settings-flex-line'>
                      <Typography.Text className='dq-1'>启用 Epay</Typography.Text>
                      <div className='dq-2' >
                        <Switch checked={enable_epay} onChange={(e) => set_enable_epay(e)} />
                      </div>
                    </Flex>
                    <Flex className='neko-settings-flex-line'>
                      <Typography.Text className='dq-1' >URL</Typography.Text>
                      <Input value={epay_url}
                        placeholder='示例： https://xxxpay.com/submit.php'
                        onChange={(e) => set_epay_url(e.target.value.trim())} />
                    </Flex>
                    <Flex className='neko-settings-flex-line'>
                      <Typography.Text className='dq-1' >PID</Typography.Text>
                      <Input value={epay_pid}
                        placeholder='必填'
                        onChange={(e) => set_epay_pid(e.target.value.trim())} />
                    </Flex>
                    <Flex className='neko-settings-flex-line'>
                      <Typography.Text className='dq-1' >Secret</Typography.Text>
                      <Input value={epay_secret}
                        placeholder='必填'
                        onChange={(e) => set_epay_secret(e.target.value.trim())} />
                    </Flex>
                    <Flex className='neko-settings-flex-line'>
                      <Typography.Text className='dq-1' >回调 Host</Typography.Text>
                      <Input value={epay_callback_host}
                        placeholder='示例： https://xxx.com ，留空则使用用户访问的域名'
                        onChange={(e) => set_epay_callback_host(e.target.value.trim())} />
                    </Flex>
                    <Flex className='neko-settings-flex-line'>
                      <Typography.Text className='dq-1'>费率 (1% 的手续费，就填 0.01)</Typography.Text>
                      <InputNumber className='dq-2' style={{ width: "100%" }}
                        min={0}
                        step={0.01}
                        value={epay_fee}
                        onChange={(e) => set_epay_fee(e!)} />
                    </Flex>
                  </Flex>,
                },
                {
                  label: `Cyber 支付`,
                  key: "cyber",
                  children: <Flex vertical>
                    <Flex className='neko-settings-flex-line'>
                      <Typography.Text className='dq-1'>启用 Cyber</Typography.Text>
                      <div className='dq-2' >
                        <Switch checked={enable_cyber} onChange={(e) => set_enable_cyber(e)} />
                      </div>
                    </Flex>
                    <Flex className='neko-settings-flex-line'>
                      <Typography.Text className='dq-1' >URL</Typography.Text>
                      <Input value={cyber_url}
                        placeholder='示例： https://xxxpay.com/api/v1/tron'
                        onChange={(e) => set_cyber_url(e.target.value.trim())} />
                    </Flex>
                    <Flex className='neko-settings-flex-line'>
                      <Typography.Text className='dq-1' >App ID</Typography.Text>
                      <Input value={cyber_pid}
                        placeholder='必填'
                        onChange={(e) => set_cyber_pid(e.target.value.trim())} />
                    </Flex>
                    <Flex className='neko-settings-flex-line'>
                      <Typography.Text className='dq-1' >Secret</Typography.Text>
                      <Input value={cyber_secret}
                        placeholder='必填'
                        onChange={(e) => set_cyber_secret(e.target.value.trim())} />
                    </Flex>
                    <Flex className='neko-settings-flex-line'>
                      <Typography.Text className='dq-1' >回调 Host</Typography.Text>
                      <Input value={cyber_callback_host}
                        placeholder='示例： https://xxx.com ，留空则使用用户访问的域名'
                        onChange={(e) => set_cyber_callback_host(e.target.value.trim())} />
                    </Flex>
                    <Flex className='neko-settings-flex-line'>
                      <Typography.Text className='dq-1'>费率 (1% 的手续费，就填 0.01)</Typography.Text>
                      <InputNumber className='dq-2' style={{ width: "100%" }}
                        min={0}
                        step={0.01}
                        value={cyber_fee}
                        onChange={(e) => set_cyber_fee(e!)} />
                    </Flex>
                  </Flex>,
                },
                {
                  label: `EpUSDT`,
                  key: "epusdt",
                  children: <Flex vertical>
                    <Flex className='neko-settings-flex-line'>
                      <Typography.Text className='dq-1'>启用 EpUSDT</Typography.Text>
                      <div className='dq-2' >
                        <Switch checked={enable_epusdt} onChange={(e) => set_enable_epusdt(e)} />
                      </div>
                    </Flex>
                    <Flex className='neko-settings-flex-line'>
                      <Typography.Text className='dq-1' >URL</Typography.Text>
                      <Input value={epusdt_url}
                        placeholder='示例： https://xxxpay.com/api/v1/order/create-transaction'
                        onChange={(e) => set_epusdt_url(e.target.value.trim())} />
                    </Flex>
                    <Flex className='neko-settings-flex-line'>
                      <Typography.Text className='dq-1' >Secret</Typography.Text>
                      <Input value={epusdt_secret}
                        placeholder='必填'
                        onChange={(e) => set_epusdt_secret(e.target.value.trim())} />
                    </Flex>
                    <Flex className='neko-settings-flex-line'>
                      <Typography.Text className='dq-1' >回调 Host</Typography.Text>
                      <Input value={epusdt_callback_host}
                        placeholder='示例： https://xxx.com ，留空则使用用户访问的域名'
                        onChange={(e) => set_epusdt_callback_host(e.target.value.trim())} />
                    </Flex>
                  </Flex>,
                },
              ]}
            />
          </Card>
        </Flex>
        <AsyncButton type="primary"
          style={{ margin: "1em 0 0 0", float: 'right' }}
          onClick={btn_save_payment_onclick}
        >保存</AsyncButton>
      </Card>
      <Card title="邀请设置 (定制功能，若需使用请咨询作者)">
        <InviteSettings data={inviteConfig}></InviteSettings>
        <AsyncButton type="primary"
          style={{ margin: "1em 0 0 0", float: 'right' }}
          onClick={btn_save_invite_onclick}
        >保存</AsyncButton>
      </Card>
    </Flex>
  )
}
