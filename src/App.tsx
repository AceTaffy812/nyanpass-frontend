import { useEffect, useRef, useState } from 'react'
import { myvar } from './myvar';
import type { MenuProps } from 'antd';
import { App, Breadcrumb, Button, Card, Drawer, Dropdown, Flex, Layout, Menu, Tooltip } from 'antd';
import { ApiOutlined, BulbOutlined, LoginOutlined, LogoutOutlined, MenuOutlined, UserOutlined } from '@ant-design/icons';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { ignoreError } from './util/promise';
import { MainView } from './views/Main';
import { UserInfoView } from './views/UserInfo';
import { LoginView } from './views/Login';
import { ForwardRulesView } from './views/ForwardRules';
import { AdminSettingsView } from './views/AdminSettings';
import { getItem, myNavFactory } from './AppMyNav';
import { AdminUsersView } from './views/AdminUsers';
import { logout } from './AppApi';
import { FrontSiteInfo } from './api/model_front';
import { DeviceGroupsView } from './views/DeviceGroups';
import { MyMessage, setModalCtx } from './util/MyModal';
import { ShopView } from './views/Shop';
import { AdminPlansView } from './views/AdminPlans';
import { OrdersView, OrdersViewType } from './views/Orders';
import { LookingGlassView } from './views/LookingGlass';
import { AdminMainView } from './views/AdminMain';
import { Colors } from './material-color';
import { AdminUserGroupsView } from './views/AdminUserGroup';
import { AdminRedeemCode } from './views/AdminRedeemCode';

