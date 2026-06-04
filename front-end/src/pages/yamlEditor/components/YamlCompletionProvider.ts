import type * as MonacoType from 'monaco-editor';
import type { JSONSchema as MonacoJsonSchema } from 'monaco-yaml';
import type { SchemaCatalog } from '../../../actions/SchemaValidation';
import { getSchemaPathAtCursor, getSiblingKeysAtCursor } from '../yamlLineUtils';

// Follows a $ref pointer to its target in the defs dict.
// The APISIX schema itself does not use $ref - we do write $ref in SchemaValidation.ts
// for AJV, but that is a separate pipeline. This function is defensive: it is a no-op
// against the current schema but keeps walkSchemaToPath correct if $refs ever appear.
function resolveRef(schema: MonacoJsonSchema, defs: Record<string, MonacoJsonSchema>): MonacoJsonSchema {
    const ref = (schema as Record<string, unknown>)['$ref'];
    if (typeof ref !== 'string') return schema;
    if (ref.startsWith('#/definitions/')) return defs[ref.slice('#/definitions/'.length)] ?? schema;
    return schema;
}

// Walks a JSON Schema along a property path, resolving $refs at each step.
// Returns null if any step in the path is missing.
function walkSchemaToPath(
    schema: MonacoJsonSchema,
    path: string[],
    defs: Record<string, MonacoJsonSchema>,
): MonacoJsonSchema | null {
    let current = resolveRef(schema, defs);
    for (const key of path) {
        const props = (current as Record<string, unknown>).properties as Record<string, MonacoJsonSchema> | undefined;
        if (!props || !(key in props)) return null;
        current = resolveRef(props[key], defs);
    }
    return current;
}

export class YamlCompletionProvider {
    private readonly monaco: typeof MonacoType;

    constructor(monaco: typeof MonacoType) {
        this.monaco = monaco;
    }

