import { logoutLocal } from "../AppApi";
import { commonEx, showCommonError, showJsError } from "./commonError";

// 如果不设置 success 或 fail 则用对话框输出， ret 至少有 code
export function asyncFetchJson(promise: Promise<any>, success?: (ret?: any) => void, fail?: (error: any) => void, final?: () => void) {
    let myFail = (error: any) => { showJsError("请求出错", error) }
    if (fail != null) myFail = fail
    setTimeout(async () => {
        try {
            const ret = await promise
            if (ret == null || ret["code"] == null) {
                myFail(new Error("未知的返回数据"))
            } else if (ret["logout"]) {
                logoutLocal()
            } else if (success != null) {
                success(ret)
            } else {
                showCommonError(ret, ["请求成功", "请求失败"])
            }
        } catch (error: any) {
            if (error != commonEx) {
                // 返回数据不是 json，或者网络出错了
                console.log("fetch error", error)
                myFail(error)
            }
        } finally {
            if (final != null) final()
        }
    });
}

// 和上面一样，只是改为返回 promise
export function promiseFetchJson(promise: Promise<any>, success?: (ret?: any, data?: any) => void, fail?: (error: any) => void, final?: () => void) {
    let myFail = (error: any) => { showJsError("请求出错", error) }
    if (fail != null) myFail = fail
    return (async () => {
        try {
            const ret = await promise
            if (ret["code"] == null) {
                myFail(new Error("未知的返回数据"))
            } else if (ret["logout"]) {
                logoutLocal()
            } else if (success != null) {
                success(ret, ret.data)
            } else {
                showCommonError(ret, ["成功", "失败"])
            }
        } catch (error: any) {
            if (error != commonEx) {
                console.log("fetch error", error)
                myFail(error)
            }
            throw error
        } finally {
            if (final != null) final()
        }
    })();
}