export function MyApp(props: { isDarkMode: boolean }) {
  const url = new URL(location as any)
  const isManageUser = url.searchParams.get("affect") != null
  const [userInfo, setUserInfo] = useState<any>(null);
  const [backendInfo, setBackendInfo] = useState<any>(null);
  const [siteInfo, setSiteInfo] = useState(new FrontSiteInfo());
  const [breadTitle, setBreadTitle] = useState("主页");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobileSize, setIsMobileSize] = useState(false);
  const mounted = useRef(false);
  const { modal, message } = App.useApp()
  setModalCtx(modal, message)
  const nav = myNavFactory(useNavigate(), setBreadTitle, () => setDrawerOpen(false))
  myvar.nav = nav

  // 刷新用户状态
  function notifyInfoChange() {
    try {
      myvar.siteInfo.then((info: any) => { setSiteInfo(info) })
    } catch (error) {
      console.log(error)
    }
    try {
      myvar.backendInfo.then((info: any) => { setBackendInfo(info) })
    } catch (error) {
      console.log(error)
    }
    try {
      myvar.userInfo.then((info: any) => {
        setUserInfo(info)
        if (info == null) nav("/login") // 滚去登录
      })
    } catch (error) {
      console.log(error)
    }
  }

  // 刷新时
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      console.log("app useEffect")
      // 全局监听大小变化
      function sizeUpdate() {
        const y = window.innerWidth < 800
        setIsMobileSize(y)
        myvar.isMobileSize = y
      }
      window.addEventListener("resize", sizeUpdate)
      sizeUpdate()
      setTimeout(sizeUpdate, 300);
      // 挂全局
      myvar.notifyInfoChange = notifyInfoChange
      notifyInfoChange()
      // 更新导航位置
      // TODO 更新 side 位置
      nav(location.hash.substring(1), true)
    }
  }, [])

  const renderNavMenu = () => {
    const navMenu: MenuProps['items'] = [
      getItem(nav, "side", "/"),
    ]
    // 只给登录用户显示
    if (userInfo != null) {
      navMenu.push(
        getItem(nav, "side", "/userinfo"),
        getItem(nav, "side", "/forward_rules"),
      )
      if (ignoreError(() => {
        return userInfo.allow_device || siteInfo.allow_single_tunnel
      })) {
        navMenu.push(getItem(nav, "side", "/device_group"))
      }
      navMenu.push(
        getItem(nav, "side", "/shop"),
        getItem(nav, "side", "/orders"),
      )
      if (ignoreError(() => siteInfo.allow_looking_glass)) {
        navMenu.push(getItem(nav, "side", "/looking_glass"))
      }
      navMenu.push({
        key: "tz", label: "节点状态 (旧)", icon: <ApiOutlined />, onClick: () => {
          if (myvar.nyanpass_config_ok) {
            if ((userInfo.admin && myvar.nyanpass_update_ok) || !userInfo.admin) {
              window.open("./tz.html", '_blank');
              return
            }
          }
          MyMessage.info("配置信息未就绪，请稍等待。")
        }
      })
      navMenu.push({
        key: "tz2", label: "节点状态 (新)", icon: <ApiOutlined />, onClick: () => {
          if (myvar.nyanpass_config_ok) {
            if ((userInfo.admin && myvar.nyanpass_update_ok) || !userInfo.admin) {
              window.open("./tz2.html", '_blank');
              return
            }
          }
          MyMessage.info("配置信息未就绪，请稍等待。")
        }
      })
    }
    // 只给管理员显示
    if (ignoreError(() => userInfo.admin)) {
      navMenu.push({
        key: "admin",
        label: `管理`,
        children: [
          getItem(nav, "side", "/admin/main"),
          getItem(nav, "side", "/admin/settings"),
          getItem(nav, "side", "/admin/users"),
          getItem(nav, "side", "/admin/user_group"),
          getItem(nav, "side", "/admin/orders"),
          getItem(nav, "side", "/admin/plans"),
          getItem(nav, "side", "/admin/redeem"),
          getItem(nav, "side", "/admin/device_group"),
          getItem(nav, "side", "/admin/afflog"),
        ]
      })
    }
    return navMenu
  }

  const renderUserMenu = () => {
    return [{
      key: 'loginORlogout',
      icon: userInfo == null ? <LoginOutlined /> : <LogoutOutlined />,
      label: <a>{userInfo == null ? "登录" : "退出"}</a>,
      onClick: () => { if (userInfo != null) { logout() } else { nav("/login") } },
    }]
  }

  const renderBreadCrumb = () => {
    const ts = breadTitle.split("/")
    const ret = []
    for (let i = 0; i < ts.length; i++) {
      ret.push({
        title: ts[i]
      })
    }
    return ret
  }

  return (
    <>
      <Layout.Header style={{ background: Colors.Teal.Z500 }} >
        <Flex style={{
          alignItems: "center",
          flexWrap: "nowrap",
          whiteSpace: "nowrap",
          height: "100%",
        }}>
          <h2 style={{ width: "100%" }}>{siteInfo?.title}</h2>
          <Dropdown.Button
            style={{ width: 'unset' }}
            menu={{ items: renderUserMenu() }} placement="bottom" icon={<UserOutlined />}
          > {userInfo == null ? "未登录" : userInfo.username}
          </Dropdown.Button>
          <Tooltip title={props.isDarkMode ? "开灯" : "关灯"}  >
            <Button onClick={myvar.toggleDarkMode} shape='circle' ><BulbOutlined /></Button>
          </Tooltip>
        </Flex>
      </Layout.Header>
      <Layout style={{ flexDirection: "row" }} >
        <Drawer
          title="导航菜单"
          closable={false}
          placement="left"
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}>
          <Menu
            mode="inline"
            style={{ height: '100%', borderRight: 0 }}
            defaultOpenKeys={["admin"]}
            items={renderNavMenu()}
          />
        </Drawer>
        <Layout.Sider
          style={{ height: '100%' }}
          hidden={isMobileSize || isManageUser}
        >
          <Menu
            mode="inline"
            style={{ height: '100%', borderRight: 0 }}
            defaultOpenKeys={["admin"]}
            items={renderNavMenu()}
          />
        </Layout.Sider>
        <Layout style={{ padding: '0 1em 1em', overflow: 'auto' }}>
          <Flex className='neko-settings-flex-line'>
            <Button
              style={isMobileSize && !isManageUser ? {} : { display: "none" }}
              onClick={() => setDrawerOpen(true)}
            ><MenuOutlined />菜单</Button>
            <Breadcrumb style={{ margin: '1em', flex: 'auto' }} items={renderBreadCrumb()} ></Breadcrumb>
          </Flex>
          <Layout.Content>
            <Card>
              <Routes>
                <Route path="/" element={<MainView siteInfo={siteInfo} backendInfo={backendInfo} userInfo={userInfo} />} />
                <Route path="/login" element={<LoginView reg={false} siteInfo={siteInfo} />} />
                <Route path="/token_login/:token" element={<LoginView reg={false} siteInfo={siteInfo} />} />
                <Route path="/register" element={<LoginView reg={true} siteInfo={siteInfo} />} />
                <Route path="/register/:inviter" element={<LoginView reg={true} siteInfo={siteInfo} />} />
                <Route path="/userinfo" element={<UserInfoView userInfo={userInfo} />} />
                <Route path="/device_group" element={<DeviceGroupsView isAdmin={false} adminShowUserOutbound={false} />} />
                <Route path="/forward_rules" element={<ForwardRulesView userInfo={userInfo} />} />
                <Route path="/shop" element={<ShopView userInfo={userInfo} />} />
                <Route path="/orders" element={<OrdersView type={OrdersViewType.UserOrder} />} />
                <Route path="/afflog" element={<OrdersView type={OrdersViewType.UserAffLog} />} />
                <Route path="/looking_glass" element={<LookingGlassView />} />
                <Route path="/admin/main" element={<AdminMainView />} />
                <Route path="/admin/settings" element={<AdminSettingsView userInfo={userInfo} siteInfo={siteInfo} />} />
                <Route path="/admin/users" element={<AdminUsersView />} />
                <Route path="/admin/user_group" element={<AdminUserGroupsView />} />
                <Route path="/admin/device_group" element={<DeviceGroupsView isAdmin={true} adminShowUserOutbound={false} />} />
                <Route path="/admin/plans" element={<AdminPlansView />} />
                <Route path="/admin/orders" element={<OrdersView type={OrdersViewType.AdminOrder} />} />
                <Route path="/admin/afflog" element={<OrdersView type={OrdersViewType.AdminAffLog} />} />
                <Route path="/admin/redeem" element={<AdminRedeemCode />} />
              </Routes>
            </Card>
          </Layout.Content>
        </Layout>
      </Layout>
    </>
  )
}
