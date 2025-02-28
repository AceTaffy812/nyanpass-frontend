import { checkDistConfig } from "./distConfig";
import { doInitBackendInfo, doInitSiteInfo, doInitUserInfo } from "./myvarinit";
import { newPromiseResolveNow } from "./util/promise";

export const myvar = new class {
    isMobileSize = false;
    captchaKey = "";
    captchaReset = () => { };
    siteInfo = newPromiseResolveNow(null);
    userInfo = newPromiseResolveNow(null);
    backendInfo = newPromiseResolveNow(null);
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
    notifyInfoChange = () => { };
    isDarkMode = false;
    toggleDarkMode = () => { };
    nav: any = () => { };
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
    }
    if (props == null || props.backendInfo) {
        myvar.backendInfo = new Promise(doInitBackendInfo)
    }
    myvar.notifyInfoChange()
}
