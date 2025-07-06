import './main.less'
import { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from "react-router-dom";
import { MyApp } from './App.tsx'
import { initConfig } from './config.ts';
import { initMyVar, myvar } from './myvar.ts';
import { App } from 'antd';
import { MyConfigProvider } from './util/reactw.tsx';
import { FrontSiteInfo } from './api/model_front.ts';
import { isNotBlank } from './util/misc.ts';

function Main() {
  const [desktopBg, setDesktopBg] = useState("");
  const [mobileBg, setMobileBg] = useState("");

  myvar.updateThemeConfig = (siteInfo?: FrontSiteInfo) => {
    if (siteInfo == null) {
      return
    }
    if (isNotBlank(siteInfo.transparent_theme_bg_desktop)) {
      setDesktopBg(siteInfo.transparent_theme_bg_desktop)
    } else {
      setDesktopBg('')
    }
    if (isNotBlank(siteInfo.transparent_theme_bg_mobile)) {
      setMobileBg(siteInfo.transparent_theme_bg_mobile)
    } else {
      setMobileBg('')
    }
    const tg = myvar.toggleTransparentMode as any
    switch (siteInfo.theme_policy) {
      case 0:
        tg(false)
        break
      case 1:
        tg(true)
        break
      case 3:
        // 优先透明主题
        if (sessionStorage.getItem("transparent") == null) tg(true)
        break
    }
  }

  const [mainIsDark, setMainIsDark] = useState(false);
  const [mainIsTransparent, setMainIsTransparent] = useState(false);

  // 这是全局的暗色模式开关
  // 以 myvar.isDarkMode 为主
  myvar.toggleDarkMode = (b?: boolean) => {
    let store = true
    let n = !myvar.isDarkMode
    if (b === true) {
      n = true
      store = false
    } else if (b === false) {
      n = false
      store = false
    }
    myvar.isDarkMode = n
    setMainIsDark(n);
    if (store) sessionStorage.setItem("dark", n ? "1" : "0")
  };

  myvar.toggleTransparentMode = (b?: boolean) => {
    let store = true
    let n = !myvar.isTransparentMode
    if (b === true) {
      n = true
      store = false
    } else if (b === false) {
      n = false
      store = false
    }
    myvar.isTransparentMode = n
    setMainIsTransparent(n);
    if (store) sessionStorage.setItem("transparent", n ? "1" : "0")
  };

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      // 恢复上次的主题记忆
      const tg1 = myvar.toggleDarkMode as any
      tg1(sessionStorage.getItem("dark") == "1")
      const tg2 = myvar.toggleTransparentMode as any
      tg2(sessionStorage.getItem("transparent") == "1")
      // 没有记忆
      if (window.matchMedia != null && sessionStorage.getItem("dark") == null) {
        tg1(window.matchMedia('(prefers-color-scheme: dark)').matches)
      }
    }
  }, [])

  return <>
    <MyConfigProvider isDarkMode={mainIsDark} isTransparentMode={mainIsTransparent} >
      <App
        className={`fullscreen-app ${mainIsTransparent ? "my-theme-trans" : ""}  ${mainIsDark ? "my-theme-dark" : ""}`}
        style={{
          '--bg-image-desktop': `url('${desktopBg}')`,
          '--bg-image-mobile': `url('${mobileBg}')`,
        } as React.CSSProperties}
      >
        <MyApp isDarkMode={mainIsDark} />
      </App>
    </MyConfigProvider>
  </>
}

ReactDOM.createRoot(document.getElementById('root')!).render(<HashRouter><Main /></HashRouter >)

initConfig()
initMyVar()
