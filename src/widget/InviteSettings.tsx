import { useEffect, useState } from "react";
import { FrontInviteConfig } from "../api/model_front"
import { Flex, InputNumber, Switch, Tooltip, Typography } from "antd"

export var editingInviteSettings = new FrontInviteConfig();

export function InviteSettings(props: { data: FrontInviteConfig }) {
    const [enable, set_enable] = useState(false);
    const [cycle, set_cycle] = useState(false);
    const [force_bind_tg, set_force_bind_tg] = useState(false);
    const [commission_rate, set_commission_rate] = useState("0");
    useEffect(() => {
        set_enable(props.data.enable)
        set_cycle(props.data.cycle)
        set_force_bind_tg(props.data.force_bind_telegram)
        set_commission_rate(props.data.commission_rate)
    }, [JSON.stringify(props)])
    useEffect(() => { editingInviteSettings.enable = enable }, [enable])
    useEffect(() => { editingInviteSettings.cycle = cycle }, [cycle])
    useEffect(() => { editingInviteSettings.force_bind_telegram = force_bind_tg }, [force_bind_tg])
    useEffect(() => { editingInviteSettings.commission_rate = commission_rate }, [commission_rate])
    return (
        <Flex vertical>
            <Flex className='neko-settings-flex-line'>
                <Typography.Text style={{ flex: 1 }} strong>启用邀请注册</Typography.Text>
                <Switch checked={enable} onChange={(e) => set_enable(e)} />
            </Flex>
            <Flex className='neko-settings-flex-line'>
                <Tooltip title="开启后，被邀请者每次购买套餐都会产生佣金。否则只有新购才返佣。">
                    <Typography.Text style={{ flex: 1 }} strong >循环返佣 (?)</Typography.Text>
                </Tooltip>
                <Switch checked={cycle} onChange={(e) => set_cycle(e)} />
            </Flex>
            <Flex className='neko-settings-flex-line'>
                <Tooltip title="开启后，被邀请者第一次购买套餐需要绑定 Telegram。购买时绑定的Telegram ID 可以在邀请记录中查看。">
                    <Typography.Text style={{ flex: 1 }} strong >强制绑定 Telegram (?)</Typography.Text>
                </Tooltip>
                <Switch checked={force_bind_tg} onChange={(e) => set_force_bind_tg(e)} />
            </Flex>
            <Flex className='neko-settings-flex-line'>
                <Typography.Text strong>返佣比例 (1% 的佣金，就填 0.01)</Typography.Text>
                <InputNumber style={{ width: "100%" }}
                    min={"0"}
                    step={0.01}
                    value={commission_rate}
                    onChange={(e) => set_commission_rate(e!)} />
            </Flex>
        </Flex>
    );
}
