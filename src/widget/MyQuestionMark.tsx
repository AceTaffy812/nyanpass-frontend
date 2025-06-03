import { QuestionCircleOutlined } from "@ant-design/icons"
import { Tooltip } from "antd";

export function MyQuestionMark(props: { title: React.ReactNode }) {
    return (
        <Tooltip title={props.title}><QuestionCircleOutlined style={{ marginLeft: 4, cursor: 'pointer' }} /></Tooltip>
    );
}
