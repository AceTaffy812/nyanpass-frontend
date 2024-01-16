import { myvar } from "./myvar"
import { MyMessage, MyModal } from "./util/MyModal"
import { currentTimestamp } from "./util/format"
import { isVersionNewer } from "./util/misc"

var updateChecked = false

export function checkUpdate() {
    if (!updateChecked) {
        updateChecked = true
    } else {
        return
    }
    myvar.backendInfo.then((backendInfo: any) => {
        fetch(myvar.nekoHost + "/download/nyanpass_update.json?t=" + currentTimestamp()).then((ret) => {
            ret.json().then((data) => {
                localStorage.setItem("nyanpass_update", JSON.stringify(data))
                myvar.nyanpass_update_ok = true
                //
                if (isVersionNewer(data.version, backendInfo.version)) {
                    MyModal.info({
                        title: "有更新可用", content: <div>
                            <p>{"当前版本: " + backendInfo.version}</p>
                            <p>{"可用版本: " + data.version}</p>
                            <a href="https://nyanpass.pages.dev/intro/update_backend/">更新教程</a>
                            <p>如果当前版本比可用版本新，请忽略本提示。</p>
                        </div>
                    })
                }
            })
        }).catch((e) => {
            console.log("checkUpdate 1", e)
        })
    }).catch((e) => {
        console.log("checkUpdate 2", e)
    })
}

export function checkDistConfig() {
    // 用服务器在这里发吧，，，
    fetch(myvar.nekoHost + "/download/nyanpass_config.json?t=" + currentTimestamp()).then((ret) => {
        ret.json().then((data) => {
            localStorage.setItem("nyanpass_config", JSON.stringify(data))
            myvar.nyanpass_config_ok = true
            //
            if (data != null && Object.keys(data).length > 0) {
                myvar.distConfig = data
                const keys = Object.keys(myvar.distConfig)
                // 不存在的 key
                Object.keys(myvar.defaultDistConfig).forEach(k => {
                    if (!keys.includes(k)) {
                        (myvar.distConfig as any)[k] = (myvar.defaultDistConfig as any)[k]
                    }
                })
            }
        }).catch((e) => {
            noDistConfig()
            console.log("checkDistConfig 1", e)
        })
    }).catch((e) => {
        noDistConfig()
        console.log("checkDistConfig 2", e)
    })
}

export function noDistConfig() {
    MyMessage.info("获取 nyanpass_config 失败，部分功能可能无法使用。建议检查您的网络状态，刷新页面再试。")
    MyMessage.info("提示：请勿使用国内网络直连本站。")
}
