import { batchIds } from "../util/misc";
import { fetchApi, processJson } from "./fetchw";
import { ReqSearchRules } from "./model_api";

export class apiForward {
    public affectId: string | null | undefined

    constructor(affectId?: string | null) {
        this.affectId = affectId
    }

    async search_rules(req: ReqSearchRules, qs: string): Promise<any> {
        let url = "/api/v1/user/forward/search_rules"
        if (this.affectId != null) url = "/api/v1/admin/user/" + this.affectId + "/forward/search_rules"
        var rsp = await fetchApi(url + "?" + qs, {
            method: "POST",
            body: JSON.stringify(req),
        });
        return processJson(rsp);
    }

    async batch_update(req: { ids: number[], column: string, value: any }[]): Promise<any> {
        let url = "/api/v1/user/forward/batch_update"
        if (this.affectId != null) url = "/api/v1/admin/user/" + this.affectId + "/forward/batch_update"
        var rsp = await fetchApi(url, {
            method: "POST",
            body: JSON.stringify(req)
        });
        return processJson(rsp);
    }

    async forward_list(qs: string): Promise<any> {
        let url = "/api/v1/user/forward?" + qs
        if (this.affectId != null) url = "/api/v1/admin/user/" + this.affectId + "/forward?" + qs
        var rsp = await fetchApi(url);
        return processJson(rsp);
    }

    async forward_create(obj: any,): Promise<any> {
        let url = "/api/v1/user/forward"
        if (this.affectId != null) url = "/api/v1/admin/user/" + this.affectId + "/forward"
        var rsp = await fetchApi(url, {
            method: "PUT",
            body: JSON.stringify(obj)
        });
        return processJson(rsp);
    }

    async forward_batch_create(obj: any): Promise<any> {
        let url = "/api/v1/user/forward/batch_create"
        if (this.affectId != null) url = "/api/v1/admin/user/" + this.affectId + "/forward/batch_create"
        var rsp = await fetchApi(url, {
            method: "POST",
            body: JSON.stringify(obj)
        });
        return processJson(rsp);
    }

    async forward_update(id: number, obj: any): Promise<any> {
        let url = "/api/v1/user/forward/" + id
        if (this.affectId != null) url = "/api/v1/admin/user/" + this.affectId + "/forward" + "/" + id
        var rsp = await fetchApi(url, {
            method: "POST",
            body: JSON.stringify(obj)
        });
        return processJson(rsp);
    }

    async forward_delete(ids: any[]): Promise<any> {
        let url = "/api/v1/user/forward"
        if (this.affectId != null) url = "/api/v1/admin/user/" + this.affectId + "/forward"
        var rsp = await fetchApi(url, {
            method: "DELETE",
            body: JSON.stringify({
                ids: batchIds(ids)
            })
        });
        return processJson(rsp);
    }

    async forward_reset_traffic(ids: any[]): Promise<any> {
        let url = "/api/v1/user/forward/reset_traffic"
        if (this.affectId != null) url = "/api/v1/admin/user/" + this.affectId + "/forward/reset_traffic"
        var rsp = await fetchApi(url, {
            method: "POST",
            body: JSON.stringify({
                ids: batchIds(ids)
            })
        });
        return processJson(rsp);
    }

    async forward_diagnose(id: number): Promise<any> {
        let url = "/api/v1/user/forward/" + id + "/diagnose"
        if (this.affectId != null) url = "/api/v1/admin/user/" + this.affectId + "/forward/" + id + "/diagnose"
        var rsp = await fetchApi(url, {
            method: "POST",
        });
        return processJson(rsp);
    }
}