import { apiAdmin } from "./admin";
import { apiAuth } from "./auth";
import { fetchApi } from "./fetchw";
import { apiGuest } from "./guest";
import { apiUser } from "./user";

class apiCommon {
    async reorder(path: string, objs: any[]): Promise<any> {
        if (objs == null || objs.length == 0) return
        const req = {
            ids: [],
            show_order: [],
        } as any
        objs.forEach((obj: any, index: number) => {
            req.ids.push(obj.id)
            req.show_order.push(index)
            obj.show_order = index
        })
        var rsp = await fetchApi(path, {
            method: "POST",
            body: JSON.stringify(req)
        });
        var data = await rsp.json();
        return data;
    }

    async backend_info(): Promise<any> {
        var rsp = await fetchApi("/api/v1/system/info");
        var data = await rsp.json();
        return data;
    }
}

export const api = {
    auth: new apiAuth(),
    guest: new apiGuest(),
    user: new apiUser(),
    admin: new apiAdmin(),
    common: new apiCommon(),
}
