import { isNotBlank } from "../util/misc"
import { MyModal } from "../util/MyModal"
import { Flex, Typography } from "antd"

export interface ConntectData {
    connect_host: string
    port_range: string
    display_name: string
}

export function IPPortWidget(props: { data: ConntectData, canOnlyPort?: boolean }) {
    if (props.data == null) {
        return <></>
    }
    if (props.data.connect_host == null) {
        if (props.canOnlyPort) {
            return <Typography.Text>端口: {props.data.port_range}</Typography.Text>
        }
        return <></>
    }
    let port_range = props.data.port_range
    if (isNotBlank(port_range)) {
        port_range = ":" + port_range
    } else {
        port_range = ""
    }
    const hosts = props.data.connect_host.trim().split("\n")
    if (hosts.length == 0) {
        return <></>
    } else if (hosts.length == 1) {
        return <Typography.Text>{hosts[0]}{port_range}</Typography.Text>
    }
    //
    function showAllAddr() {
        const ps = new Array;
        hosts.forEach(host => {
            ps.push(<p>{host}{port_range}</p>)
        })
        MyModal.info({
            title: props.data.display_name,
            content: <div>{ps}</div>
        })
    }
    return (
        <Flex style={{ flexWrap: "nowrap" }}>
            <Typography.Text>端口: {props.data.port_range}</Typography.Text>
            <a onClick={showAllAddr}>{hosts.length} 个地址</a>
        </Flex>
    );
}
