import { ConfigProvider, theme, ThemeConfig } from "antd";
import React from "react";
import ReactDOM from "react-dom/client";
import zhCN from 'antd/es/locale/zh_CN';
import { myvar } from "../myvar";

export function MyConfigProvider(props: { children: React.ReactNode, isDarkMode: boolean, isTransparentMode: boolean }) {
    const { defaultAlgorithm, darkAlgorithm } = theme;
    let t: ThemeConfig = {
        algorithm: props.isDarkMode ? darkAlgorithm : defaultAlgorithm,
        inherit: false,
    }
    if (props.isTransparentMode) {
        // const defaultTokens = getDesignToken({ algorithm: defaultAlgorithm });
        t.token = {
            // colorBgContainer: props.isDarkMode ? "rgba(255,255,255,0.1)" : 'transparent',
            colorBorder: props.isDarkMode ? "rgba(255, 255, 255, 0.2)" : 'rgba(0, 0, 0, 0.2)',
            colorBgContainer: "transparent",
            colorBgLayout: props.isDarkMode ? "rgba(0,0,0,0.5)" : 'rgba(255,255,255,0.2)',
            // colorBgElevated: 'transparent',
            // colorBgTextActive: 'transparent',
            // colorBgContainerDisabled: 'transparent',
            // colorBgMask: 'transparent',
            // colorBgTextHover: 'transparent',
            // colorBgBlur: 'transparent',
            // colorBgSpotlight: 'transparent',
        }
        t.components = {
            Layout: {
                siderBg: props.isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                // colorBgLayout: 'transparent',
            },
            Table: {
                filterDropdownBg: props.isDarkMode ? 'black' : 'white',
            },
        }
    }
    return <ConfigProvider
        theme={t}
        locale={zhCN}>
        {props.children}
    </ConfigProvider>
}

export function render2Node(children: React.ReactNode, root: Element) {
    let nya = (root as any).react_root_nya
    if (nya == null) {
        nya = ReactDOM.createRoot(root);
        (root as any).react_root_nya = nya
    }
    // 对话框不采用透明
    nya.render(<MyConfigProvider isDarkMode={myvar.isDarkMode} isTransparentMode={false}>
        {children}
    </MyConfigProvider>);
}
