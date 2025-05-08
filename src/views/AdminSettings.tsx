import { Button, Card, Flex, Input, InputNumber, message, Modal, Select, Switch, Tooltip } from 'antd';
import { Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { asyncFetchJson, promiseFetchJson } from '../util/fetch';
import { api } from '../api/api';
import { showCommonError } from '../util/commonError';
import { reloadMyVar } from '../myvar';
import { FrontInviteConfig, FrontPaymentInfo, FrontPaymentInfoGateway, FrontSiteInfo, HideInServerStatus, RegisterCaptchaPolicy, RegisterPolicy } from '../api/model_front';
import { displayCurrency, renderSelect2 } from '../util/ui';
import { cleanupDefaultValue, isNotBlank, tryParseJSONObject } from '../util/misc';
import { InviteSettings, editingInviteSettings } from '../widget/InviteSettings';
import AsyncButton from '../widget/AsyncButton';
import { DragSortTable, ProColumns } from '@ant-design/pro-components';
import { EditOutlined, DeleteOutlined, FileAddOutlined } from '@ant-design/icons';
import { clone } from 'lodash-es';
import { MyMessage, MyModal } from '../util/MyModal';
import { newPromiseRejectNow } from '../util/promise';
import { formatDocument, getEditor, MEditor } from '../widget/MEditor';

export function AdminSettingsView(props: { userInfo: any, siteInfo: FrontSiteInfo }) {
  const editingObj = useRef<any>(null)
  const [mncEditingJson, setMncEditingJson] = useState<any>({});
  const [mncOpen, setMncOpen] = useState(false)

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
  const [gws, setGws] = useState<FrontPaymentInfoGateway[]>([]);

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
          if (info.gateways != null) {
            setGws(info.gateways)
          } else {
            setGws([])
          }
        } catch (e: any) {
          setGws([])
        }
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
    let payment = new FrontPaymentInfo()
    payment.min_deposit = min_deposit
    payment.gateways = gws
    return promiseFetchJson(api.admin.kv_put("payment_info", JSON.stringify(payment)), (ret) => {
      showCommonError(ret, ["保存成功", "保存失败"])
    })
  }

  function btn_save_invite_onclick() {
    return promiseFetchJson(api.admin.kv_put("invite_config", JSON.stringify(editingInviteSettings)), (ret) => {
      showCommonError(ret, ["保存成功", "保存失败"])
    })
  }

  const columns: ProColumns[] = [
    { title: '类型', key: 'type', dataIndex: 'type' },
    { title: '名称', key: 'id', dataIndex: 'name', },
    { title: '是否启用', key: 'enable', dataIndex: 'enable', renderText: (e) => e ? "True" : "False" },
    {
      title: '操作', key: 'action', dataIndex: 'name', renderText: function (a, b, index: number) {
        return <Flex gap={8}>
          <Tooltip title="编辑"><Button icon={<EditOutlined />} onClick={() => editPaymentMethod(gws[index], index)} /></Tooltip>
          <Tooltip title="删除"><Button icon={<DeleteOutlined />} onClick={() => deletePaymentMethod(index)} /></Tooltip>
        </Flex>
      }
    },
  ];

  function editPaymentMethod(obj: any, index: number) {
    obj = clone(obj)
    if (index < 0) {
      obj.type = "epay"
    }
    editingObj.current = obj
    MyModal.confirm({
      icon: <p />,
      title: index < 0 ? "添加支付通道" : "编辑支付通道",
      content: <Flex vertical>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>名称</Typography.Text>
          <Input
            placeholder='名称不能重复，且不能为空。'
            defaultValue={obj.name}
            onChange={(e) => editingObj.current.name = e.target.value}
          ></Input>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>类型</Typography.Text>
          <Select
            defaultValue={obj.type}
            options={[
              { label: "epay", value: "epay" },
              { label: "epusdt", value: "epusdt" },
              { label: "tokenpay", value: "tokenpay" },
              { label: "cyber", value: "cyber" },
              { label: "cryptomus", value: "cryptomus" },
            ]}
            onChange={(e) => editingObj.current.type = e}
          ></Select>
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text style={{ flex: 1 }} strong>启用</Typography.Text>
          <Switch
            defaultChecked={editingObj.current.enable}
            onChange={(e) => editingObj.current.enable = e} />
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Tooltip title="请填写完整 URL 而非只填域名。部分参数可以通过 query string 指定，详情请看文档。">
            <Typography.Text strong>URL (?)</Typography.Text>
          </Tooltip>
          <Input defaultValue={obj.url}
            onChange={(e) => editingObj.current.url = e.target.value.trim()} />
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>PID / 商户号</Typography.Text>
          <Input defaultValue={obj.pid}
            placeholder='只有部分支付类型需要填写'
            onChange={(e) => editingObj.current.pid = e.target.value.trim()} />
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>Secret / 密钥</Typography.Text>
          <Input defaultValue={obj.secret}
            onChange={(e) => editingObj.current.secret = e.target.value.trim()} />
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>回调 Host</Typography.Text>
          <Input defaultValue={obj.callback_host}
            placeholder='示例： https://xxx.com ，留空则使用用户访问的域名'
            onChange={(e) => editingObj.current.callback_host = e.target.value.trim()} />
        </Flex>
        <Flex className='neko-settings-flex-line'>
          <Tooltip title="在支付金额中加收手续费的百分比。会向客户展示。">
            <Typography.Text strong>费率 (?)</Typography.Text>
          </Tooltip>
          <InputNumber style={{ width: "100%" }}
            min={0}
            step={0.1}
            addonAfter="%"
            defaultValue={Number(obj.fee_ratio) * 100}
            onChange={(e) => editingObj.current.fee_ratio = Number(e) / 100} />
        </Flex>
      </Flex>,
      onOk: () => {
        editingObj.current = cleanupDefaultValue(editingObj.current)
        if (!isNotBlank(editingObj.current.name)) {
          MyMessage.error("名称为空")
          return newPromiseRejectNow(null)
        }
        if (!isNotBlank(editingObj.current.type)) {
          MyMessage.error("支付类型为空")
          return newPromiseRejectNow(null)
        }
        let nameConflict = false;
        gws.forEach((e, i) => {
          if (i == index) return;
          if (e.name == editingObj.current.name) nameConflict = true;
        })
        if (nameConflict) {
          MyMessage.error("名称冲突")
          return newPromiseRejectNow(null)
        }
        // edit or add ?
        if (index >= 0) {
          setGws(gws.map((e, i) => {
            if (i == index) {
              e = editingObj.current
            }
            // console.log(e, index, i, editingObj.current)
            return e
          }))
        } else {
          const newGws = clone(gws)
          newGws.push(editingObj.current)
          setGws(newGws)
        }
        return
      }
    })
  }

  function deletePaymentMethod(e: number) {
    MyModal.confirm({
      icon: <p />,
      title: "删除支付方式",
      content: <p>你确定要删除 {gws[e].name} 吗？</p>,
      onOk: () => {
        setGws(gws.filter((_, index) => index != e))
        return
      }
    })
  }

  function expertEdit(obj: any) {
    setMncEditingJson(JSON.stringify(obj))
    setMncOpen(true)
    setTimeout(formatDocument, 300);
  }

  function expertEditClose(ok: boolean) {
    setMncOpen(false)
    if (!ok) return
    try {
      const m = getEditor()
      const jsonObj = tryParseJSONObject(m!.getValue())
      if (jsonObj == null) {
        message.error("输入的JSON无效。")
        return
      }
      // save to memory
      setGws(jsonObj)
    } catch (e: any) {
      MyModal.error({
        title: "保存出错",
        content: e,
      })
    }
  }

  return (
    <>
      <Modal
        width={"100%"}
        closable={false}
        maskClosable={false}
        open={mncOpen}
        title="json 编辑"
        onOk={() => expertEditClose(true)}
        onCancel={() => expertEditClose(false)}>
        <MEditor value={mncEditingJson} />
      </Modal>
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
            <Flex>
              <Button icon={<FileAddOutlined />} onClick={() => editPaymentMethod(new FrontPaymentInfoGateway, -1)}>添加支付通道</Button>
              <Button icon={<EditOutlined />} onClick={() => expertEdit(gws)}>编辑支付设置 json</Button>
            </Flex>
            <DragSortTable
              rowKey="id"
              pagination={false}
              search={false}
              options={false}
              columns={columns}
              dataSource={gws}
            // TODO cannot drag
            // dragSortKey="show_order"
            // onDragSortEnd={handleDragSortEnd}
            />
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
    </>
  )
}
