export interface ApisixRoute {
    id: string;
    uri: string;
    name: string;
    methods: string[];
    upstreamId?: string; // Optional field
    status: 0 | 1;       // 1 = enabled, 0 = disabled
}

export interface ApiError {
    message: string;
    code?: number;
}