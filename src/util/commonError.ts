import { renderP } from "./ui";
import { MyMessage, MyModal, MyModalCannotDismiss } from "./MyModal";
import { isNotBlank } from "./misc";

export const commonEx = "common error message showed"

export function showCommonError(ret: any, title: string | Array<string> | boolean, cbk?: () => any, canNotDismiss?: boolean) {
    let MDL: any = MyModal
    var successTitle = title;
    var failTitle = title;
    if (title instanceof Array) {
        successTitle = title[0]
        failTitle = title[1]
    }
    if (title == true) {
        MDL = MyMessage // ...... 不要 title 了
        if (!isNotBlank(ret.msg)) { ret.msg = ret.code == 0 ? "请求成功" : "请求失败" } // 服务器没返回东西
    }
    if (canNotDismiss) {
        MDL = MyModalCannotDismiss
    }
    if (ret.code == 0) {
        if (successTitle == "") {
            if (cbk != null) cbk() // successTitle 为空就不弹窗了
        } else {
            MDL.info({ title: successTitle, content: renderP(ret.msg), onOk: cbk, onCancel: cbk })
        }
    } else {
        MDL.error({ title: failTitle + "(" + ret.code + ")", content: renderP(ret.msg), onOk: cbk, onCancel: cbk })
        throw commonEx // TODO 什么傻逼，让上层知道请求是失败的
    }
    if (title == true && cbk != null) {
        cbk() // ...... message 并没有上面两种回调
    }
}

export function showJsError(title: string, data: Error | string, useMessage?: boolean) {
    if (data instanceof Error) {
        if (useMessage) {
            MyMessage.error(title + "(" + data.name + "): " + data.message)
        } else {
            MyModal.error({ title: title + "(" + data.name + ")", content: renderP(data.message) })
        }
    } else {
        if (useMessage) {
            MyMessage.error(title + ": " + String(data))
        } else {
            MyModal.error({ title: title, content: renderP(data) })
        }
    }
}
