import { config } from "../config"

export async function fetchApi(input: string, init?: RequestInit) {
    const Authorization = localStorage.getItem('Authorization')
    input = config.apiPrefix + input
    if (init == null) {
        init = {}
    }
    if (init.headers == null) {
        init.headers = {}
    }
    if (Authorization != null) {
        (init.headers as any)["Authorization"] = Authorization
    }
    try {
        var rsp = await fetch(input, init);
        (rsp as any).myendpoint = input
        return rsp
    } catch (err: any) {
        const originalMessage = err.message || 'fetch error';
        err.message = `${input} | ${originalMessage}`;
        throw err;
    }
}

export async function processJson(rsp: Response) {
    try {
        const data = await rsp.json();
        return data;
    } catch (err: any) {
        const originalMessage = err.message || 'Unexpected JSON parse error';
        err.message = `${(rsp as any).myendpoint} | HTTP ${rsp.status} | ${originalMessage}`;
        err.status = rsp.status;
        throw err;
    }
}
