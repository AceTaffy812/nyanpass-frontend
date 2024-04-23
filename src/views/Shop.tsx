import { useRef, useEffect, useState } from 'react';
import { api } from '../api/api';
import { asyncFetchJson, promiseFetchJson } from '../util/fetch';
import { byteConverter, formatInfoTraffic } from '../util/format';
import { ignoreError } from '../util/promise';
import { Button, Card, Flex, Form, Input, InputNumber, List, Popconfirm, QRCode, Radio, Space, Typography } from 'antd';
import { displayCurrency } from '../util/ui';
import { translatePlanType } from '../api/model_front';
import { MyMessage, MyModalCannotDismiss, closeCurrentDialog } from '../util/MyModal';
import { showCommonError } from '../util/commonError';
import { reloadMyVar } from '../myvar';
import { isNotBlank } from '../util/misc';
import { TagOutlined } from '@ant-design/icons';

export function ShopView(props: { userInfo: any }) {
  const { userInfo } = props;
  const mounted = useRef(false);
  // const coupon = useRef("");
  const [requesting, setRequesting] = useState(false);
  const [plans, setPlans] = useState<any>([]);
  const [depositAmount, setDepositAmount] = useState(100);
  const [paymentCurrency, setPaymentCurrency] = useState("cny");

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      asyncFetchJson(api.user.shop_plan_list(), (ret) => {
        if (ret.data != null) {
          setPlans(ret.data)
        }
      })
    }
  }, [])

  function renderPlanCard(item: any, apiFactory: any) {
    let shuoming = <></>
    if (isNotBlank(item.desc)) {
      let shuoming2 = <Typography.Text>{item.desc}</Typography.Text>
      if (item.desc.startsWith("<")) {
        shuoming2 = <div dangerouslySetInnerHTML={{ __html: item.desc }}></div>
      }
      shuoming = <Flex>
        <Typography.Text strong>说明</Typography.Text>
        {shuoming2}
      </Flex>
    }
    const speed_limit = item.speed_limit > 0 ? <Flex>
      <Typography.Text strong>速率限制</Typography.Text>
      <Typography.Text>{byteConverter(item.speed_limit, "M_Net").toFixed(0)} Mbps</Typography.Text>
    </Flex> : <></>
    const ip_limit = item.ip_limit > 0 ? <Flex>
      <Typography.Text strong>IP 限制</Typography.Text>
      <Typography.Text>{item.ip_limit}</Typography.Text>
    </Flex> : <></>
    return <Card title={item.name}>
      <Flex vertical>
        <Flex>
          <Typography.Text strong>类型</Typography.Text>
          <Typography.Text>{translatePlanType(item)}</Typography.Text>
        </Flex>
        <Flex>
          <Typography.Text strong>最大规则数</Typography.Text>
          <Typography.Text>{item.max_rules}</Typography.Text>
        </Flex>
        {speed_limit}
        {ip_limit}
        <Flex>
          <Typography.Text strong>流量</Typography.Text>
          <Typography.Text>{formatInfoTraffic(item, true)}</Typography.Text>
        </Flex>
        {shuoming}
        <Popconfirm
          title="购买"
          description={`从余额支付 ${item.price} ${displayCurrency} 购买此套餐，请确保余额充足。**购买后将覆盖当前套餐**。`}
          placement='bottom'
          onConfirm={
            () => {
              // 默认用单纯的购买 API
              if (apiFactory == null) {
                apiFactory = () => api.user.shop_plan_purchase(item.id)
              }
              return promiseFetchJson(apiFactory(), (ret) => {
                showCommonError(ret, [`购买 ${item.name} 成功`, "购买失败"], undefined, true)
                reloadMyVar({ userInfo: true })
              })
            }}>
          <Button disabled={requesting}>点击购买 ({item.price} {displayCurrency})</Button>
        </Popconfirm>
      </Flex>
    </Card>
  }

  function btn_deposit() {
    setRequesting(true)
    MyMessage.info("正在跳转......")
    asyncFetchJson(api.user.shop_deposit(paymentCurrency, depositAmount), (ret) => {
      setRequesting(false)
      if (ret.code == 0) {
        let data = ret.data
        if (data.qr) {
          MyModalCannotDismiss.info({
            title: "请扫码支付",
            content: <QRCode value={data.url}></QRCode>
          })
        } else {
          window.location.href = data.url
        }
      } else {
        showCommonError(ret, "充值请求失败")
      }
    })
  }

  function queryRedeemCode(values: any) {
    if (values == null || !isNotBlank(values.code)) {
      return
    }
    setRequesting(true)
    return promiseFetchJson(api.user.shop_redeem_query(values.code), (ret) => {
      setRequesting(false)
      if (ret.code == 0) {
        MyModalCannotDismiss.info({
          title: "兑换详情",
          content: <Flex vertical>
            {renderPlanCard(ret.data, () => { closeCurrentDialog(); return api.user.shop_redeem_purchase(values.code) })}
          </Flex>
        })
      } else {
        showCommonError(ret, "错误")
      }
    })
  }

  return (
    <Flex vertical>
      <Card title="我的钱包">
        <Flex vertical>
          <h2>钱包余额: {ignoreError(() => userInfo.balance) + " " + displayCurrency}</h2>
        </Flex>
      </Card>
      <Card title="充值">
        <Flex vertical>
          <InputNumber
            min={0}
            step={0.01}
            addonBefore="充值金额"
            addonAfter="CNY"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e!)} />
          <Card title="充值方式">
            <Flex vertical className='ant-flex2'>
              <Radio.Group onChange={(e) => setPaymentCurrency(e.target.value)} value={paymentCurrency}>
                <Space direction="vertical">
                  <Radio value="cny">CNY</Radio>
                  <Radio value="usdt">USDT-TRC20</Radio>
                </Space>
              </Radio.Group>
              <Button onClick={btn_deposit} disabled={requesting}>充值</Button>
            </Flex>
          </Card>
          <Typography.Text>由于支付手续费，最终支付金额可能大于您充值的金额。</Typography.Text>
        </Flex>
      </Card>
      <Card title="购买套餐">
        <List
          grid={{ gutter: 32 }}
          dataSource={plans}
          renderItem={(item: any) => (
            <List.Item>
              {renderPlanCard(item, null)}
            </List.Item>
          )}
        />
      </Card>
      <Card title="兑换套餐">
        <Flex vertical>
          <Typography.Paragraph>
            <blockquote>如果您有兑换码，则可以免费或低价购买对应的套餐。</blockquote>
          </Typography.Paragraph>
          <Form
            disabled={requesting}
            onFinish={queryRedeemCode}
          >
            <Flex className='neko-flex'>
              <Form.Item name="code" style={{ marginBottom: "unset" }}>
                <Input
                  prefix={<TagOutlined />}
                  placeholder="兑换码"
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: "unset" }}>
                <Button type="primary" htmlType="submit">兑换</Button>
              </Form.Item>
            </Flex>
          </Form>
        </Flex>
      </Card>
    </Flex>
  )
}
