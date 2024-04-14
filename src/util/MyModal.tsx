import { Modal, message } from "antd"
import { ignoreError } from "./promise";

let modalCtx = Modal;
let messageCtx = message;

export function setModalCtx(modal: any, message: any) {
    modalCtx = modal
    messageCtx = message
}

let confirmDialog: any = null
let currentDialog: any = null

export function closeCurrentDialog() {
    ignoreError(() => {
        currentDialog.destroy()
    })
}

class myModal {
    canNotDismiss = false

    constructor(canNotDismiss: boolean) {
        this.canNotDismiss = canNotDismiss
    }

    info = (obj: any) => {
        obj.centered = true
        obj.maskClosable = !this.canNotDismiss
        currentDialog = modalCtx.info(obj)
    }
    success = (obj: any) => {
        obj.centered = true
        obj.maskClosable = !this.canNotDismiss
        currentDialog = modalCtx.success(obj)
    }
    error = (obj: any) => {
        obj.centered = true
        obj.maskClosable = !this.canNotDismiss
        currentDialog = modalCtx.error(obj)
    }
    warning = (obj: any) => {
        obj.centered = true
        obj.maskClosable = !this.canNotDismiss
        currentDialog = modalCtx.warning(obj)
    }
    confirm = (obj: any) => {
        obj.centered = true
        obj.maskClosable = !this.canNotDismiss
        // 单例
        ignoreError(() => {
            confirmDialog.destroy()
        })
        const dlg = modalCtx.confirm(obj)
        confirmDialog = dlg
        currentDialog = dlg
    }
}

class myMessage {
    info = function (obj: any) {
        return messageCtx.info(obj)
    }
    success = function (obj: any) {
        return messageCtx.success(obj)
    }
    error = function (obj: any) {
        return messageCtx.error(obj)
    }
    warning = function (obj: any) {
        return messageCtx.warning(obj)
    }
}

export const MyModal = new myModal(false)
export const MyModalCannotDismiss = new myModal(true)
export const MyMessage = new myMessage()
