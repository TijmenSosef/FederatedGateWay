import React, { useState } from 'react';
import { type VersionSummary } from '../../hooks/useVersionHistory';
import { formatRelativeTime } from '../../utils/time';
import styles from './VersionList.module.css';

interface VersionListProps {
    versions: VersionSummary[];
    currentSentinel: string;
    onView: (version: VersionSummary) => void;
    onRestore: (version: VersionSummary) => void;
    onDelete: (id: string) => void;
}

interface VersionRowProps {
    version: VersionSummary;
    isCurrent: boolean;
    onView: () => void;
    onRestore: () => void;
    onDelete: () => void;
}

const VersionRow: React.FC<VersionRowProps> = ({ version, isCurrent, onView, onRestore, onDelete }) => {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const shortId = version.id.slice(0, 7);

    return (
        <div className={styles.row}>
            <div className={styles.rowMain}>
                <span className={styles.hash}>{shortId}</span>
                <span className={version.message ? styles.message : styles.noMessage}>
                    {version.message || '(no message)'}
                </span>
                {!isCurrent && <span className={styles.time}>{formatRelativeTime(version.createdAt)}</span>}
            </div>
            <div className={styles.rowActions}>
                <button className="text-small" onClick={onView}>View</button>
                {!isCurrent && <button className="text-small" onClick={onRestore}>Restore</button>}
                {!isCurrent && (confirmDelete ? (
                    <>
                        <span className={`text-small text-muted`}>Delete?</span>
                        <button className={`text-small ${styles.dangerBtn}`} onClick={onDelete}>Yes</button>
                        <button className="text-small" onClick={() => setConfirmDelete(false)}>No</button>
                    </>
                ) : (
                    <button className="text-small" onClick={() => setConfirmDelete(true)}>Delete</button>
                ))}
            </div>
        </div>
    );
};

export const VersionList: React.FC<VersionListProps> = ({ versions, currentSentinel, onView, onRestore, onDelete }) => {
    if (versions.length === 0) {
        return (
            <div className={`text-muted text-small ${styles.empty}`}>
                No versions saved yet. Use "Save Version" from the YAML Editor to get started.
            </div>
        );
    }

    return (
        <div className={styles.list}>
            {versions.map(version => (
                <VersionRow
                    key={version.id}
                    version={version}
                    isCurrent={version.id === currentSentinel}
                    onView={() => onView(version)}
                    onRestore={() => onRestore(version)}
                    onDelete={() => onDelete(version.id)}
                />
            ))}
        </div>
    );
};
