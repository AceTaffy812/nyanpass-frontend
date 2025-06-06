import { fetchApi, processJson } from "./fetchw";

export class apiGuest {
    async kv(key: string, type?: string): Promise<any> {
        if (type == null) type = "guest"
        var rsp = await fetchApi("/api/v1/" + type + "/kv/" + key);
        return processJson(rsp);
    }
}
