import { isNotBlank } from "./misc"

export function newPromiseResolveNow(obj: any) {
    return new Promise((resolve) => { resolve(obj) })
}
export function newPromiseRejectNow(obj: any) {
    return new Promise((_, reject) => { reject(obj) })
}

export function ignoreError(f: () => any, def?: any) {
    try {
        return f()
    } catch (error) {
        // console.log("ignored error:", error)
        return def
    }
}

export function ignoreErrorAndBlank(f: () => any, def: any) {
    const ret = ignoreError(f, def)
    if (isNotBlank(ret)) return ret
    return def
}
