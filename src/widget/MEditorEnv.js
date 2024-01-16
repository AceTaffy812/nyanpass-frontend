export function createMonaco(id, config) {
    if (window.monacoInstance != null) {
        window.monacoInstance.dispose()
    }
    window.monacoInstance = monaco.editor.create(document.getElementById(id), config)
}
