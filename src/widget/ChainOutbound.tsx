import React, { useState, useCallback } from 'react';
import { Select, Button, Switch, Space, Typography, Card, Tooltip, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import type { CSSProperties } from 'react';
import { renderSelectIdName } from '../util/ui';

const { Text } = Typography;

// 1. 定义跳数限制
const MAX_CHAIN_HOPS = 3;
const MIN_CHAIN_HOPS_FOR_SUBMIT = 2;

// 对应后端数据结构类型
export interface ChainHop {
    gid: number | undefined;
    mux: boolean;
}

interface OutboundOption {
    id: number;
    name: string;
}

interface ChainOutboundEditorProps {
    value: ChainHop[];
    outbounds: OutboundOption[];
    title: string;
    onChange: (newChain: ChainHop[]) => void;
}

const getDefaultHop = (): ChainHop => ({
    gid: undefined,
    mux: false,
});

const nowrapStyle: CSSProperties = { whiteSpace: 'nowrap' };

export const ChainOutboundEditor: React.FC<ChainOutboundEditorProps> = ({ value = [], onChange, outbounds, title }) => {
    const chain = value ?? [];
    const currentHopsCount = chain.length;

    const handleOutboundChange = useCallback((index: number, groupId: number) => {
        const newChain = [...chain];
        newChain[index] = { ...newChain[index], gid: groupId };
        onChange(newChain);
    }, [chain, onChange]);

    const handleMuxChange = useCallback((index: number, checked: boolean) => {
        const newChain = [...chain];
        newChain[index] = { ...newChain[index], mux: checked };
        onChange(newChain);
    }, [chain, onChange]);

    const handleAddHop = useCallback(() => {
        if (currentHopsCount < MAX_CHAIN_HOPS) {
            const newChain = [...chain, getDefaultHop()];
            onChange(newChain);
        }
    }, [chain, currentHopsCount, onChange]);

    const handleRemoveHop = useCallback((index: number) => {
        const newChain = chain.filter((_, i) => i !== index);
        onChange(newChain);
    }, [chain, onChange]);

    const canAddHop = currentHopsCount < MAX_CHAIN_HOPS;

    return (
        <Card
            title={title}
            size="small"
            style={{ border: '1px solid #d9d9d9', marginBottom: 16 }}
        >
            {chain.length === 0 ? (
                <Text type="secondary">当前没有配置任何出口链，请点击“添加跳数”按钮。</Text>
            ) : (
                chain.map((hop, index) => {
                    const isLastHop = index === chain.length - 1;
                    const nextHopIndex = index + 2; // 用于 UI 提示，例如 1 -> 2

                    return (
                        <div
                            key={index}
                            style={{
                                marginBottom: isLastHop ? 8 : 24,
                                paddingBottom: isLastHop ? 0 : 16,
                                borderBottom: isLastHop ? 'none' : '1px dashed #f0f0f0'
                            }}
                        >
                            {/* 顶部控制行：步骤号、Mux开关、删除按钮 */}
                            <Space
                                style={{ display: 'flex', marginBottom: 8, alignItems: 'center', justifyContent: 'space-between' }}
                                align="start"
                            >
                                {/* 左侧：步骤序号 */}
                                <Text style={nowrapStyle}>
                                    第 {index + 1} 跳:
                                </Text>

                                {/* 右侧：Mux开关 和 删除按钮 */}
                                <Space align="center">
                                    {!isLastHop ? (
                                        <>
                                            <Text style={{ marginLeft: 4 }}>
                                                {index + 1} → {nextHopIndex}
                                            </Text>

                                            <Switch
                                                checkedChildren="Mux: 开"
                                                unCheckedChildren="Mux: 关"
                                                checked={hop.mux}
                                                onChange={(checked) => handleMuxChange(index, checked)}
                                                style={nowrapStyle}
                                            />
                                        </>
                                    ) : (
                                        // 最后一跳的占位符/提示
                                        <Text type="secondary" style={nowrapStyle}>
                                            (最后一跳)
                                        </Text>
                                    )}

                                    {/* 删除跳数 */}
                                    <Tooltip title="删除此跳">
                                        <MinusCircleOutlined
                                            onClick={() => handleRemoveHop(index)}
                                            style={{ color: 'red', cursor: 'pointer', marginLeft: 8 }}
                                        />
                                    </Tooltip>
                                </Space>
                            </Space>

                            {/* 独立一行：选择出口 (gid) */}
                            <Select
                                placeholder="请选择出口"
                                style={{ width: '100%' }} // 占据整行
                                value={hop.gid}
                                onChange={(value) => handleOutboundChange(index, value as number)}
                                status={hop.gid === undefined ? 'error' : undefined}
                                options={renderSelectIdName(outbounds, 'name', true)}
                            />
                        </div>
                    );
                })
            )}

            {/* 添加跳数 */}
            <Button
                type="dashed"
                onClick={handleAddHop}
                block
                icon={<PlusOutlined />}
                disabled={!canAddHop}
                style={{ marginTop: 16 }}
            >
                添加跳数 ({currentHopsCount} / {MAX_CHAIN_HOPS})
            </Button>

            {/* 提示信息 */}
            {!canAddHop && (
                <Text type="warning">已达到最大跳数限制 ({MAX_CHAIN_HOPS} 跳)。</Text>
            )}
        </Card>
    );
};

export const checkChain = (currentChain: ChainHop[]) => {
    // 1. 最小跳数检查
    if (currentChain.length < MIN_CHAIN_HOPS_FOR_SUBMIT) {
        message.error(`链式出口至少需要 ${MIN_CHAIN_HOPS_FOR_SUBMIT} 跳才能生效。`);
        return; // 阻止提交
    }

    // 2. 检查是否存在未选择 gid 的跳
    const hasUnselectedHop = currentChain.some(hop => hop.gid === undefined);
    if (hasUnselectedHop) {
        message.error('所有配置的跳数都必须选择一个出口。');
        return; // 阻止提交
    }

    // 3. 防回环/重复检查
    const groupIds = currentChain.map(hop => hop.gid);
    const uniqueGroupIds = new Set(groupIds);

    if (groupIds.length !== uniqueGroupIds.size) {
        message.error('链中存在重复的出口，请检查配置以防止回环。');
        return; // 阻止提交
    }

    return true;
};


/**
 * 状态管理包装器：用于在外部 React 根中管理 ChainOutboundEditor 的状态。
 */
export const StatefulOutboundEditorWrapper: React.FC<{
    title: string;
    initialChain: ChainHop[];
    outbounds: OutboundOption[];
    onChange: (newChain: ChainHop[]) => void;
}> = ({ title, initialChain, outbounds, onChange }) => {
    const [chain, setChain] = useState<ChainHop[]>(initialChain ?? []);

    const handleChainChange = useCallback((newChain: ChainHop[]) => {
        setChain(newChain);
        onChange(newChain);
    }, [onChange]);

    return (
        <ChainOutboundEditor
            title={title}
            value={chain} // 绑定到 React State
            onChange={handleChainChange} // 绑定到 State 更新函数
            outbounds={outbounds}
        />
    );
};
