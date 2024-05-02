import { api } from "./api/api"
import { myvar } from "./myvar"
import { newPromiseResolveNow } from "./util/promise"

var doNotLogoutLocal = false

export function setDoNotLogoutLocal(b: boolean) {
    doNotLogoutLocal = b
}

export function logoutLocal() {
    if (doNotLogoutLocal) {
        doNotLogoutLocal = false
    } else {
        localStorage.removeItem("Authorization")
        myvar.userInfo = newPromiseResolveNow(null)
        myvar.notifyInfoChange()
    }
}

export function logout() {
    api.auth.logout().then(logoutLocal).catch(logoutLocal)
}
