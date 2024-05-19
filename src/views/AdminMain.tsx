import { useRef, useEffect, useState } from 'react';
import { api } from '../api/api';
import { asyncFetchJson } from '../util/fetch';
import { Card, Col, Flex, Row, Statistic } from 'antd';
import { ignoreError } from '../util/promise';
import { byteConverter } from '../util/format';
import { Bar } from '@ant-design/charts';
import { myvar } from '../myvar';
import { clone } from 'lodash';

export function AdminMainView() {
  const mounted = useRef(false);
  const [statistic, setStatistic] = useState<any>([]);
  const [user_traffic_rank_today, set_user_traffic_rank_today] = useState<any[]>([]);
  const [user_traffic_rank_yesterday, set_user_traffic_rank_yesterday] = useState<any[]>([]);
  const [node_traffic_rank_today, set_node_traffic_rank_today] = useState<any[]>([]);
  const [node_traffic_rank_yesterday, set_node_traffic_rank_yesterday] = useState<any[]>([]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      asyncFetchJson(api.admin.statistic(20), (ret) => {
        setStatistic(ret.data)
        try {
          ret.data.user_traffic_rank_today.forEach((e: any) => {
            e.用户 = e.username + " (#" + e.uid + ")"
            e.流量 = (e.traffic / (1024 * 1024 * 1024)).toFixed(2)
          })
          ret.data.user_traffic_rank_yesterday.forEach((e: any) => {
            e.用户 = e.username + " (#" + e.uid + ")"
            e.流量 = (e.traffic / (1024 * 1024 * 1024)).toFixed(2)
          })
          ret.data.node_traffic_rank_today.forEach((e: any) => {
            e.节点 = e.name + " (#" + e.gid + ")"
            e.流量 = (e.traffic / (1024 * 1024 * 1024)).toFixed(2)
          })
          ret.data.node_traffic_rank_yesterday.forEach((e: any) => {
            e.节点 = e.name + " (#" + e.gid + ")"
            e.流量 = (e.traffic / (1024 * 1024 * 1024)).toFixed(2)
          })
          set_user_traffic_rank_today(ret.data.user_traffic_rank_today)
          set_user_traffic_rank_yesterday(ret.data.user_traffic_rank_yesterday)
          set_node_traffic_rank_today(ret.data.node_traffic_rank_today)
          set_node_traffic_rank_yesterday(ret.data.node_traffic_rank_yesterday)
        } catch (e: any) { }
      })
    }
  }, [])

  const barConfig = {
    theme: myvar.isDarkMode ? "classicDark" : "classic",
    autoFit: true,
    xField: '用户',
    yField: '流量',
    colorField: "用户",
    legend: false,
    axis: {
      y: {
        line: false,
        tick: false,
        labelFormatter: '0',
        title: "流量 (GB)"
      },
      x: {
        title: false
      }
    },
    tooltip: {
      title: (d: any) => "流量 (GB)",
      items: [{ channel: 'x' }, { channel: 'y' }],
    },
    scale: {
      y: {
        type: 'linear',
      },
    }
  };
  const barConfig2 = clone(barConfig);
  barConfig2.xField = "节点"
  barConfig2.colorField = "节点"

  return (
    <Flex vertical>
      <Card title="数据一览">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card bordered={false}>
              <Statistic
                title="今日收入"
                value={ignoreError(() => statistic.income_today)}
                precision={2}
                suffix="CNY"
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card bordered={false}>
              <Statistic
                title="昨日收入"
                value={ignoreError(() => statistic.income_yesterday)}
                precision={2}
                suffix="CNY"
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card bordered={false}>
              <Statistic
                title="本月收入"
                value={ignoreError(() => statistic.income_this_month)}
                precision={2}
                suffix="CNY"
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card bordered={false}>
              <Statistic
                title="上月收入"
                value={ignoreError(() => statistic.income_last_month)}
                precision={2}
                suffix="CNY"
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card bordered={false}>
              <Statistic
                title="今日单向流量"
                value={ignoreError(() => byteConverter(statistic.total_traffic_today, "GB").toFixed(2))}
                suffix="GiB"
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card bordered={false}>
              <Statistic
                title="昨日单向流量"
                value={ignoreError(() => byteConverter(statistic.total_traffic_yesterday, "GB").toFixed(2))}
                suffix="GiB"
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card bordered={false}>
              <Statistic
                title="总用户"
                value={ignoreError(() => statistic.user_count)}
              />
            </Card>
          </Col>
        </Row>
      </Card>
      <Card title="今日用户流量排行" bodyStyle={{ padding: "1em" }}>
        <Bar {...barConfig} data={user_traffic_rank_today}></Bar>
      </Card>
      <Card title="昨日用户流量排行" bodyStyle={{ padding: "1em" }}>
        <Bar {...barConfig} data={user_traffic_rank_yesterday}></Bar>
      </Card>
      <Card title="今日节点流量排行" bodyStyle={{ padding: "1em" }}>
        <Bar {...barConfig2} data={node_traffic_rank_today}></Bar>
      </Card>
      <Card title="昨日节点流量排行" bodyStyle={{ padding: "1em" }}>
        <Bar {...barConfig2} data={node_traffic_rank_yesterday}></Bar>
      </Card>
    </Flex>
  )
}
