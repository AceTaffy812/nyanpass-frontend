import { ignoreError } from "../util/promise"

export class FrontSiteInfo {
    title: string = ""
    allow_register: boolean = false
    allow_single_tunnel: boolean = false
    allow_looking_glass: boolean = false
}

export class FrontPaymentInfo {
    min_deposit: number = 10
    gateways: FrontPaymentInfoGateway[] = simpleGateways()
}

export class FrontPaymentInfoGateway {
    type: string = ""
    enable: boolean = false
    url: string = ""
    pid: string = ""
    secret: string = ""
    callback_host: string = ""
    fee_ratio = 0
}

export function simpleGateways() {
    const epay = new FrontPaymentInfoGateway()
    epay.type = "epay"
    const epusdt = new FrontPaymentInfoGateway()
    epusdt.type = "epusdt"
    const cyber = new FrontPaymentInfoGateway()
    cyber.type = "cyber"
    return [epay, epusdt, cyber]
}

export class FrontForwardConfig {
    dest_policy: string = ""
    dest: string[] = []
    proxy_protocol: number | undefined
    speed_limit: number = 0
}

export function parseFrontForwardConfig(s: string): FrontForwardConfig {
    return ignoreError(() => JSON.parse(s), new FrontForwardConfig())
}

export const DeviceGroupType = {
    AgentOnly: "DeviceGroupType_AgentOnly",
    Inbound: "DeviceGroupType_Inbound",
    OutboundBySite: "DeviceGroupType_OutboundBySite",
    OutboundByUser: "DeviceGroupType_OutboundByUser"
}

export const DeviceGroupType_AdminCanAdd = {
    AgentOnly: "DeviceGroupType_AgentOnly",
    Inbound: "DeviceGroupType_Inbound",
    OutboundBySite: "DeviceGroupType_OutboundBySite",
}

export const PlanType = {
    TrafficPack: "PlanType_TrafficPack",
    TrafficPack_CanStacked: "PlanType_TrafficPack_CanStacked",
    Month: "PlanType_Month",
    Day: "PlanType_Day",
}

export const SelectorType = {
    random: "random",
    round: "round",
    ip_hash: "ip_hash",
    least_load: "least_load",
}

export const OrderStatus = {
    Open: "OrderStatus_Open",
    Closed: "OrderStatus_Closed",
    Finished: "OrderStatus_Finished",
}

export const OrderType = {
    DepositToBalance: "OrderType_DepositToBalance",
    PurchaseByBalance: "OrderType_PurchaseByBalance",
    Accounting: "OrderType_Accounting",
}

const ConstTextMap = {
    "DeviceGroupType_AgentOnly": "仅监控",
    "DeviceGroupType_Inbound": "入口",
    "DeviceGroupType_OutboundBySite": "出口",
    "DeviceGroupType_OutboundByUser": "单端出口",
    "ForwardRuleStatus_Unsync": "未同步",
    "ForwardRuleStatus_Normal": "正常",
    "ForwardRuleStatus_Failed": "同步失败",
    "ForwardRuleStatus_Disabled": "已禁用",
    "PlanType_TrafficPack": "不限时流量包",
    "PlanType_TrafficPack_CanStacked": "不限时流量包（可叠加）",
    "PlanType_Month": "月付",
    "PlanType_Day": "日付",
    "OrderType_DepositToBalance": "充值到余额",
    "OrderType_PurchaseByBalance": "余额消费",
    "OrderType_Accounting": "手动记账",
    "OrderStatus_Open": "待支付",
    "OrderStatus_Closed": "交易关闭",
    "OrderStatus_Finished": "交易完成",
    // 负载均衡类型
    random: "随机",
    round: "轮询",
    ip_hash: "ip_hash",
    least_load: "最小连接数",
}

export function translateBackendString(str: any, def?: string): string {
    if (def == null) def = ""
    return ignoreError(() => (ConstTextMap as any)[str], def)
}

export function translatePlanType(obj: any): string {
    if (!obj.multiple) {
        obj.multiple = 1;
    }
    switch (obj.type) {
        case PlanType.Day:
            return `${obj.multiple} 日付`
        case PlanType.Month:
            return `${obj.multiple} 月付`
        default:
            return translateBackendString(obj.type)
    }
}
