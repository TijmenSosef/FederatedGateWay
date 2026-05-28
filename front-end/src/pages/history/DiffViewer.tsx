import React, { useMemo } from 'react';
import { diffLines } from 'diff';
import styles from './DiffViewer.module.css';

interface DiffViewerProps {
    fromContent: string | null;
    toContent: string | null;
    fromLabel: string;
    toLabel: string;
    loading: boolean;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
    fromContent,
    toContent,
    fromLabel,
    toLabel,
    loading,
}) => {
    const lines = useMemo(() => {
        if (!fromContent || !toContent) return null;
        return diffLines(fromContent, toContent);
    }, [fromContent, toContent]);

    if (loading) {
        return <div className={`text-muted text-small ${styles.placeholder}`}>Loading...</div>;
    }

    if (!lines) {
        return (
            <div className={`text-muted text-small ${styles.placeholder}`}>
                Select two versions to compare
            </div>
        );
    }

    const renderedLines: React.ReactNode[] = [];

    lines.forEach((change, changeIndex) => {
        const prefix = change.added ? '+' : change.removed ? '-' : ' ';
        const lineClass = change.added ? styles.lineAdded : change.removed ? styles.lineRemoved : styles.lineContext;

        change.value.replace(/\n$/, '').split('\n').forEach((text, lineIndex) => {
            renderedLines.push(
                <div key={`${changeIndex}-${lineIndex}`} className={`${styles.diffLine} ${lineClass}`}>
                    <span className={styles.gutter}>{prefix}</span>
                    <span className={styles.lineContent}>{text || ' '}</span>
                </div>
            );
        });
    });

    const hasChanges = lines.some(c => c.added || c.removed);

    return (
        <div className={styles.diffWrapper}>
            <div className={styles.diffHeader}>
                <span className={styles.diffLabel}>{fromLabel}</span>
                <span className={styles.diffArrow}>→</span>
                <span className={styles.diffLabel}>{toLabel}</span>
                {!hasChanges && <span className="text-muted text-small">No differences</span>}
            </div>
            <div className={styles.diffContainer}>
                {renderedLines}
            </div>
        </div>
    );
};
