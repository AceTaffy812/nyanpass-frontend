import { api } from './api/api';
import { asyncFetchJson } from './util/fetch';
import { renderP } from './util/ui';
import { MyModal } from './util/MyModal';
import { checkUpdate } from './distConfig';

export function doInitSiteInfo(resolve: (info: any) => void) {
    asyncFetchJson(api.guest.kv("site_info"), (ret) => {
        if (ret.data != null) {
            try {
                const d = JSON.parse(ret.data)
                document.title = d.title
                resolve(d)
            } catch (e: any) {
                resolve({})
            }
        } else {
            resolve({})
        }
    })
}

export function doInitBackendInfo(resolve: (info: any) => void) {
    asyncFetchJson(api.common.backend_info(), (ret) => {
        if (ret.data != null) {
            resolve(ret.data)
        } else {
            resolve({})
        }
    })
}

export function doInitUserInfo(resolve: (info: any) => void) {
    asyncFetchJson(api.user.info(), (ret) => {
        if (ret.code != 0) {
            resolve(null)
            if (ret.code != 403) MyModal.info({ title: "获取用户信息", content: renderP(ret) })
        } else {
            resolve(ret.data)
            localStorage.setItem("isAdmin", ret.data.admin)
            if (ret.data.admin) checkUpdate()
        }
    })
}
