import { parseFrontForwardConfig } from "../api/model_front"
import { ignoreError } from "./promise"
import { txtWithColor } from "./ui"

export function formatInfoTraffic(info: any, withUnit?: boolean) {
    if (info == null) {
        return "null"
    }
    const unit = "GB"
    const displayUnit = withUnit ? " GiB" : ""
    if (info.traffic_enable == null) {
        if (info.traffic_used == null) {
            // 直接是数字
            return byteConverter(ignoreError(() => info.traffic, 0), unit).toFixed(2) + displayUnit
        } else { // 转发规则只有已用
            return byteConverter(ignoreError(() => info.traffic_used, 0), unit).toFixed(2) + displayUnit
        }
    }
    let txt = (
        byteConverter(ignoreError(() => info.traffic_used, 0), unit).toFixed(2) + displayUnit
        + " / " +
        byteConverter(ignoreError(() => info.traffic_enable, 0), unit).toFixed(2) + displayUnit
    )
    if (info.traffic_used >= info.traffic_enable) {
        return txtWithColor(txt, "blueviolet")
    }
    return txt
}

export function formatUnix(ts: number, props?: {
    no1970?: boolean,
    color?: boolean,
}) {
    let txt = new Date(0).toLocaleString()
    let expired = false
    if (ts == 0 || ts == null) {
        if (props?.no1970) txt = "-";
        expired = true;
    } else {
        const now = new Date();
        expired = ts * 1000 < now.getTime()
        txt = new Date(ts * 1000).toLocaleString()
    }
    if (props?.color && expired) {
        return txtWithColor(txt, "blueviolet")
    }
    return txt
}

export function formatBoolean(b: boolean) {
    if (b) {
        return txtWithColor("是", "coral")
    } else {
        return "否"
    }
}

export function byteConverter(input: number | null, unit: string, invert?: boolean) {
    if (input == null) {
        return 0
    }
    if (invert) { // GB 转 B
        if (unit === "KB") return (input * 1024)
        else if (unit === "MB") return (input * 1024 * 1024)
        else if (unit === "GB") return (input * 1024 * 1024 * 1024)
        else if (unit === "kB") return (input * 1000)
        else if (unit === "M_Net") return (input * 125000)
        else if (unit === "MB_SI") return (input * 1000 * 1000)
        else if (unit === "GB_SI") return (input * 1000 * 1000 * 1000)
        else return input
    } else { // B 转 GB
        if (unit === "KB") return (input / 1024)
        else if (unit === "MB") return (input / 1024 / 1024)
        else if (unit === "Mb") return (input / 1024 / 1024) * 8
        else if (unit === "GB") return (input / 1024 / 1024 / 1024)
        else if (unit === "kB") return (input / 1000)
        else if (unit === "M_Net") return (input / 125000)
        else if (unit === "MB_SI") return (input / 1000 / 1000)
        else if (unit === "GB_SI") return (input / 1000 / 1000 / 1000)
        else return input
    }
}

export function currentTimestamp() {
    const d = new Date()
    return d.getTime()
}

export function formartDests(config: string) {
    return ignoreError(() => {
        const cfg = parseFrontForwardConfig(config)
        switch (cfg.dest.length) {
            case 0:
                return ""
            case 1:
                return cfg.dest[0]
            default:
                return cfg.dest[0] + " 等 " + cfg.dest.length + " 个地址"
        }
    })
}