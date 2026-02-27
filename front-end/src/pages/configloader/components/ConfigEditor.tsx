import React, { useMemo } from 'react';

interface ConfigEditorProps {
    configText: string;
    viewMode: 'yaml' | 'json';
    showWhitespace: boolean;
    validConfig: boolean;
    onConfigChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onToggleWhitespace: () => void;
    onToggleViewMode: (mode: 'yaml' | 'json') => void;
    onNewConfig: () => void;
}

export const ConfigEditor = ({
    configText,
    viewMode,
    showWhitespace,
    validConfig,
    onConfigChange,
    onToggleWhitespace,
    onToggleViewMode,
    onNewConfig
}: ConfigEditorProps) => {
    const whitespaceOverlay = useMemo(() => {
        if (!showWhitespace || !configText) return null;

        return configText.split('\n').map(line => {
            const leadingSpaces = line.match(/^ */)?.[0].length || 0;
            if (leadingSpaces === 0) return '';

            let result = '';
            for (let i = 0; i < line.length; i++) {
                if (i < leadingSpaces) {
                    result += (i % 2 === 0) ? '│' : ' ';
                } else if (line[i] === ' ') {
                    result += '·';
                } else {
                    result += ' ';
                }
            }
            return result;
        }).join('\n');
    }, [configText, showWhitespace]);

    return (
        <div className={`card flex flex-column config-card ${validConfig ? "editor-container" : "editor-container invalid"}`}>
            <div className="card-header flex justify-between align-center">
                Parsed Configuration
                <div className="flex align-center gap-sm">
                    <button 
                        className={showWhitespace ? 'btn-primary text-small btn-icon' : 'text-small btn-icon'} 
                        onClick={onToggleWhitespace}
                        title="Show Whitespace"
                    >
                        {showWhitespace ? 'Hide Whitespaces' : 'Show Whitespaces'}
                    </button>
                    <div className="flex border rounded overflow-hidden toggle-group">
                        <button 
                            className={viewMode === 'yaml' ? 'toggle-btn active' : 'toggle-btn'} 
                            onClick={() => onToggleViewMode('yaml')}
                        >YAML</button>
                        <button 
                            className={viewMode === 'json' ? 'toggle-btn active' : 'toggle-btn'} 
                            onClick={() => onToggleViewMode('json')}
                        >JSON</button>
                    </div>
                    <button 
                        className="text-small btn-icon" 
                        onClick={onNewConfig}
                    >
                        New
                    </button>
                </div>
            </div>
            <div className={"editor-container"}>
                <div className="editor-grid">
                    {/* Hidden pre to provide dimensions */}
                    <pre className="editor-base">
                        {configText + (configText.endsWith('\n') ? ' ' : '\n')}
                    </pre>

                    {/* Whitespace overlay */}
                    {showWhitespace && (
                        <div className="editor-overlay">
                            {whitespaceOverlay}
                        </div>
                    )}

                    {/* Actual Textarea */}
                    <textarea
                        value={configText}
                        onChange={onConfigChange}
                        spellCheck={false}
                        className="editor-textarea"
                    />
                    
                    {!configText && (
                        <div className="flex align-center justify-center text-muted text-small editor-placeholder">
                            No file uploaded yet.<br/>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
