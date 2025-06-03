import { Typography, theme } from 'antd';
import React from 'react';


export default function MySyntaxHighlighter(props: { children: React.ReactNode }): JSX.Element {
    // const { token } = theme.useToken();
    return (
        <Typography.Paragraph style={{ margin: 0 }}>
            <pre style={{
                // backgroundColor: token.colorBgContainer,
                // color: token.colorText,
                // padding: 16,
                // borderRadius: 4,
                fontFamily: 'monospace',
                // fontSize: 14,
                whiteSpace: 'pre',
                overflow: 'auto',
            }}>
                <code>{props.children}</code>
            </pre>
        </Typography.Paragraph>
    );
}
