import { config } from "../config"

export function fetchApi(input: string, init?: RequestInit): Promise<Response> {
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
    return fetch(input, init)
}
