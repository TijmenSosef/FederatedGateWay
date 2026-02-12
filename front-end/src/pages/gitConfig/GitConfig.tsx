import { useEffect, useState } from "react";

export const GitConfig = () => {
    // We default to the standard path defined in your Java Service
    const [currentPath, setCurrentPath] = useState('/tmp/local-workspace');
    const [status, setStatus] = useState<any>(null);
    const [message, setMessage] = useState('');

    // 1. INIT: Resets to the default "Fake Remote" and "Local Workspace"
    const handleInit = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/git/init', { method: 'POST' });
            const msg = await res.text();

            setMessage(msg);
            setCurrentPath('/tmp/local-workspace'); // Reset path to default
        } catch (e) {
            console.error(e);
        }
    };

    const handleSwitch = async () => {
        const newPath = prompt("Enter path for new workspace:", "/tmp/workspace-2");
        if (!newPath) return;

        try {
            const res = await fetch('http://localhost:8080/api/git/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: newPath })
            });
            const msg = await res.text();

            setMessage(msg);
            setCurrentPath(newPath); // Update our state to point to the new folder
        } catch (e) {
            console.error(e);
        }
    };

    // 3. CHECK STATUS: Now dynamic based on 'currentPath'
    const checkStatus = async () => {
        try {
            // We pass the path so the backend knows which folder to check
            const res = await fetch(`http://localhost:8080/api/git/status?path=${currentPath}`);
            const data = await res.json();
            setStatus(data);
        } catch (err) {
            console.error(err);
        }
    };

    // Re-check status whenever the Current Path changes (e.g. after a switch)
    useEffect(() => { checkStatus(); }, [currentPath]);

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '400px' }}>
            <h3>Git Workspace Tester</h3>

            {/* Status Display */}
            <div style={{ marginBottom: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
                <div style={{fontSize: '11px', color: '#555', marginBottom: '5px'}}>
                    CURRENT PATH: {currentPath}
                </div>

                <strong>Status: </strong>
                <span style={{ color: status?.status === 'OK' ? 'green' : 'red', fontWeight: 'bold' }}>
                    {status ? status.status : 'Loading...'}
                </span>

                {status?.status === 'OK' && (
                    <div style={{ fontSize: '12px', marginTop: '5px', color: '#666', fontFamily: 'monospace' }}>
                        HEAD: {status.head?.substring(0, 7)}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                <button
                    onClick={handleInit}
                    style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Reset to Default Workspace
                </button>

                <button
                    onClick={handleSwitch}
                    style={{ padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Switch / Create New Workspace...
                </button>
            </div>

            {message && <p style={{ fontSize: '13px', color: '#28a745', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                LOG: {message}
            </p>}
        </div>
    );
};