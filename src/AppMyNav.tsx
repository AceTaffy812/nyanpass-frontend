import { NavigateFunction } from "react-router-dom";
import { ignoreError } from "./util/promise";
import { AimOutlined, CloudServerOutlined, DashboardOutlined, DesktopOutlined, HomeOutlined, OrderedListOutlined, RedEnvelopeOutlined, SettingOutlined, ShoppingOutlined, TagsOutlined, TeamOutlined, TransactionOutlined, UnorderedListOutlined, UserOutlined } from "@ant-design/icons";

export function myNavFactory(nav: NavigateFunction, setBreadTitle: (t: string) => void, callback: () => void) {
    return function (to: string, onlyUpdateTitle?: boolean) {
        if (!onlyUpdateTitle) {
            nav(to)
            callback()
        }
        var title = ignoreError(() => myNavMap[to][0], null)
        if (title == null) {
            setBreadTitle("主页")
        } else {
            setBreadTitle(title)
        }
    }
}

export const myNavMap: any = {
    "/": ["主页", <HomeOutlined />],
    "/login": ["登录或注册"],
    "/userinfo": ["个人中心", <UserOutlined />],
    "/forward_rules": ["转发规则", <UnorderedListOutlined />],
    "/device_group": ["单端隧道", <DesktopOutlined />],
    "/shop": ["商城", <ShoppingOutlined />],
    "/orders": ["我的订单", < TransactionOutlined />],
    "/looking_glass": ["LookingGlass", < AimOutlined />],
    "/admin/main": ["管理/仪表盘", <DashboardOutlined />],
    "/admin/settings": ["管理/站点设置", <SettingOutlined />],
    "/admin/users": ["管理/用户管理", <UserOutlined />],
    "/admin/user_group": ["管理/用户组管理", <TeamOutlined />],
    "/admin/orders": ["管理/订单管理", <OrderedListOutlined />],
    "/admin/device_group": ["管理/设备组管理", <CloudServerOutlined />],
    "/admin/plans": ["管理/套餐管理", <TagsOutlined />],
    "/admin/afflog": ["管理/邀请记录", <RedEnvelopeOutlined />],
    "/admin/redeem": ["管理/兑换码管理", <TagsOutlined />],
}

export function getItem(nav: (a: string) => void, prefix: string, to: string) {
    let my: any[] = myNavMap[to]
    let ls = my[0].split("/")
    return {
        key: prefix + to,
        label: ls[ls.length - 1],
        icon: ignoreError(() => my[1], undefined),
        onClick: () => { nav(to) }
    }
}
