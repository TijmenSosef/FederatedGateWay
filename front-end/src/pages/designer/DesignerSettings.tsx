import {useState} from 'react';
import type {SchemaField} from '../../actions/SchemaFormGenerator';
import type {IdFieldSettings} from '../../components/SchemaFormRenderer/IdField/IdField';
import {type DesignerSettingsManager} from '../../hooks/useDesignerSettings';
import styles from './DesignerSettings.module.css';

interface DesignerSettingsProps {
    category: string;
    fields: SchemaField[];
    settings: DesignerSettingsManager;
    onSettingsChange: (settings: DesignerSettingsManager) => void;
}

export function DesignerSettings({category, fields, settings, onSettingsChange}: DesignerSettingsProps) {
    const [collapsed, setCollapsed] = useState(true);
    const [inputValue, setInputValue] = useState('');

    const priorityMap = settings.getPriorityMap();
    const currentList = priorityMap[category] ?? [];
    const idSettings = (settings.getMergedOverrides(category)['id'] ?? {}) as IdFieldSettings;
    const availableFields = fields.map(f => f.name).filter(n => !currentList.includes(n));
    const listId = 'settings-priority-datalist';

    const trimmedInput = inputValue.trim();
    const isValidInput = trimmedInput.length > 0 && !currentList.includes(trimmedInput);

    function applyPriorityList(newList: string[]) {
        const newMap = { ...priorityMap, [category]: newList };
        onSettingsChange(settings.withPriorityMap(newMap));
    }

    function handleAdd() {
        if (!isValidInput) return;
        applyPriorityList(currentList.concat(trimmedInput));
        setInputValue('');
    }

    function handleRemove(fieldName: string) {
        applyPriorityList(currentList.filter(f => f !== fieldName));
    }

    function handleMoveUp(i: number) {
        if (i === 0) return;
        const newList = currentList.slice();
        const temp = newList[i - 1];
        newList[i - 1] = newList[i];
        newList[i] = temp;
        applyPriorityList(newList);
    }

    function handleMoveDown(i: number) {
        if (i === currentList.length - 1) return;
        const newList = currentList.slice();
        const temp = newList[i + 1];
        newList[i + 1] = newList[i];
        newList[i] = temp;
        applyPriorityList(newList);
    }

    return (
        <div className="card">
            <div className={`card-header ${styles.header}`} onClick={() => setCollapsed(c => !c)}>
                Settings
                <span className={styles.chevron}>{collapsed ? 'Open' : 'Close'}</span>
            </div>
            {!collapsed && (
                <div className={styles.body}>
                    <p className={styles.sectionLabel}>Priority fields for <strong>{category}</strong></p>
                    <ul className={styles.priorityList}>
                        {currentList.length === 0 && (
                            <li className={styles.emptyState}>No priority fields — add one below</li>
                        )}
                        {currentList.map((name, i) => (
                            <li key={name} className={styles.priorityItem}>
                                <span className={styles.fieldName}>{name}</span>
                                <div className={styles.itemActions}>
                                    <button type="button" disabled={i === 0}
                                            onClick={() => handleMoveUp(i)}>up</button>
                                    <button type="button" disabled={i === currentList.length - 1}
                                            onClick={() => handleMoveDown(i)}>down</button>
                                    <button type="button" className={styles.removeButton}
                                            onClick={() => handleRemove(name)}>x</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className={styles.addRow}>
                        <input
                            type="text"
                            list={listId}
                            value={inputValue}
                            placeholder="Add a field..."
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        />
                        <datalist id={listId}>
                            {availableFields.map(f => <option key={f} value={f}/>)}
                        </datalist>
                        <button type="button" onClick={handleAdd} disabled={!isValidInput}>
                            Add
                        </button>
                    </div>

                    <p className={styles.sectionLabel} style={{marginTop: '16px'}}>
                        ID field settings for <strong>{category}</strong>
                    </p>
                    <div className={styles.addRow}>
                        <label htmlFor="id-suffix-input">Suffix</label>
                        <input
                            id="id-suffix-input"
                            type="text"
                            placeholder="e.g. -dev"
                            value={idSettings.suffix ?? ''}
                            onChange={e => onSettingsChange(settings.withCategoryOverride(category, 'id', { ...idSettings, suffix: e.target.value || undefined }))}
                        />
                    </div>
                    <DomainDesigner
                        category={category}
                        domains={settings.getDomains()}
                        subDomains={settings.getSubDomains()}
                        onDomainsChange={d => onSettingsChange(settings.withDomains(d))}
                        onSubDomainsChange={s => onSettingsChange(settings.withSubDomains(s))}
                    />
                </div>
            )}
        </div>
    );
}

interface DomainDesignerProps {
    category: string;
    domains: string[];
    subDomains: Record<string, string[]>;
    onDomainsChange: (domains: string[]) => void;
    onSubDomainsChange: (subDomains: Record<string, string[]>) => void;
}

function DomainDesigner({category, domains, subDomains, onDomainsChange, onSubDomainsChange}: DomainDesignerProps)  {

    const [domainInput, setDomainInput] = useState<string>('')
    const [subDomainInput, setSubDomainInput] = useState<string>('')
    const [selectedDomain, setSelectedDomain] = useState<string>('')

    const trimmedInput = domainInput.trim();
    const isValidInput = trimmedInput !== '' && !domains.includes(trimmedInput);

    function addDomain() {
        if (!isValidInput) return;
        onDomainsChange([...domains, trimmedInput]);
        setDomainInput('');
    }

    function addSubDomain() {
        const trimmedSubDomain = subDomainInput.trim();
        if (selectedDomain === '' || trimmedSubDomain === '') return;

        onSubDomainsChange({
            ...subDomains,
            [selectedDomain]: [...(subDomains[selectedDomain] || []), trimmedSubDomain]
        });
        setSubDomainInput('');
    }


    return (
        <div>
            <p className={styles.sectionLabel} style={{marginTop: '16px'}}>
                ID domain settings for <strong>{category}</strong>
            </p>
            <div className={styles.addRow}>
                <label htmlFor={"domain-input"}>new Domain</label>
                <input
                    id={"domain-input"}
                    type={"text"}
                    value={domainInput}
                    onChange={e => setDomainInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addDomain()}
                />
                <button type="button"  onClick={addDomain} disabled={!isValidInput}>add</button>
            </div>

            {domains.map((domain) => (
                <div key={domain}>
                    {domain}

                    {selectedDomain !== domain &&
                        <button onClick={() => setSelectedDomain(domain)}>Select</button>
                    }
                </div>
            ))}

            {selectedDomain &&
                <div>
                    <p className={styles.sectionLabel} style={{marginTop: '16px'}}>
                        Subdomains for <strong>{selectedDomain}</strong>
                    </p>
                    <div className={styles.priorityList}>
                        {subDomains[selectedDomain]?.map((sub) => (
                            <div key={sub} className={styles.priorityItem}>
                                <span className={styles.fieldName}>{sub}</span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.addRow}>
                        <label htmlFor={"subdomain-input"}>new SubDomain</label>
                        <input
                            id={"subdomain-input"}
                            type={"text"}
                            value={subDomainInput}
                            onChange={e => setSubDomainInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addSubDomain()}
                        />
                        <button type="button" onClick={addSubDomain} disabled={subDomainInput.trim() === ''}>add</button>
                    </div>
                    {subDomains[selectedDomain]?.map((subDomain) => (
                        <div key={subDomain}>
                            {subDomain}
                        </div>
                    ))}
                </div>
            }
        </div>
    )
}