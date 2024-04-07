import { batchIds } from "../util/misc";
import { fetchApi } from "./fetchw";
import { ReqSearchRules } from "./model_api";

export class apiAdmin {
    async kv_put(key: string, value: string): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/kv/" + key, {
            method: "PUT",
            body: JSON.stringify({
                value: value
            })
        });
        var data = await rsp.json();
        return data;
    }

    async user_list(qs: string): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/user?" + qs);
        var data = await rsp.json();
        return data;
    }

    async user_create(username: string): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/user", {
            method: "PUT",
            body: JSON.stringify({
                username: username.trim(),
            })
        });
        var data = await rsp.json();
        return data;
    }

    async user_update(id: number, obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/user/" + id, {
            method: "POST",
            body: JSON.stringify(obj)
        });
        var data = await rsp.json();
        return data;
    }

    async user_delete(ids: any[]): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/user", {
            method: "DELETE",
            body: JSON.stringify({
                ids: batchIds(ids)
            })
        });
        var data = await rsp.json();
        return data;
    }

    async user_delete_unused(): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/user/delete_unused", {
            method: "DELETE",
        });
        var data = await rsp.json();
        return data;
    }

    async user_delete_unused_rules(): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/user/delete_unused_rules", {
            method: "DELETE",
        });
        var data = await rsp.json();
        return data;
    }

    async devicegroup_list(qs: string): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/devicegroup?" + qs);
        var data = await rsp.json();
        return data;
    }

    async devicegroup_create(obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/devicegroup", {
            method: "PUT",
            body: JSON.stringify(obj)
        });
        var data = await rsp.json();
        return data;
    }


    async devicegroup_update(id: number, obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/devicegroup/" + id, {
            method: "POST",
            body: JSON.stringify(obj)
        });
        var data = await rsp.json();
        return data;
    }

    async devicegroup_delete(ids: any[]): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/devicegroup", {
            method: "DELETE",
            body: JSON.stringify({
                ids: batchIds(ids)
            })
        });
        var data = await rsp.json();
        return data;
    }

    async devicegroup_reset_token(id: number): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/devicegroup/" + id + "/reset_token", {
            method: "POST"
        });
        var data = await rsp.json();
        return data;
    }

    async devicegroup_reset_traffic(ids: any[]): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/devicegroup/reset_traffic", {
            method: "POST",
            body: JSON.stringify({
                ids: batchIds(ids)
            })
        });
        var data = await rsp.json();
        return data;
    }

    async shop_plan_list(): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/shop/plan");
        var data = await rsp.json();
        return data;
    }

    async shop_plan_create(obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/shop/plan", {
            method: "PUT",
            body: JSON.stringify(obj)
        });
        var data = await rsp.json();
        return data;
    }

    async shop_plan_update(id: number, obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/shop/plan/" + id, {
            method: "POST",
            body: JSON.stringify(obj)
        });
        var data = await rsp.json();
        return data;
    }

    async shop_plan_push(id: number, obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/shop/plan/" + id + "/push", {
            method: "POST",
            body: JSON.stringify(obj)
        });
        var data = await rsp.json();
        return data;
    }

    async shop_plan_delete(ids: any[]): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/shop/plan", {
            method: "DELETE",
            body: JSON.stringify({
                ids: batchIds(ids)
            })
        });
        var data = await rsp.json();
        return data;
    }

    async shop_order_accounting(obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/shop/order/accounting", {
            method: "POST",
            body: JSON.stringify(obj)
        });
        var data = await rsp.json();
        return data;
    }

    async shop_order_list(qs: string): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/shop/order?" + qs);
        var data = await rsp.json();
        return data;
    }

    async shop_order_delete(ids: any[]): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/shop/order", {
            method: "DELETE",
            body: JSON.stringify({
                ids: batchIds(ids)
            })
        });
        var data = await rsp.json();
        return data;
    }

    async shop_order_manual_callback(id: number): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/shop/order/" + id + "/manual_callback", {
            method: "POST",
        });
        var data = await rsp.json();
        return data;
    }

    async statistic(top_users: number): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/statistic?top_users=" + top_users, {
            method: "GET",
        });
        var data = await rsp.json();
        return data;
    }

    async search(req: ReqSearchRules): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/search_rules", {
            method: "POST",
            body: JSON.stringify(req),
        });
        var data = await rsp.json();
        return data;
    }

    async aff_log(qs: string): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/aff/log?" + qs);
        var data = await rsp.json();
        return data;
    }

    async aff_log_delete(ids: any[]): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/aff/log", {
            method: "DELETE",
            body: JSON.stringify({
                ids: batchIds(ids)
            })
        });
        var data = await rsp.json();
        return data;
    }

    async aff_log_accounting(obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/aff/log/accounting", {
            method: "POST",
            body: JSON.stringify(obj)
        });
        var data = await rsp.json();
        return data;
    }

    async usergroup_list(): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/usergroup");
        var data = await rsp.json();
        return data;
    }

    async usergroup_create(obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/usergroup", {
            method: "PUT",
            body: JSON.stringify(obj)
        });
        var data = await rsp.json();
        return data;
    }

    async usergroup_update(id: number, obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/usergroup/" + id, {
            method: "POST",
            body: JSON.stringify(obj)
        });
        var data = await rsp.json();
        return data;
    }

    async usergroup_delete(ids: any[]): Promise<any> {
        var rsp = await fetchApi("/api/v1/admin/usergroup", {
            method: "DELETE",
            body: JSON.stringify({
                ids: batchIds(ids)
            })
        });
        var data = await rsp.json();
        return data;
    }
}
