import { useState } from "react";

interface Props {
    url: string;
    apiKey: string;
    onUrlChange: (val: string) => void;
    onKeyChange: (val: string) => void;
    onTestConnection: () => Promise<boolean>;
    onSave: () => void; // Added onSave prop
}

export const ApisixSettings = ({ url, apiKey, onUrlChange, onKeyChange, onTestConnection, onSave }: Props) => {
    const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "fail">("idle");

    const handleTestClick = async () => {
        setTestStatus("testing");
        const isValid = await onTestConnection();
        setTestStatus(isValid ? "success" : "fail");
    };

    return (
        <div style={{ border: '1px solid #444', padding: '20px', borderRadius: '8px', marginBottom: '20px', textAlign: 'left' }}>
            <h3 style={{ marginTop: 0 }}>APISIX Configuration</h3>
            <table style={{ width: '100%', borderSpacing: '0 10px' }}>
                <tbody>
                <tr>
                    <td style={{ width: '120px', fontWeight: 'bold' }}>Base URL:</td>
                    <td>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => onUrlChange(e.target.value)}
                            placeholder="http://127.0.0.1:9180"
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                        />
                    </td>
                </tr>
                <tr>
                    <td style={{ fontWeight: 'bold' }}>Admin Key:</td>
                    <td>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => onKeyChange(e.target.value)}
                            placeholder="Enter Admin Key"
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                        />
                    </td>
                </tr>
                </tbody>
            </table>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button onClick={handleTestClick} disabled={testStatus === "testing"}>
                    Test Connection
                </button>

                <button onClick={onSave} style={{ backgroundColor: '#646cff', color: 'white' }}>
                    Save Settings
                </button>

                {/* Status Indicator */}
                <span style={{ marginLeft: '10px' }}>
                    {testStatus === "testing" && <span>Connecting...</span>}
                    {testStatus === "success" && <span style={{ color: 'green', fontWeight: 'bold' }}>Connected</span>}
                    {testStatus === "fail" && <span style={{ color: 'red', fontWeight: 'bold' }}>Failed</span>}
                </span>
            </div>
        </div>
    );
};