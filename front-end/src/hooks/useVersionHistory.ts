import { client } from '../api/client';
import { useFetch } from './useFetch';

export interface VersionSummary {
    id: string;
    message: string;
    createdAt: string;
}

interface VersionDetail extends VersionSummary {
    content: string;
}

interface UseVersionHistory {
    versions: VersionSummary[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
    saveVersion: (message: string, content: string) => Promise<void>;
    deleteVersion: (id: string) => Promise<void>;
    fetchVersionContent: (id: string) => Promise<string>;
}

export function useVersionHistory(): UseVersionHistory {
    const { data, loading, error, refetch } = useFetch<VersionSummary[]>('/versions');

    const saveVersion = async (message: string, content: string): Promise<void> => {
        await client<VersionSummary>('/versions', { body: { message, content } });
        refetch();
    };

    const deleteVersion = async (id: string): Promise<void> => {
        await client<void>(`/versions/${id}`, { method: 'DELETE' });
        refetch();
    };

    const fetchVersionContent = async (id: string): Promise<string> => {
        const detail = await client<VersionDetail>(`/versions/${id}`, { method: 'GET' });
        return detail.content;
    };

    return {
        versions: data ?? [],
        loading,
        error,
        refetch,
        saveVersion,
        deleteVersion,
        fetchVersionContent,
    };
}
