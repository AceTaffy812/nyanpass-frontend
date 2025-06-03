import { api } from './api/api';
import { asyncFetchJson } from './util/fetch';
import { checkUpdate } from './distConfig';
import { showJsError } from './util/commonError';

export const resolveFailedToFetch = "resolveFailedToFetch"

export function doInitSiteInfo(resolve: (info: any) => void, reject: (err: any) => void) {
    asyncFetchJson(api.guest.kv("site_info"), (ret) => {
        if (ret.data != null) {
            try {
                const d = JSON.parse(ret.data)
                document.title = d.title ?? ""
                resolve(d)
            } catch (e: any) {
                resolve({})
            }
        } else {
            resolve({})
        }
    }, (error) => {
        // 不好用 reject
        resolve(resolveFailedToFetch)
        showJsError("刷新站点信息失败", error)
    })
}

export function doInitBackendInfo(resolve: (info: any) => void, reject: (err: any) => void) {
    if (localStorage.getItem('Authorization') == null) {
        resolve({})
        return
    }
    asyncFetchJson(api.common.backend_info(), (ret) => {
        if (ret.data != null) {
            resolve(ret.data)
        } else {
            resolve({})
        }
    }, (error) => {
        resolve(resolveFailedToFetch)
        showJsError("刷新后端信息失败", error)
    })
}

// doInitUserInfo 会有 null
export function doInitUserInfo(resolve: (info: any) => void, reject: (err: any) => void) {
    if (localStorage.getItem('Authorization') == null) {
        resolve(null)
        return
    }
    asyncFetchJson(api.user.info(), (ret) => {
        if (ret.code != 0) {
            // 如果有 logout，在 asyncFetchJson 已经处理了
            resolve(null)
        } else {
            resolve(ret.data)
            localStorage.setItem("isAdmin", ret.data.admin)
            if (ret.data.admin) checkUpdate()
        }
    }, (error) => {
        resolve(resolveFailedToFetch)
        showJsError("刷新用户信息失败", error)
    })
}
