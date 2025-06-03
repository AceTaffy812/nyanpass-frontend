import { api } from "./api/api"
import { myvar } from "./myvar"
import { newPromiseResolveNow } from "./util/promise"


export function logoutLocal() {
    localStorage.removeItem("Authorization")
    myvar.userInfo = newPromiseResolveNow(null)
    myvar.notifyInfoChange()
}

export function logout() {
    api.auth.logout().then(logoutLocal).catch(logoutLocal)
}
