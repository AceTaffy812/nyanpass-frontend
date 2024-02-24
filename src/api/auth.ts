import { isNotBlank } from "../util/misc";
import { fetchApi } from "./fetchw";

export class apiAuth {
    async login(username: string, password: string): Promise<any> {
        var rsp = await fetchApi("/api/v1/auth/login", {
            method: "POST",
            body: JSON.stringify({
                username: username.trim(),
                password: password.trim(),
            })
        });
        var data = await rsp.json();
        return data;
    }

    async logout(): Promise<any> {
        var rsp = await fetchApi("/api/v1/auth/logout", {
            method: "POST",
        });
        var data = await rsp.json();
        return data;
    }

    async register(req: any, invite_code: string | undefined, captcha_key: string): Promise<any> {
        req.captcha_key = captcha_key
        if (isNotBlank(invite_code)) {
            req.invite_code = invite_code
        }
        var rsp = await fetchApi("/api/v1/auth/register", {
            method: "POST",
            body: JSON.stringify(req)
        });
        var data = await rsp.json();
        return data;
    }
}
