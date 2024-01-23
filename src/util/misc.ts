
export function removeItem<T>(arr: Array<T>, value: T): Array<T> {
    const index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}


export function myFilter(arr: any, key: string, values: any[]) {
    const ret = new Array();
    arr.forEach((element: any) => {
        if (values.includes(element[key])) {
            ret.push(element)
        }
    })
    return ret
}

export function findObjByIdId(arr: any[], id: any, key?: string) {
    if (!isNotBlank(key)) key = "id"
    for (let i = 0; i < arr.length; i++) {
        if (arr[i][String(key)] == id) return arr[i]
    }
    return null
}

export function findObjIndexByIdId(arr: any[], id: any, key?: string) {
    if (!isNotBlank(key)) key = "id"
    for (let i = 0; i < arr.length; i++) {
        if (arr[i][String(key)] == id) return i
    }
    return -1
}

export function removeFromArray(arr: any[], id: any, key?: string) {
    const i = findObjIndexByIdId(arr, id, key)
    if (i >= 0) {
        arr = arr.splice(i, 1)
    }
    return arr
}

export function isInt(a: any) {
    return typeof a === 'number' && a % 1 === 0
}

export function batchIds(a: any[]) {
    const ids: number[] = []
    a.forEach((e) => {
        if (isInt(e)) {
            ids.push(e)
        } else {
            try {
                const ee = Number(e.toString())
                if (!isNaN(ee)) {
                    ids.push(ee)
                }
            } catch (error) {

            }
        }
    })
    return ids
}

export function allFalse(arr: boolean[]) {
    let ret = true
    arr.forEach((a: boolean) => {
        if (a) {
            ret = false
        }
    })
    return ret
}

export function allFalseMap(arr: any) {
    let ret = true
    Object.keys(arr).forEach(k => {
        if (arr[k]) {
            ret = false
        }
    })
    return ret
}

export function tryParseJSONObject(jsonString: string) {
    try {
        var o = JSON.parse(jsonString);
        if (o && typeof o === "object") {
            return o;
        }
    }
    catch (e) { }
    return null;
};

export function isNotBlank(a: any) {
    return a != null && a != ""
}

export function sortObjByKey(objs: any[], orderKey: string) {
    return objs.sort((a: any, b: any) => a[orderKey] - b[orderKey])
}

export function saveObjSortToKey(objs: any[], orderKey: string) {
    let i = 0
    objs.forEach(e => e[orderKey] = i++)
}

export function isVersionNewer(sNew: string, sOld: string) {
    if (sNew == null || sNew == "") {
        return false
    }
    if (sOld == null || sOld == "") {
        return false
    }
    const vNew = Number(sNew)
    const vOld = Number(sOld)
    if (isNaN(vNew) || isNaN(vOld)) {
        return false
    }
    return vNew > vOld
}

export function cleanupDefaultValue(obj: any) {
    if (obj != null) Object.keys(obj).forEach(k => {
        const v = obj[k]
        if (v == null || v === 0 || v === "" || v === false) {
            delete obj[k];
        }
    })
    return obj
}