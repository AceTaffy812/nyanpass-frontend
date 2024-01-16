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
    } catch (e) {
        console.log(e)
    }
}
