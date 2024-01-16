import { api } from "./api/api"
import { myvar } from "./myvar"
import { newPromiseResolveNow } from "./util/promise"

export function logoutLocal() {
    localStorage.removeItem("Authorization")
    myvar.userInfo = newPromiseResolveNow(null)
    myvar.notifyInfoChange()
    // 第一次打开也会到这里
    // MyMessage.info("您已退出")
}

export function logout() {
    api.auth.logout().then(logoutLocal).catch(logoutLocal)
}
