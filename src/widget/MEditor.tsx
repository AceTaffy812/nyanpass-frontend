import { useEffect, useRef } from "react";
import { createMonaco } from "./MEditorEnv";
import type monaco from 'monaco-editor';

export function getEditor(): monaco.editor.IStandaloneCodeEditor | undefined {
    try {
        const m = (window as any).monacoInstance as monaco.editor.IStandaloneCodeEditor
        if (m != null) return m
    } catch (e: any) { }
    return undefined
}

function createEditor() {
    const config: monaco.editor.IStandaloneEditorConstructionOptions = {
        theme: "vs-dark",
        language: "json",
        minimap: { enabled: false },
    }
    createMonaco("MEditor-container", config)
}

export function MEditor(props: { value: string }) {
    const mounted = useRef(false)
    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true
            createEditor()
        }
    }, [])
    // VALUE TO EDITOR
    useEffect(() => {
        try {
            const m = getEditor()
            m!.setValue(props.value)
            // m.getAction('editor.action.formatDocument')!.run() // TODO 可能不生效
        } catch (e: any) {
            console.log(e)
        }
    }, [props])
    //
    return (
        <div id="MEditor-container" style={{
            width: "100%",
            height: "60vh",
            // TODO wtf
        }} />
    );
}
