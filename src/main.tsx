import './main.less'
import { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from "react-router-dom";
import { MyApp } from './App.tsx'
import { initConfig } from './config.ts';
import { initMyVar, myvar } from './myvar.ts';
import { App } from 'antd';
import { MyConfigProvider } from './util/reactw.tsx';
// import './shou_ji_heng_ping.js'

function Main() {
  const [mainIsDark, setMainIsDark] = useState(false);

  // 这是全局的暗色模式开关
  // 以 myvar.isDarkMode 为主
  myvar.toggleDarkMode = () => {
    const n = !myvar.isDarkMode
    myvar.isDarkMode = n
    setMainIsDark(n);
    sessionStorage.setItem("dark", n ? "1" : "0")
  };

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      //
      const dark = sessionStorage.getItem("dark") == "1"
      myvar.isDarkMode = dark
      setMainIsDark(dark)
    }
  }, [])

  return <MyConfigProvider isDarkMode={mainIsDark}>
    <App className='fullscreen-app'>
      <MyApp isDarkMode={mainIsDark} />
    </App>
  </MyConfigProvider>
}

ReactDOM.createRoot(document.getElementById('root')!).render(<HashRouter><Main /></HashRouter >)

initConfig()
initMyVar()
