import { useEffect, useRef, useState } from 'react'
import { myvar } from './myvar';
import type { MenuProps } from 'antd';
import { Drawer, Dropdown, Flex, Layout, Menu } from 'antd';
import { ApiOutlined, BgColorsOutlined, LoginOutlined, LogoutOutlined, MenuOutlined, MoonFilled, SunFilled, UserOutlined } from '@ant-design/icons';
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
import { MyMessage, MyModal } from './util/MyModal';
import { ShopView } from './views/Shop';
import { AdminPlansView } from './views/AdminPlans';
import { OrdersView, OrdersViewType } from './views/Orders';
import { LookingGlassView } from './views/LookingGlass';
import { AdminMainView } from './views/AdminMain';
import { AdminUserGroupsView } from './views/AdminUserGroup';
import { AdminRedeemCode } from './views/AdminRedeemCode';
import { resolveFailedToFetch } from './myvarinit';

export function MyApp(props: { isDarkMode: boolean }) {
  const url = new URL(location as any)
  const isManageUser = url.searchParams.get("affect") != null
  const [userInfo, setUserInfo] = useState<any>(null);
  const [backendInfo, setBackendInfo] = useState<any>(null);
  const [siteInfo, setSiteInfo] = useState(new FrontSiteInfo());
  const [breadTitle, setBreadTitle] = useState("主页");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobileSize, setIsMobileSize] = useState(false);
  const [hideNav, setHideNav] = useState(true);
  const [userInfoLoaded, setUserInfoLoaded] = useState(false);

  const mounted = useRef(false);
  const nav = myNavFactory(useNavigate(), setBreadTitle, () => setDrawerOpen(false))
  myvar.nav = nav

  // 刷新用户状态
  function notifyInfoChange() {
    (async () => {
      try {
        const info = await myvar.siteInfo;
        if (info === resolveFailedToFetch) return;
        setSiteInfo(info as any)
        // 获取到了来自后端的设置
        myvar.updateThemeConfig(info)
      } catch (error) {
        console.log(error)
      }
    })();
    (async () => {
      try {
        const info = await myvar.backendInfo;
        if (info === resolveFailedToFetch) return;
        setBackendInfo(info as any)
      } catch (error) {
        console.log(error)
      }
    })();
    (async () => {
      try {
        const info = await myvar.userInfo;
        if (info === resolveFailedToFetch) return;
        setUserInfoLoaded(true)
        setUserInfo(info)
        if (info == null) {
          // 隐藏导航，显示登录界面
          setHideNav(true)
          if (!location.hash.includes("register") && !location.hash.includes("login")) {
            nav("/login")
          }
        } else {
          // 登录成功
          setHideNav(isManageUser)
          if (location.hash.includes("register") || location.hash.includes("login")) {
            nav("/")
          }
        }
      } catch (error) {
        console.log(error)
      }
    })();
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

  const openTz = function (targetUrl: string) {
    const canOpenTz = function () {
      if (myvar.nyanpass_config_ok) {
        if (!userInfo.admin) {
          return true
        }
        if (myvar.nyanpass_update_ok) {
          return true;
        }
      }
      return false;
    }
    return () => {
      if (canOpenTz()) {
        window.open(targetUrl, '_blank');
        return
      }
      if (myvar.nyanpass_config_failed) {
        MyModal.confirm({
          icon: <p />,
          title: "配置信息未就绪",
          content: <p>配置信息未就绪，请稍等待。如果刷新多次也无法获取配置，可以直接打开探针，但是可能有部分项目无法使用或者显示错误。</p>,
          onOk: () => {
            window.open(targetUrl, '_blank');
          }
        })
      } else {
        MyMessage.info("配置信息未就绪，请稍等待。")
        setTimeout(() => {
          if (!canOpenTz()) {
            myvar.nyanpass_config_failed = true
          }
        }, 3000);
      }
    }
  }

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
        key: "tz", label: "节点状态 (旧)", icon: <ApiOutlined />, onClick: openTz("./tz.html")
      })
      navMenu.push({
        key: "tz2", label: "节点状态 (新)", icon: <ApiOutlined />, onClick: openTz("./tz2.html")
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

  return (
    <>
      <Layout.Header style={{
        backgroundColor: props.isDarkMode ? "rgba(0, 0, 0, 0.9)" : "rgba(0, 0, 0, 0.3)",
        padding: "0 2em"
      }} id="my-header">
        <Flex
          className='neko-flex'
          style={{
            alignItems: "center",
            whiteSpace: "nowrap",
            height: "100%",
          }}>
          <div style={isMobileSize && !hideNav ? {} : { display: "none" }}>
            <MenuOutlined style={{ fontSize: "large", cursor: 'pointer' }} onClick={() => setDrawerOpen(true)} />
          </div>
          <h2 style={{ width: "100%", overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{siteInfo?.title}</h2>
          <Dropdown.Button
            style={{ width: 'unset' }}
            menu={{ items: renderUserMenu() }} placement="bottom" icon={<UserOutlined />}
          > {userInfo == null ? "未登录" : userInfo.username}
          </Dropdown.Button>
          <div
            style={{ fontSize: "large", cursor: 'pointer' }}
            onClick={myvar.toggleDarkMode} >
            {props.isDarkMode ? <SunFilled /> : <MoonFilled />}
          </div>
          <div
            style={{ fontSize: "large", cursor: 'pointer', display: siteInfo.theme_policy >= 2 ? undefined : "none" }}
            onClick={myvar.toggleTransparentMode} >
            {<BgColorsOutlined />}
          </div>
        </Flex>
      </Layout.Header>
      <Layout style={{ flexDirection: "row" }} id="my-content">
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
        <Layout style={{ padding: '1em', overflow: 'auto' }}>
          <Layout.Sider
            style={{ margin: '0 1em 0 0' }}
            hidden={isMobileSize || hideNav}
          >
            <Menu
              mode="inline"
              style={{ height: '100%', borderRight: 0 }}
              defaultOpenKeys={["admin"]}
              items={renderNavMenu()}
            />
          </Layout.Sider>
          <Layout.Content style={{ display: userInfoLoaded ? undefined : 'none' }}>
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
              <Route path="/admin/users" element={<AdminUsersView userInfo={userInfo} />} />
              <Route path="/admin/user_group" element={<AdminUserGroupsView />} />
              <Route path="/admin/device_group" element={<DeviceGroupsView isAdmin={true} adminShowUserOutbound={false} />} />
              <Route path="/admin/plans" element={<AdminPlansView />} />
              <Route path="/admin/orders" element={<OrdersView type={OrdersViewType.AdminOrder} />} />
              <Route path="/admin/afflog" element={<OrdersView type={OrdersViewType.AdminAffLog} />} />
              <Route path="/admin/redeem" element={<AdminRedeemCode />} />
            </Routes>
          </Layout.Content>
        </Layout>
      </Layout>
    </>
  )
}
