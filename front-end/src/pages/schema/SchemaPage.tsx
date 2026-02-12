import React from 'react';
import { useFetch } from '../../hooks/useFetch';
import { Link } from 'react-router-dom';

export const SchemaPage: React.FC = () => {
    const { data, loading, error } = useFetch<any>('/schema/route');

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px' }}>
                <Link to="/" style={{ marginRight: '15px' }}>Back to Home</Link>
                <h1>APISIX Route Schema</h1>
            </div>

            {loading && <p>Loading schema...</p>}
            {error && <div style={{ color: 'red', border: '1px solid red', padding: '10px', borderRadius: '4px' }}>
                <strong>Error:</strong> {error}
            </div>}

            {data && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Schema Definition</h3>
                    <pre style={{
                        padding: '15px',
                        textAlign: 'left',
                        fontSize: '14px',
                        lineHeight: '1.4',
                        border: '1px solid white'
                    }}>
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};
