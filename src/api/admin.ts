import { batchIds } from "../util/misc";
import { fetchApi, processJson } from "./fetchw";
import { ReqSearchRules } from "./model_api";

export class apiAdmin {
    async kv_put(key: string, value: string): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/kv/" + key, {
            method: "PUT",
            body: JSON.stringify({
                value: value
            })
        });
        return processJson(rsp);
    }

    async user_list(qs: string): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/user?" + qs);
        return processJson(rsp);
    }

    async user_create(username: string): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/user", {
            method: "PUT",
            body: JSON.stringify({
                username: username.trim(),
            })
        });
        return processJson(rsp);
    }

    async user_update(id: number, obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/user/" + id, {
            method: "POST",
            body: JSON.stringify(obj)
        });
        return processJson(rsp);
    }

    async user_delete(ids: any[]): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/user", {
            method: "DELETE",
            body: JSON.stringify({
                ids: batchIds(ids)
            })
        });
        return processJson(rsp);
    }

    async user_delete_unused(): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/user/delete_unused", {
            method: "DELETE",
        });
        return processJson(rsp);
    }

    async user_delete_unused_rules(): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/user/delete_unused_rules", {
            method: "DELETE",
        });
        return processJson(rsp);
    }

    async devicegroup_list(qs: string): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/devicegroup?" + qs);
        return processJson(rsp);
    }

    async devicegroup_create(obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/devicegroup", {
            method: "PUT",
            body: JSON.stringify(obj)
        });
        return processJson(rsp);
    }


    async devicegroup_update(id: number, obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/devicegroup/" + id, {
            method: "POST",
            body: JSON.stringify(obj)
        });
        return processJson(rsp);
    }

    async devicegroup_delete(ids: any[]): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/devicegroup", {
            method: "DELETE",
            body: JSON.stringify({
                ids: batchIds(ids)
            })
        });
        return processJson(rsp);
    }

    async devicegroup_reset_token(id: number): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/devicegroup/" + id + "/reset_token", {
            method: "POST"
        });
        return processJson(rsp);
    }

    async devicegroup_reset_traffic(ids: any[]): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/devicegroup/reset_traffic", {
            method: "POST",
            body: JSON.stringify({
                ids: batchIds(ids)
            })
        });
        return processJson(rsp);
    }

    async shop_plan_list(): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/shop/plan");
        return processJson(rsp);
    }

    async shop_plan_create(obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/shop/plan", {
            method: "PUT",
            body: JSON.stringify(obj)
        });
        return processJson(rsp);
    }

    async shop_plan_update(id: number, obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/shop/plan/" + id, {
            method: "POST",
            body: JSON.stringify(obj)
        });
        return processJson(rsp);
    }

    async shop_plan_push(id: number, obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/shop/plan/" + id + "/push", {
            method: "POST",
            body: JSON.stringify(obj)
        });
        return processJson(rsp);
    }

    async shop_plan_delete(ids: any[]): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/shop/plan", {
            method: "DELETE",
            body: JSON.stringify({
                ids: batchIds(ids)
            })
        });
        return processJson(rsp);
    }

    async shop_order_accounting(obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/shop/order/accounting", {
            method: "POST",
            body: JSON.stringify(obj)
        });
        return processJson(rsp);
    }

    async shop_order_list(qs: string): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/shop/order?" + qs);
        return processJson(rsp);
    }

    async shop_order_delete(ids: any[]): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/shop/order", {
            method: "DELETE",
            body: JSON.stringify({
                ids: batchIds(ids)
            })
        });
        return processJson(rsp);
    }

    async shop_order_manual_callback(id: number): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/shop/order/" + id + "/manual_callback", {
            method: "POST",
        });
        return processJson(rsp);
    }

    async statistic(top_users: number): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/statistic?top_users=" + top_users, {
            method: "GET",
        });
        return processJson(rsp);
    }

    async search_rules(req: ReqSearchRules): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/user/0/forward/search_rules", {
            method: "POST",
            body: JSON.stringify(req),
        });
        return processJson(rsp);
    }

    async aff_log(qs: string): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/aff/log?" + qs);
        return processJson(rsp);
    }

    async aff_log_delete(ids: any[]): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/aff/log", {
            method: "DELETE",
            body: JSON.stringify({
                ids: batchIds(ids)
            })
        });
        return processJson(rsp);
    }

    async aff_log_accounting(obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/aff/log/accounting", {
            method: "POST",
            body: JSON.stringify(obj)
        });
        return processJson(rsp);
    }

    async usergroup_list(): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/usergroup");
        return processJson(rsp);
    }

    async usergroup_create(obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/usergroup", {
            method: "PUT",
            body: JSON.stringify(obj)
        });
        return processJson(rsp);
    }

    async usergroup_update(id: number, obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/usergroup/" + id, {
            method: "POST",
            body: JSON.stringify(obj)
        });
        return processJson(rsp);
    }

    async usergroup_delete(ids: any[]): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/usergroup", {
            method: "DELETE",
            body: JSON.stringify({
                ids: batchIds(ids)
            })
        });
        return processJson(rsp);
    }

    async shop_redeem_list(qs: string): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/shop/redeem?" + qs);
        return processJson(rsp);
    }

    async shop_redeem_import(obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/shop/redeem/import", {
            method: "POST",
            body: JSON.stringify(obj)
        });
        return processJson(rsp);
    }

    async shop_redeem_delete(ids: any[]): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/shop/redeem", {
            method: "DELETE",
            body: JSON.stringify({
                ids: batchIds(ids)
            })
        });
        return processJson(rsp);
    }
}
