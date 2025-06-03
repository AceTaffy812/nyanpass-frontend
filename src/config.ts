import { isNotBlank } from "./util/misc"

export var config = {
    apiPrefix: "",
}

export function initConfig() {
    try {
        let w = (window as any)
        if (w.config != null) {
            config = w.config
            console.log("config from window")
        } else {
            const u = new URL(location as any)
            const uApi = u.searchParams.get("api")
            if (uApi != null) config.apiPrefix = uApi
            w.config = config
            console.log("config to window", uApi)
        }
        // token_login
        const match = location.hash.match(/^#\/token_login\/(.+)$/);
        const param = match ? match[1] : null;
        if (isNotBlank(param)) {
            localStorage.setItem("Authorization", String(param));
        }
    } catch (e) {
        console.log(e)
    }
}