    /**
     * Registers a context-aware YAML completion provider against the Monaco instance.
     * Returns a disposable that must be called when the editor is unmounted.
     *
     * @param getCategoryLineMap - returns the current line -> category map
     * @param getSchema          - returns the current APISIX schema catalog
     */
    register(
        getCategoryLineMap: () => Map<number, string>,
        getSchema: () => SchemaCatalog | null | undefined,
    ): MonacoType.IDisposable {
        const monaco = this.monaco;

        return monaco.languages.registerCompletionItemProvider('yaml', {
            triggerCharacters: [' ', '\n'],
            provideCompletionItems(model: MonacoType.editor.ITextModel, position: MonacoType.Position) {
                const line = position.lineNumber;
                const category = getCategoryLineMap().get(line);
                if (!category) return { suggestions: [] };

                const catalog = getSchema();
                if (!catalog?.main) return { suggestions: [] };

                const defs = catalog.main as Record<string, MonacoJsonSchema>;
                const categorySchema = defs[category];
                if (!categorySchema) return { suggestions: [] };

                const text = model.getValue();
                const path = getSchemaPathAtCursor(text, line);
                const existingKeys = getSiblingKeysAtCursor(text, line);

                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn,
                };

                // Builds key completion items from a schema properties map, filtering already-present keys.
                const buildKeyItems = (props: Record<string, MonacoJsonSchema>): MonacoType.languages.CompletionItem[] =>
                    Object.entries(props)
                        .filter(([key]) => !existingKeys.has(key))
                        .map(([key, propSchema]) => {
                            const resolved = resolveRef(propSchema as MonacoJsonSchema, defs);
                            const type = (resolved as Record<string, unknown>).type as string | undefined;
                            const description = (resolved as Record<string, unknown>).description as string | undefined;
                            return {
                                label: key,
                                kind: type === 'object' || type === 'array'
                                    ? monaco.languages.CompletionItemKind.Module
                                    : monaco.languages.CompletionItemKind.Field,
                                documentation: description ?? '',
                                insertText: key,
                                range,
                                detail: type ?? '',
                            };
                        });

                // Builds value completion items from a schema - suggests enum values or true/false for booleans.
                const buildValueItems = (valueSchema: MonacoJsonSchema): MonacoType.languages.CompletionItem[] => {
                    const resolved = resolveRef(valueSchema, defs);
                    const schemaType = (resolved as Record<string, unknown>).type as string | undefined;
                    const enumValues = (resolved as Record<string, unknown>).enum as unknown[] | undefined;
                    if (enumValues) {
                        return enumValues.map(v => ({
                            label: String(v),
                            kind: monaco.languages.CompletionItemKind.Value,
                            insertText: String(v),
                            range,
                            detail: schemaType ?? '',
                        }));
                    }
                    if (schemaType === 'boolean') {
                        return [
                            { label: 'true', kind: monaco.languages.CompletionItemKind.Value, insertText: 'true', range, detail: 'boolean' },
                            { label: 'false', kind: monaco.languages.CompletionItemKind.Value, insertText: 'false', range, detail: 'boolean' },
                        ];
                    }
                    return [];
                };

                // Resolves a plugin schema for the given name and category context.
                const resolvePluginSchema = (pluginName: string): MonacoJsonSchema | null => {
                    const pluginEntry = ((catalog.plugins ?? {})[pluginName] ?? {}) as Record<string, unknown>;
                    const isConsumer = category === 'consumer';
                    const pluginSchema = (isConsumer ? pluginEntry['consumer_schema'] : null) ?? pluginEntry['schema'];
                    return pluginSchema ? (pluginSchema as MonacoJsonSchema) : null;
                };

                // --- Value position detection ---
                // When the cursor is after "key: " on the same line, suggest values rather than keys.
                const lineText = model.getLineContent(line);
                const textUpToCursor = lineText.substring(0, position.column - 1);
                const isValuePosition = textUpToCursor.includes(': ');
                const keyMatch = lineText.match(/^\s*(?:-\s+)?([^:]+):\s*/);
                const currentLineKey = keyMatch ? keyMatch[1].trim() : null;

                if (isValuePosition && currentLineKey) {
                    const valuePath = [...path, currentLineKey];
                    const pluginsIdx = valuePath.indexOf('plugins');

                    if (pluginsIdx !== -1) {
                        const subPath = valuePath.slice(pluginsIdx + 1);
                        // subPath[0] is the plugin name, subPath[1+] is the nested key path
                        if (subPath.length >= 2) {
                            const pluginSchema = resolvePluginSchema(subPath[0]);
                            if (!pluginSchema) return { suggestions: [] };
                            const pluginValueSchema = walkSchemaToPath(pluginSchema, subPath.slice(1), defs);
                            if (!pluginValueSchema) return { suggestions: [] };
                            return { suggestions: buildValueItems(pluginValueSchema) };
                        }
                        return { suggestions: [] };
                    }

                    const valueSchema = walkSchemaToPath(categorySchema, valuePath, defs);
                    if (!valueSchema) return { suggestions: [] };
                    return { suggestions: buildValueItems(valueSchema) };
                }

                // --- Key completion ---
                // Plugin-aware: when the path passes through "plugins", suggest plugin names or plugin property keys.
                const pluginsIdx = path.indexOf('plugins');
                if (pluginsIdx !== -1) {
                    const subPath = path.slice(pluginsIdx + 1);

                    if (subPath.length === 0) {
                        return {
                            suggestions: Object.keys(catalog.plugins ?? {})
                                .filter(name => !existingKeys.has(name))
                                .map(name => ({
                                    label: name,
                                    kind: monaco.languages.CompletionItemKind.Module,
                                    documentation: '',
                                    insertText: name,
                                    range,
                                    detail: 'plugin',
                                })),
                        };
                    }

                    const pluginSchema = resolvePluginSchema(subPath[0]);
                    if (!pluginSchema) return { suggestions: [] };

                    const pluginTargetSchema = walkSchemaToPath(pluginSchema, subPath.slice(1), defs);
                    if (!pluginTargetSchema) return { suggestions: [] };

                    const pluginProps = (pluginTargetSchema as Record<string, unknown>).properties as Record<string, MonacoJsonSchema> | undefined;
                    return { suggestions: pluginProps ? buildKeyItems(pluginProps) : [] };
                }

                // Regular schema-based key completion.
                const targetSchema = walkSchemaToPath(categorySchema, path, defs);
                if (!targetSchema) return { suggestions: [] };

                const properties = (targetSchema as Record<string, unknown>).properties as Record<string, MonacoJsonSchema> | undefined;
                return { suggestions: properties ? buildKeyItems(properties) : [] };
            },
        });
    }
}
