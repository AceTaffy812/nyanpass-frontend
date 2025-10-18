import { useState, useImperativeHandle, forwardRef, useMemo } from "react";
import { Select, Radio, Space, Typography, Collapse, Flex, Card } from "antd";
import type { SelectProps } from "antd";
import { MyQuestionMark } from "./MyQuestionMark";

const { Text } = Typography;
const { Panel } = Collapse;

export type UserNotificationSetting = {
    uid?: number;
    msg_type: string;
    channel: number; // 0 Telegram, 1 Email, ...
    mode: number; // 0 不接收, 1 白名单, 2 黑名单
    list: string; // 逗号分隔
};

export type UserNotificationSettingsEditorRef = {
    getSettings: () => UserNotificationSetting[];
};

type Props = {
    initialSettings?: UserNotificationSetting[];
    availableMsgTypes: SelectProps["options"];
    availableChannels: SelectProps["options"];
};

// 定义统一的配置结构
type MsgTypeConfig = {
    label: string;
    haveList: boolean;
    tooltip: string;
};

const UserNotificationSettingsEditor = forwardRef<UserNotificationSettingsEditorRef, Props>(
    ({ initialSettings = [], availableMsgTypes, availableChannels }, ref) => {

        // 统一创建消息类型配置 Map
        const msgTypeConfigMap: Record<string, MsgTypeConfig> = useMemo(() => {
            const map: Record<string, MsgTypeConfig> = {};

            availableMsgTypes?.forEach(option => {
                const value = String(option.value);
                const config: MsgTypeConfig = {
                    label: String(option.label || value),
                    haveList: (option as any).haveList === true,
                    tooltip: String((option as any).helpMsg || ''),
                };
                map[value] = config;
            });
            return map;
        }, [availableMsgTypes]);

        // ... [略：initByChannel 保持不变，但依赖于 msgTypeConfigMap 来获取所有 msgType keys] ...
        const initByChannel = useMemo(() => {
            const allMsgTypes = Object.keys(msgTypeConfigMap);
            const map: Record<number, Record<string, { mode: number; list: string[] }>> = {};

            for (const c of availableChannels!!.map(c => Number(c.value))) {
                map[c] = {};
                for (const msgType of allMsgTypes) {
                    map[c][msgType] = {
                        mode: 0,
                        list: [],
                    };
                }
            }

            for (const s of initialSettings) {
                const ch = s.channel;
                const msg_type = s.msg_type;
                if (map[ch] && map[ch][msg_type]) {
                    map[ch][msg_type] = {
                        mode: s.mode,
                        list: s.list ? s.list.split(",").map(v => v.trim()).filter(v => v !== "") : [],
                    };
                }
            }
            return map;
        }, [initialSettings, availableChannels, msgTypeConfigMap]); // 依赖更新

        const [rows, setRows] = useState(initByChannel);

        const handleModeChange = (channel: number, msgType: string, mode: number) => {
            const config = msgTypeConfigMap[msgType];
            const shouldHaveList = config?.haveList;

            // 修正：如果切换到 mode=1 或 mode=2 但 haveList 为 false，则 list 应该清空
            const currentList = rows[channel][msgType].list;
            const newList = !shouldHaveList && (mode === 1 || mode === 2) ? [] : currentList;

            setRows(prev => ({
                ...prev,
                [channel]: {
                    ...prev[channel],
                    [msgType]: {
                        ...prev[channel][msgType],
                        mode,
                        list: newList,
                    }
                },
            }));
        };

        const handleListChange = (channel: number, msgType: string, list: string[]) => {
            setRows(prev => ({
                ...prev,
                [channel]: { ...prev[channel], [msgType]: { ...prev[channel][msgType], list } },
            }));
        };

        // 暴露给父组件
        useImperativeHandle(ref, () => ({
            getSettings: () => {
                const out: UserNotificationSetting[] = [];
                for (const [channel, msgMap] of Object.entries(rows)) {
                    for (const [msg_type, conf] of Object.entries(msgMap)) {
                        const shouldHaveList = msgTypeConfigMap[msg_type]?.haveList;

                        out.push({
                            channel: Number(channel),
                            msg_type,
                            mode: conf.mode,
                            // 修正 List 提交逻辑：如果 haveList 为 false，无论 mode 是多少，list 字段都应提交空字符串
                            list: shouldHaveList && (conf.mode === 1 || conf.mode === 2)
                                ? conf.list.join(",")
                                : "",
                        });
                    }
                }
                return out;
            },
        }));

        const allAvailableMsgTypes = useMemo(() => Object.keys(msgTypeConfigMap), [msgTypeConfigMap]);


        return (
            <Space direction="vertical" style={{ width: "100%" }}>
                <Collapse>
                    {availableChannels!!.map((ch) => {
                        const channelValue = Number(ch.value);
                        const chRows = rows[channelValue] || {};

                        return (
                            <Panel
                                key={ch.value as any}
                                header={`通道: ${ch.label}`}
                            >
                                <Flex vertical>
                                    {allAvailableMsgTypes.length === 0 ? (
                                        <Text type="secondary">无可用消息类型</Text>
                                    ) : (
                                        allAvailableMsgTypes.map(mt => {
                                            const conf = chRows[mt];
                                            const config = msgTypeConfigMap[mt]; // 获取统一配置
                                            if (!config) return null; // 安全检查

                                            // 动态 List placeholder 
                                            const listPlaceholder = conf?.mode === 1
                                                ? "输入白名单列表 (逗号分隔)"
                                                : conf?.mode === 2
                                                    ? "输入黑名单列表 (逗号分隔)"
                                                    : "选择模式后设置名单";

                                            // 动态模式按钮文本 
                                            const receiveModeText = config.haveList ? "黑名单" : "接收";

                                            // 是否显示 List 输入框的条件 
                                            const showListInput = config.haveList && (conf?.mode === 1 || conf?.mode === 2);

                                            return (
                                                <Card title={<Text strong>
                                                    {config.label}
                                                    <MyQuestionMark title={config.tooltip} />
                                                </Text>} size="small" >
                                                    <Space direction="vertical" style={{ width: "100%" }}>
                                                        {/* 模式设置 */}
                                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                            <Text style={{ minWidth: 60 }}>模式</Text>
                                                            <Radio.Group
                                                                value={conf?.mode ?? 0}
                                                                onChange={(e) => handleModeChange(channelValue, mt, e.target.value)}
                                                                optionType="button"
                                                                buttonStyle="solid"
                                                            >
                                                                <Radio.Button value={0}>不接收</Radio.Button>

                                                                {/* 白名单按钮：仅当 haveList 为 true 时显示/可用 */}
                                                                {config.haveList && (
                                                                    <Radio.Button value={1}>白名单</Radio.Button>
                                                                )}

                                                                {/* 接收/黑名单按钮：根据 haveList 动态显示文本 */}
                                                                <Radio.Button value={2}>{receiveModeText}</Radio.Button>
                                                            </Radio.Group>
                                                        </div>

                                                        {/* List 设置：仅当 showListInput 为 true 时显示 */}
                                                        {showListInput && (
                                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                                <Text style={{ minWidth: 60 }}>List</Text>
                                                                <Select
                                                                    mode="tags"
                                                                    tokenSeparators={[","]}
                                                                    placeholder={listPlaceholder}
                                                                    value={conf?.list ?? []}
                                                                    onChange={(vals) => handleListChange(channelValue, mt, vals as string[])}
                                                                    style={{ minWidth: 360 }}
                                                                />
                                                            </div>
                                                        )}
                                                    </Space>
                                                </Card>
                                            );
                                        })
                                    )}
                                </Flex>
                            </Panel>
                        );
                    })}
                </Collapse>
            </Space>
        );
    }
);

UserNotificationSettingsEditor.displayName = "UserNotificationSettingsEditor";

export default UserNotificationSettingsEditor;