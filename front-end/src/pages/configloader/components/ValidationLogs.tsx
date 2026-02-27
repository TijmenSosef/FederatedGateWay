import { type ValidationLog } from '../../../actions/SchemaValidation';

interface ValidationLogsProps {
    logs: ValidationLog[];
    onClear: () => void;
}

export const ValidationLogs = ({ logs, onClear }: ValidationLogsProps) => {
    return (
        <div className="card flex flex-column config-card">
            <div className="flex justify-between align-center card-header">
                Validation Results
                <button className="text-small btn-icon" onClick={onClear}>Clear</button>
            </div>
            <div className="flex flex-column gap-sm scroll-y log-container">
                {logs.map(log => (
                    <div key={log.id} className={`log-item ${log.type}`}>
                        <div className="flex justify-between mb-1 log-header">
                            <strong className="log-type">{log.type}</strong>
                            <span>{log.timestamp}</span>
                        </div>
                        <div className="log-message">{log.message}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
