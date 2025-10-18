import { Flex, Tag, Tooltip } from "antd"

export function DeviceGroupWidget(props: { prefix?: string, showId?: boolean, data: any }) {
    if (props.data == null) return null;
    return (
        <Flex gap={4} style={{ flexWrap: 'nowrap', width: 'max-content' }}>
            <Tooltip title={"#" + props.data.id}>
                <span style={{ whiteSpace: 'nowrap' }}>
                    {props.prefix ?? ''}{props.data.name}
                </span>
            </Tooltip>
            {props.showId ? <Tag color="cyan">#{props.data.id}</Tag> : null}
            {props.data.dispay_warning && (
                <Tag color="red">{props.data.dispay_warning}</Tag>
            )}
            {props.data.dispay_type && (
                <Tag color="blue">{props.data.dispay_type}</Tag>
            )}
            <Tag color="green">倍率 {props.data.ratio ?? 0}</Tag>
        </Flex>
    )
}

