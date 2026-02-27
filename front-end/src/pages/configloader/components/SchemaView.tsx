interface SchemaViewProps {
    schema: Record<string, unknown> | null;
}

export const SchemaView = ({ schema }: SchemaViewProps) => {
    return (
        <div className="card mt-4 config-card">
            <div className="card-header bold">
                Reference Schema
            </div>
            <div className="scroll-y schema-container">
                {schema ? (
                    <pre className="schema-pre">{JSON.stringify(schema, null, 2)}</pre>
                ) : (
                    <div className="text-muted text-small italic">Fetch schema...</div>
                )}
            </div>
        </div>
    );
};
