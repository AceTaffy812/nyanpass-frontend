import { checkDistConfig } from "./distConfig";
import { doInitBackendInfo, doInitSiteInfo, doInitUserInfo, resolveFailedToFetch } from "./myvarinit";
import { MyMessage } from "./util/MyModal";
import { newPromiseResolveNow } from "./util/promise";

export const myvar = new class {
    window: any = window;
    isMobileSize = false;
    captchaKey = "";
    captchaReset = () => { };
    siteInfo = newPromiseResolveNow(resolveFailedToFetch);
    userInfo = newPromiseResolveNow(resolveFailedToFetch);
    backendInfo = newPromiseResolveNow(resolveFailedToFetch);
    nekoHost = "https://api.candypath.eu.org";
    defaultDistConfig = {
        "clientScript": "https://dispatch.nyafw.com/download/nyanpass-install.sh",
        "clientScriptOverseas": "https://dl.nyafw.com/download/nyanpass-install.sh",
        "enableFunctions": new Array<String>(),
        "offlinePkgs": {
            "离线包获取失败": "javascript:void(0);",
            "请检查网络状态": "javascript:void(0);",
        },
    };
    distConfig = this.defaultDistConfig;
    nyanpass_update_ok = false;
    nyanpass_config_ok = false;
    nyanpass_config_failed = false;
    notifyInfoChange = () => { };
    isDarkMode = false;
    toggleDarkMode = () => { };
    isTransparentMode = false;
    toggleTransparentMode = () => { };
    nav: any = () => { };
    updateThemeConfig = (siteInfo: any) => { };
}

export function initMyVar() {
    try {
        checkDistConfig()
        reloadMyVar()
        //
        let w = (window as any)
        w.myvar = myvar
        w.myvar.initMyVar = initMyVar
        w.myvar.reloadMyVar = reloadMyVar
    } catch (e) {
        console.log(e)
    }
}

export function reloadMyVar(props?: { siteInfo?: boolean, userInfo?: boolean, backendInfo?: boolean }) {
    if (props == null || props.siteInfo) {
        myvar.siteInfo = new Promise(doInitSiteInfo)
    }
    if (props == null || props.userInfo) {
        myvar.userInfo = new Promise(doInitUserInfo)
        if (props != null) myvar.userInfo.then((info) => info != null && info != resolveFailedToFetch && MyMessage.success("刷新用户信息成功"))
    }
    if (props == null || props.backendInfo) {
        myvar.backendInfo = new Promise(doInitBackendInfo)
    }
    myvar.notifyInfoChange()
}
