import type {FieldProps} from '../SchemaFormRenderer';
import React from "react";

export interface IdFieldSettings {
    prefix?: string;
    suffix?: string;
}

export function IdField({field, value, onChange, settings}: FieldProps) {
    const s = settings as IdFieldSettings | undefined;
    const prefix = s?.prefix ?? '';
    const suffix = s?.suffix ?? '';
    const current = (value as string) ?? '';

    const hints = [prefix && `prefix: ${prefix}`, suffix && `suffix: ${suffix}`].filter(Boolean).join(', ');
    const placeholder = hints ? `id (${hints})` : 'Enter id';

    // Strip the suffix from the stored value so the user only sees what they typed
    const displayValue = suffix && current.endsWith(suffix)
        ? current.slice(0, -suffix.length)
        : current;

    function handleOnChange(e: React.ChangeEvent<HTMLInputElement>) {
        const raw = e.target.value;
        onChange?.(field.name, raw ? raw + suffix : undefined);
    }

    return (
        <div style={{display: 'flex', gap: '0.5rem'}}>
            <input
                id={field.name}
                name={field.name}
                type="text"
                placeholder={placeholder}
                value={displayValue}
                onChange={handleOnChange}
            />
        </div>
    );
}
