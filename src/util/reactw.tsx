import { ConfigProvider, theme } from "antd";
import React from "react";
import ReactDOM from "react-dom/client";
import zhCN from 'antd/locale/zh_CN';
import { myvar } from "../myvar";

export function MyConfigProvider(props: { children: React.ReactNode, isDarkMode: boolean }) {
    const { defaultAlgorithm, darkAlgorithm } = theme;
    return <ConfigProvider
        theme={{
            algorithm: props.isDarkMode ? darkAlgorithm : defaultAlgorithm,
            token: {
                // Seed Token，影响范围大
                // colorPrimary: Colors.Teal.Z500,
            },
        }}
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
    nya.render(<MyConfigProvider isDarkMode={myvar.isDarkMode}>
        {children}
    </MyConfigProvider>);
}
