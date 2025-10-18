import QueryString from "qs";
import { batchIds } from "../util/misc";
import { fetchApi, processJson } from "./fetchw";

export class apiUser {
    async info(): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/info");
        return processJson(rsp);
    }

    async renew(): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/renew", {
            method: "POST",
        });
        return processJson(rsp);
    }

    async telegram_bind(unbind?: boolean): Promise<any> {
        let url = "/api/v1/user/telegram/bind"
        if (unbind) url += "?unbind=1"
        var rsp = await fetchApi(url, {
            method: "POST",
        });
        return processJson(rsp);
    }

    async resetpassword(obj: any, affectId?: string | number): Promise<any> {
        let url = "/api/v1/user/reset_password"
        if (affectId != null) url = "/api/v1/admin/user/" + affectId + "/reset_password"
        var rsp = await fetchApi(url, {
            method: "POST",
            body: JSON.stringify(obj)
        });
        return processJson(rsp);
    }

    async update_column(column: string, value: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/update_column", {
            method: "POST",
            body: JSON.stringify({
                column: column,
                value: value,
            })
        });
        return processJson(rsp);
    }

    async get_statistic(): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/statistic");
        return processJson(rsp);
    }

    async devicegroup_list(): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/devicegroup");
        return processJson(rsp);
    }

    async devicegroup_create(obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/devicegroup", {
            method: "PUT",
            body: JSON.stringify(obj)
        });
        return processJson(rsp);
    }

    async devicegroup_update(id: number, obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/devicegroup/" + id, {
            method: "POST",
            body: JSON.stringify(obj)
        });
        return processJson(rsp);
    }

    async devicegroup_delete(ids: any[]): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/devicegroup", {
            method: "DELETE",
            body: JSON.stringify({
                ids: batchIds(ids)
            })
        });
        return processJson(rsp);
    }

    async devicegroup_reset_token(id: number): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/devicegroup/" + id + "/reset_token", {
            method: "POST"
        });
        return processJson(rsp);
    }

    async devicegroup_reset_traffic(ids: any[]): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/devicegroup/reset_traffic", {
            method: "POST",
            body: JSON.stringify({
                ids: batchIds(ids)
            })
        });
        return processJson(rsp);
    }

    async devicegroup_looking_glass(handle: string, method: string, target: string): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/devicegroup/looking_glass", {
            method: "POST",
            body: JSON.stringify({
                handle: handle,
                method: method,
                target: target,
            })
        });
        return processJson(rsp);
    }

    async shop_payment_info(): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/shop/payment_info");
        return processJson(rsp);
    }

    async shop_redeem_query(code: string): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/shop/redeem?" + QueryString.stringify({ code: code }));
        return processJson(rsp);
    }

    async shop_redeem_purchase(code: string): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/shop/redeem?" + QueryString.stringify({ code: code }), {
            method: "POST",
            // 也许没有 POST body 参数
        });
        return processJson(rsp);
    }

    async shop_plan_list(): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/shop/plan");
        return processJson(rsp);
    }

    async shop_plan_purchase(planId: number): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/shop/purchase", {
            method: "POST",
            body: JSON.stringify({
                "plan_id": planId,
            })
        });
        return processJson(rsp);
    }

    async shop_deposit(gateway_name: string, amount: number): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/shop/deposit", {
            method: "POST",
            body: JSON.stringify({
                "amount": amount,
                "gateway_name": gateway_name,
            })
        });
        return processJson(rsp);
    }

    async shop_get_deposit(orderNo: string): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/shop/get_deposit/" + orderNo, {
            method: "GET",
        });
        return processJson(rsp);
    }

    async shop_order_list(qs: string): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/shop/order?" + qs);
        return processJson(rsp);
    }

    async aff_log(qs: string): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/aff/log?" + qs);
        return processJson(rsp);
    }

    async aff_config(): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/aff/config");
        return processJson(rsp);
    }

    async aff_deposit(amount: number): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/aff/deposit", {
            method: "POST",
            body: JSON.stringify({
                "amount": amount,
            })
        });
        return processJson(rsp);
    }

    async notification_settings_get(): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/notification/settings");
        return processJson(rsp);
    }

    async notification_settings_put(obj: any): Promise<any> {
        var rsp = await fetchApi("/api/v1/user/notification/settings", {
            method: "PUT",
            body: JSON.stringify(obj)
        });
        return processJson(rsp);
    }
}
