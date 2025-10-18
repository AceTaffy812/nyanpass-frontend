import React, { useState, useEffect, useRef } from 'react';
import { Card, Flex, Typography, Input, Switch, Button } from 'antd';
import { api } from '../api/api';
import { showCommonError } from '../util/commonError';
import { asyncFetchJson, promiseFetchJson } from '../util/fetch';
import { cleanupDefaultValue, tryParseJSONObject } from '../util/misc';
import AsyncButton from '../widget/AsyncButton';
import { MyQuestionMark } from '../widget/MyQuestionMark';

// 对应的后端结构 TypeScript 接口 (采用小写 snake_case 命名)
class TelegramConfig {
    enable: boolean = false;
    token: string = "";
    webhook_url: string = "";
}

// KV 存储的键名
const TELEGRAM_KV_KEY = "telegram-bot-config";

export function AdminPushChannelConfigView(props: {}) {

    // === 独立的表单状态 (用于驱动 Input/Switch) ===
    const [telegramEnable, setTelegramEnable] = useState<boolean>(false);
    const [telegramToken, setTelegramToken] = useState<string>("");
    const [telegramWebhookURL, setTelegramWebhookURL] = useState<string>("");

    // 初始加载状态
    const [loading, setLoading] = useState<boolean>(true);
    const mounted = useRef(false);

    // 1. 初始加载配置 (Telegram)
    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            setLoading(true);

            // 加载 Telegram 配置
            asyncFetchJson(api.guest.kv(TELEGRAM_KV_KEY, "admin"), (ret) => {
                const fetchedConfig = tryParseJSONObject(ret.data) as TelegramConfig ?? new TelegramConfig();

                // 同步到表单状态
                setTelegramEnable(fetchedConfig.enable ?? false);
                setTelegramToken(fetchedConfig.token ?? "");
                setTelegramWebhookURL(fetchedConfig.webhook_url ?? "");

                setLoading(false);
            });
        }
    }, []);

    // 2. Webhook URL 自动填充函数
    const handleAutoFillWebhook = () => {
        // 使用 window.location.origin 获取当前页面的协议、域名和端口
        const origin = window.location.origin;
        const newWebhookURL = `${origin}/api/v1/guest/telegram/webhook`;
        setTelegramWebhookURL(newWebhookURL);
    };

    // 3. 保存 Telegram 配置的函数
    function btn_save_telegram_config_onclick() {
        const newConfig: TelegramConfig = {
            enable: telegramEnable,
            token: telegramToken.trim(),
            webhook_url: telegramWebhookURL.trim(),
        };

        cleanupDefaultValue(newConfig);

        return promiseFetchJson(api.admin.kv_put(TELEGRAM_KV_KEY, JSON.stringify(newConfig)), (ret) => {
            showCommonError(ret, ["保存成功", "保存失败"]);
        });
    }

    if (loading) {
        return <Card title="推送通道配置概览">加载中...</Card>;
    }

    return (
        <Flex vertical gap="middle">
            <Card title={
                <Typography.Text strong>
                    Telegram Bot 推送通道
                    <MyQuestionMark title="测试方法：向您的 Telegram Bot 发送 /bind 消息，若设置成功会有回复。若不成功，请看面板日志排除故障。" />
                </Typography.Text>
            }>
                <Flex vertical>
                    {/* Enable 开关 */}
                    <Flex className='neko-settings-flex-line'>
                        <Typography.Text className='dq-1'>启用 Telegram Bot</Typography.Text>
                        <div className='dq-2'>
                            <Switch checked={telegramEnable} onChange={setTelegramEnable} />
                        </div>
                    </Flex>

                    {/* Token 输入框 */}
                    <Flex className='neko-settings-flex-line'>
                        <Typography.Text className='dq-1'>Bot Token</Typography.Text>
                        <Input
                            className='dq-2'
                            value={telegramToken}
                            onChange={(e) => setTelegramToken(e.target.value)}
                            placeholder="请输入 Bot 的 Token"
                            disabled={!telegramEnable}
                        />
                    </Flex>

                    {/* WebhookURL 输入框及自动填充按钮 */}
                    <Flex className='neko-settings-flex-line'>
                        <Typography.Text className='dq-1'>
                            Webhook URL
                            <MyQuestionMark title="可选设置，不填则用 Poller 模式拉取信息。" />
                        </Typography.Text>

                        <Input.Group compact className='dq-2'>
                            <Input
                                style={{ width: 'calc(100% - 100px)' }} // 留出按钮空间
                                value={telegramWebhookURL}
                                onChange={(e) => setTelegramWebhookURL(e.target.value)}
                                disabled={!telegramEnable}
                            />
                            <Button
                                style={{ width: '100px' }}
                                onClick={handleAutoFillWebhook}
                                disabled={!telegramEnable}
                            >
                                自动填充
                            </Button>
                        </Input.Group>
                    </Flex>
                </Flex>

                {/* 保存按钮 */}
                <AsyncButton
                    type="primary"
                    style={{ margin: "1em 0 0 0", float: 'right' }}
                    onClick={btn_save_telegram_config_onclick}
                >保存</AsyncButton>
            </Card>
        </Flex>
    );
}