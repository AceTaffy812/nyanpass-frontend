import { Button, Card, Flex, Input, Typography } from "antd";
import { translateBackendString } from "../api/model_front";
import { MyMessage, MyModal } from "./MyModal";
import MySyntaxHighlighter from "../widget/MySyntaxHighlither";
import { FilterDropdownProps } from "antd/es/table/interface";
import { ignoreError } from "./promise";
import { findObjByIdId } from "./misc";
import { DeviceGroupWidget } from "../widget/DeviceGroupWidget";

export var displayCurrency = "元"

export function txtWithColor(str: any, color: string) {
    let style: any = { color: color }
    if (color == "") style = null
    return <span style={style}>{str}</span>
}

export function renderP(str: any) {
    if (str == null) {
        return <></>
    }
    if (str instanceof Error) {
        str = str.message
    }
    if (typeof str != "string") {
        str = JSON.stringify(str)
    }
    const arr: JSX.Element[] = []
    str.split("\n").forEach((element: string) => {
        arr.push(<Typography.Text>{element}</Typography.Text>)
    })
    if (arr.length == 0) {
        return <></>
    } else if (arr.length == 1) {
        return arr[0]
    } else {
        return <Flex vertical>{arr}</Flex>
    }
}

// 选择、过滤

export function renderSelect4(dgList: any[]) {
    return renderSelect3(dgList, (id: number) => {
        let devWtf = findObjByIdId(dgList, id)
        if (devWtf != null) {
            return <DeviceGroupWidget data={devWtf} />
        }
        return "#" + id
    })
}

export function renderSelect3(arr: any[], render: (id: number) => React.ReactNode) {
    const ret = new Array();
    arr.forEach((element: any) => {
        ret.push({ value: element.id, label: render(element.id) })
    })
    return ret
}

export function renderSelectIdName(arr: any[], name?: string, showId?: boolean) {
    if (name == null) name = "name"
    const ret = new Array();
    arr.forEach((element: any) => {
        let label = element[name!]
        if (showId) label = label + " (#" + element.id + ")"
        ret.push({ value: element.id, label: label })
    })
    return ret
}

export function renderSelect(arr: any[]) {
    const ret = new Array();
    arr.forEach((element: any) => {
        ret.push({ value: element, label: element })
    })
    return ret
}

export function renderSelect2(arr: any[][]) {
    const ret = new Array();
    arr.forEach((element: any[]) => {
        ret.push({ value: element[0], label: element[1] })
    })
    return ret
}

export function renderSelectBackendString(obj: any) {
    const ret = new Array();
    Object.values(obj).forEach((element: any) => {
        ret.push({ value: element, label: translateBackendString(element) })
    })
    return ret
}

export function renderFilterBackendString(obj: any) {
    const ret = new Array();
    Object.values(obj).forEach((element: any) => {
        ret.push({ value: element, text: translateBackendString(element) })
    })
    return ret
}

export function renderFilterIdName(obj: any) {
    const ret = new Array();
    Object.values(obj).forEach((element: any) => {
        ret.push({ value: element.id, text: element.name })
    })
    return ret
}

export const filtersBoolean = [
    { value: true, text: "是" },
    { value: false, text: "否" },
]

// Clipboard

export function copyToClipboard(copyStr: string, successTip?: string) {
    if (successTip == null) successTip = "复制成功"
    if (navigator.clipboard == null) {
        MyModal.info({
            title: "您的浏览器不支持一键复制，请手动复制以下内容。",
            content: <MySyntaxHighlighter>{copyStr}</MySyntaxHighlighter>,
        })
        return
    }
    navigator.clipboard.writeText(copyStr).then(() => {
        MyMessage.info(successTip)
    }, () => {
        MyMessage.error("复制失败")
    });
}

// 表格

export const tableShowTotal = (total: any) => `共 ${total} 条`

export function tableSearchDropdown(title: string) {
    return (props: FilterDropdownProps) => <Card>
        <Flex vertical>
            <Typography.Text strong>{title}</Typography.Text>
            <Input onChange={e => props.setSelectedKeys(e.target.value ? [e.target.value] : [])} value={ignoreError(() => props.selectedKeys[0])} />
            <Flex>
                <Button onClick={() => {
                    props.confirm()
                }}>搜索
                </Button>
                <Button onClick={() => {
                    props.setSelectedKeys([])
                    props.confirm()
                }}>重置</Button>
            </Flex>
        </Flex>
    </Card>;
}

export function getPageSize(k: string): number {
    const ps = localStorage.getItem("pageSize-" + k)
    const psNumber = Number(ps)
    if (ps == null || isNaN(psNumber) || psNumber <= 0) {
        return 10
    }
    return psNumber
}

export function setPageSize(k: string, n: number) {
    if (isNaN(n) || n <= 0) {
        return
    }
    if (getPageSize(k) == n) {
        return
    }
    localStorage.setItem("pageSize-" + k, n.toString())
}
