import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVersionHistory, type VersionSummary } from '../../hooks/useVersionHistory';
import { useConfigManager } from '../../hooks/useConfigManager';
import { VersionList } from './VersionList';
import { DiffViewer } from './DiffViewer';
import styles from './HistoryPage.module.css';

const CURRENT_SENTINEL = '__current__';

export const HistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const { configManager, setConfig } = useConfigManager();
    const { versions, loading, error, saveVersion, deleteVersion, fetchVersionContent } = useVersionHistory();

    const [saveFormOpen, setSaveFormOpen] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [saving, setSaving] = useState(false);

    const [fromId, setFromId] = useState<string>('');
    const [toId, setToId] = useState<string>(CURRENT_SENTINEL);
    const [fromContent, setFromContent] = useState<string | null>(null);
    const [toContent, setToContent] = useState<string | null>(null);
    const [fromLabel, setFromLabel] = useState('');
    const [toLabel, setToLabel] = useState('');
    const [diffLoading, setDiffLoading] = useState(false);

    const handleSaveSubmit = async () => {
        setSaving(true);
        try {
            await saveVersion(saveMessage, configManager.getRawText());
            setSaveFormOpen(false);
            setSaveMessage('');
        } finally {
            setSaving(false);
        }
    };

    const handleView = (version: VersionSummary) => {
        if (version.id === CURRENT_SENTINEL) {
            const latestVersion = versions[0];
            if (latestVersion) {
                loadDiff(latestVersion.id, CURRENT_SENTINEL);
            }
            return;
        }
        const currentIndex = versions.findIndex(v => v.id === version.id);
        const previousVersion = versions[currentIndex + 1];
        if (previousVersion) {
            loadDiff(previousVersion.id, version.id);
        } else {
            loadDiff(version.id, CURRENT_SENTINEL);
        }
    };

    const handleRestore = async (version: VersionSummary) => {
        setDiffLoading(true);
        try {
            const content = await fetchVersionContent(version.id);
            setConfig(content);
            navigate('/yamlEditor');
        } finally {
            setDiffLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        await deleteVersion(id);
        if (fromId === id) {
            setFromId('');
            setFromContent(null);
        }
        if (toId === id) {
            setToId('');
            setToContent(null);
        }
    };

    const loadDiff = async (newFromId: string, newToId: string) => {
        setFromId(newFromId);
        setToId(newToId);
        setFromContent(null);
        setToContent(null);

        if (!newFromId && !newToId) return;

        setDiffLoading(true);
        try {
            let resolvedFrom: string | null = null;
            let resolvedTo: string | null = null;

            if (newFromId === CURRENT_SENTINEL) {
                resolvedFrom = configManager.getRawText();
            } else if (newFromId) {
                resolvedFrom = await fetchVersionContent(newFromId);
            }

            if (newToId === CURRENT_SENTINEL) {
                resolvedTo = configManager.getRawText();
            } else if (newToId) {
                resolvedTo = await fetchVersionContent(newToId);
            }

            setFromContent(resolvedFrom);
            setToContent(resolvedTo);

            const fromVersion = versions.find(v => v.id === newFromId);
            const toVersion = versions.find(v => v.id === newToId);
            const fromLabel = newFromId === CURRENT_SENTINEL
                ? 'Current (unsaved)'
                : fromVersion ? fromVersion.id.slice(0, 7) + (fromVersion.message ? ` ${fromVersion.message}` : '') : '(empty)';
            setFromLabel(fromLabel);
            setToLabel(newToId === CURRENT_SENTINEL ? 'Current (unsaved)' : toVersion ? toVersion.id.slice(0, 7) + (toVersion.message ? ` ${toVersion.message}` : '') : '');
        } finally {
            setDiffLoading(false);
        }
    };

    const handleFromChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        loadDiff(e.target.value, toId);
    };

    const handleToChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        loadDiff(fromId, e.target.value);
    };

    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.layout}>
                <div className={`card flex flex-column ${styles.leftPanel}`}>
                    <div className="card-header flex justify-between align-center">
                        <span>Version History</span>
                        <button
                            className="btn-primary text-small"
                            onClick={() => setSaveFormOpen(open => !open)}
                        >
                            Save Version
                        </button>
                    </div>

                    {saveFormOpen && (
                        <div className={styles.saveForm}>
                            <input
                                type="text"
                                placeholder="Describe this snapshot..."
                                value={saveMessage}
                                onChange={e => setSaveMessage(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSaveSubmit(); }}
                                className={styles.saveInput}
                                autoFocus
                            />
                            <div className="flex gap-sm">
                                <button
                                    className="btn-primary text-small"
                                    onClick={handleSaveSubmit}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                                <button className="text-small" onClick={() => { setSaveFormOpen(false); setSaveMessage(''); }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {loading && <div className={`text-muted text-small ${styles.statusMsg}`}>Loading versions...</div>}
                    {error && <div className={`text-error text-small ${styles.statusMsg}`}>{error}</div>}

                    {!loading && (
                        <VersionList
                            versions={[{ id: CURRENT_SENTINEL, message: 'Current (unsaved)', createdAt: '' }, ...versions]}
                            currentSentinel={CURRENT_SENTINEL}
                            onView={handleView}
                            onRestore={handleRestore}
                            onDelete={handleDelete}
                        />
                    )}
                </div>

                <div className={`card flex flex-column ${styles.rightPanel}`}>
                    <div className="card-header flex align-center gap-sm flex-wrap">
                        <span>Compare</span>
                        <select
                            className={`text-small ${styles.compareSelect}`}
                            value={fromId}
                            onChange={handleFromChange}
                        >
                            <option value="">-- From --</option>
                            <option value={CURRENT_SENTINEL}>Current (unsaved)</option>
                            {versions.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.id.slice(0, 7)}{v.message ? ` ${v.message}` : ''}
                                </option>
                            ))}
                        </select>
                        <span className="text-muted text-small">→</span>
                        <select
                            className={`text-small ${styles.compareSelect}`}
                            value={toId}
                            onChange={handleToChange}
                        >
                            <option value="">-- To --</option>
                            <option value={CURRENT_SENTINEL}>Current (unsaved)</option>
                            {versions.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.id.slice(0, 7)}{v.message ? ` ${v.message}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.diffArea}>
                        <DiffViewer
                            fromContent={fromContent}
                            toContent={toContent}
                            fromLabel={fromLabel}
                            toLabel={toLabel}
                            loading={diffLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
