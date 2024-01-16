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

    async register(username: string, password: string, captcha_key: string): Promise<any> {
        var rsp = await fetchApi("/api/v1/auth/register", {
            method: "POST",
            body: JSON.stringify({
                username: username.trim(),
                password: password.trim(),
                captcha_key: captcha_key,
            })
        });
        var data = await rsp.json();
        return data;
    }
}
