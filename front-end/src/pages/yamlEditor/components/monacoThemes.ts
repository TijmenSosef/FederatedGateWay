import { configureMonacoYaml, type MonacoYaml } from 'monaco-yaml';
import type { BeforeMount } from '@monaco-editor/react';
import type * as MonacoType from 'monaco-editor';

// Singleton - configureMonacoYaml registers language features globally and must run once,
// before any editor model is created. The instance is read back in handleMount.
export let monacoYamlInstance: MonacoYaml | null = null;

export function getMonacoTheme(): string {
    const saved = localStorage.getItem('theme');
    const isDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark ? 'fedgw-dark' : 'fedgw-light';
}

const DARK_THEME: MonacoType.editor.IStandaloneThemeData = {
    base: 'vs-dark',
    inherit: true,
    rules: [
        { token: 'type.yaml',   foreground: 'd4916a' },
        { token: 'string.yaml', foreground: 'eeeeee' },
        { token: 'comment',     foreground: '777777' },
        { token: 'keyword',     foreground: 'd4916a' },
        { token: 'number',      foreground: 'e5c07b' },
    ],
    colors: {
        'editor.background':                  '#252525',
        'editor.foreground':                  '#eeeeee',
        'editorLineNumber.foreground':         '#555555',
        'editorLineNumber.activeForeground':   '#aaaaaa',
        'editor.lineHighlightBackground':      '#2d2d2d',
        'editorCursor.foreground':             '#eeeeee',
        'editor.selectionBackground':          '#3a3a5a',
        'editorIndentGuide.background1':       '#333333',
        'editorIndentGuide.activeBackground1': '#555555',
        'scrollbarSlider.background':          '#ffffff22',
        'scrollbarSlider.hoverBackground':     '#ffffff44',
    },
};

const LIGHT_THEME: MonacoType.editor.IStandaloneThemeData = {
    base: 'vs',
    inherit: true,
    rules: [
        { token: 'type.yaml',   foreground: 'd4916a' },
        { token: 'string.yaml', foreground: '212529' },
        { token: 'comment',     foreground: '888888' },
        { token: 'keyword',     foreground: 'd4916a' },
        { token: 'number',      foreground: 'a67d3d' },
    ],
    colors: {
        'editor.background':                  '#ffffff',
        'editor.foreground':                  '#212529',
        'editorLineNumber.foreground':         '#aaaaaa',
        'editorLineNumber.activeForeground':   '#495057',
        'editor.lineHighlightBackground':      '#f1f3f5',
        'editor.selectionBackground':          '#dae4f0',
        'scrollbarSlider.background':          '#00000022',
        'scrollbarSlider.hoverBackground':     '#00000044',
    },
};

export const beforeMount: BeforeMount = (monaco) => {
    if (!monacoYamlInstance) {
        // fileMatch ['**'] matches any URI including in-memory models
        // (e.g. inmemory://model/apisix-config.yaml). Schema starts empty
        // and is pushed via update() once ConfigEditor receives the catalog.
        monacoYamlInstance = configureMonacoYaml(monaco as never, {
            validate: false,
            completion: false,
            schemas: [],
        });
    }
    monaco.editor.defineTheme('fedgw-dark', DARK_THEME);
    monaco.editor.defineTheme('fedgw-light', LIGHT_THEME);
};
