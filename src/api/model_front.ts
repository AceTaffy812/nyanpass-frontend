import { ignoreError } from "../util/promise"

export class FrontSiteInfo {
    title: string = ""
    allow_register: boolean = false
    allow_single_tunnel: boolean = false
    allow_looking_glass: boolean = false
    register_policy: number = 0
    register_captcha_policy: number = 0
    diagnose_hide_ip: number = 0
}

export class FrontInviteConfig {
    enable = false;
    commission_rate = "0";
    cycle = false;
    force_bind_telegram = false;
}

export class FrontPaymentInfo {
    min_deposit: number = 10
    gateways: FrontPaymentInfoGateway[] = simpleGateways()
}

export class FrontPaymentInfoGateway {
    name: string = "" // 就是 gateway_name
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
    dest?: string[]
    dest_policy?: string
    accept_proxy_protocol?: number
    proxy_protocol?: number
    speed_limit?: number
    ip_limit?: number
    connection_limit?: number
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
    failover: "failover",
}

export const OrderType = {
    DepositToBalance: "OrderType_DepositToBalance",
    PurchaseByBalance: "OrderType_PurchaseByBalance",
    Accounting: "OrderType_Accounting",
}

export const OrderStatus = {
    Open: "OrderStatus_Open",
    Closed: "OrderStatus_Closed",
    Finished: "OrderStatus_Finished",
}

export const AffLogType = {
    Commission: "AffiliateLogType_Commission",
    Withdraw: "AffiliateLogType_Withdraw",
    Deposit: "AffiliateLogType_Deposit",
    Accounting: "AffiliateLogType_Accounting",
}

export const AffLogStatus = {
}

export const RegisterPolicy = [
    [0, "无限制"],
    [1, "不允许邀请注册"],
    [2, "仅开放邀请注册"],
]

export const RegisterCaptchaPolicy = [
    [0, "无"],
    [1, "交互认证"],
]

export const HideInServerStatus = [
    [0, "不隐藏"],
    [1, "对非管理员用户隐藏"],
    [2, "对所有用户隐藏"],
]

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
    "AffiliateLogType_Commission": "产生佣金",
    "AffiliateLogType_Withdraw": "佣金提现",
    "AffiliateLogType_Deposit": "佣金转余额",
    "AffiliateLogType_Accounting": "手动记账",
    // 落地的负载均衡类型
    random: "随机",
    round: "轮询",
    ip_hash: "ip_hash",
    least_load: "最小连接数",
    failover: "故障转移",
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
