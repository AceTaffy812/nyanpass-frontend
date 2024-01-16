import { Modal, message } from "antd"
import { ignoreError } from "./promise";

let modalCtx = Modal;
let messageCtx = message;

export function setModalCtx(modal: any, message: any) {
    modalCtx = modal
    messageCtx = message
}

let confirmDialog: any = null

class myModal {
    canNotDismiss = false

    constructor(canNotDismiss: boolean) {
        this.canNotDismiss = canNotDismiss
    }

    info = (obj: any) => {
        obj.centered = true
        obj.maskClosable = !this.canNotDismiss
        modalCtx.info(obj)
    }
    success = (obj: any) => {
        obj.centered = true
        obj.maskClosable = !this.canNotDismiss
        modalCtx.success(obj)
    }
    error = (obj: any) => {
        obj.centered = true
        obj.maskClosable = !this.canNotDismiss
        modalCtx.error(obj)
    }
    warning = (obj: any) => {
        obj.centered = true
        obj.maskClosable = !this.canNotDismiss
        modalCtx.warning(obj)
    }
    confirm = (obj: any) => {
        obj.centered = true
        obj.maskClosable = !this.canNotDismiss
        // 单例
        ignoreError(() => {
            confirmDialog.destroy()
        })
        confirmDialog = modalCtx.confirm(obj)
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
