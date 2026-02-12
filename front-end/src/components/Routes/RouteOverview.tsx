import { useFetch } from "../../hooks/useFetch";
import { CreateRoute } from "./CreateRoute.tsx";
import { Link } from "react-router-dom";

interface RouteCardProps {
    route: any;
    id?: string;
    isLive?: boolean;
}

const RouteCard: React.FC<RouteCardProps> = ({ route, id, isLive }) => {
    const isEnabled = (route.status ?? 1) === 1;
    const displayId = id || route.id || 'N/A';
    
    return (
        <div style={{ 
            border: `1px solid ${isLive ? '#ddd' : '#4CAF50'}`, 
            padding: '15px', 
            borderRadius: '8px',
            background: isLive ? '#fcfcfc' : '#fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '16px' }}>{route.name || (isLive ? `Route ${displayId}` : 'Unnamed Route')}</strong>
                {isLive && (
                    <span style={{ 
                        fontSize: '11px', padding: '2px 8px', borderRadius: '12px',
                        background: isEnabled ? '#e6fffa' : '#fff5f5',
                        color: isEnabled ? '#2c7a7b' : '#c53030',
                        border: `1px solid ${isEnabled ? '#2c7a7b' : '#c53030'}`,
                        fontWeight: 'bold'
                    }}>
                        {isEnabled ? 'LIVE' : 'DISABLED'}
                    </span>
                )}
            </div>
            
            <div style={{ margin: '10px 0' }}>
                <code style={{ background: '#f0f0f0', padding: '2px 5px', borderRadius: '3px', fontSize: '13px' }}>{route.uri}</code>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: '#666' }}>
                {route.methods && (
                    <span style={{ border: '1px solid #eee', padding: '1px 6px', borderRadius: '4px' }}>
                        Methods: {route.methods.join(', ')}
                    </span>
                )}
                {(route.upstream_id || route.upstreamId) && (
                    <span style={{ border: '1px solid #eee', padding: '1px 6px', borderRadius: '4px', background: '#f9f9f9' }}>
                        Upstream: {route.upstream_id || route.upstreamId}
                    </span>
                )}
                {route.plugins && (
                    <span style={{ border: '1px solid #eee', padding: '1px 6px', borderRadius: '4px', background: '#f9f9f9' }}>
                        Plugins: {Object.keys(route.plugins).length}
                    </span>
                )}
            </div>
        </div>
    );
};

export const RouteOverview = () => {
    const { data: liveData, loading: liveLoading, error: liveError, refetch: refetchLive } = useFetch<any>('/routes/live');
    const { data: savedRoutes, loading: savedLoading, error: savedError, refetch: refetchSaved } = useFetch<any[]>('/routes/saved');

    const isLoading = liveLoading || savedLoading;

    if (isLoading) return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2>Loading routes...</h2>
        </div>
    );

    const liveRoutes = liveData?.list || [];

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{ textDecoration: 'none', color: '#007bff' }}>← Back to Home</Link>
                <h1 style={{ margin: 0 }}>Route Management</h1>
                <div style={{ width: '100px' }}></div> {/* Spacer */}
            </div>
            
            <CreateRoute />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px' }}>
                {/* Saved Routes Section */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h2 style={{ margin: 0, fontSize: '20px' }}>YAML Config (Drafts)</h2>
                        <button onClick={refetchSaved} style={{ cursor: 'pointer' }}>Refresh</button>
                    </div>
                    
                    {savedError && <p style={{ color: 'red', background: '#fff1f0', padding: '10px' }}>{savedError}</p>}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {savedRoutes?.length === 0 ? (
                            <div style={{ padding: '30px', textAlign: 'center', border: '2px dashed #eee', borderRadius: '8px', color: '#888' }}>
                                No saved routes in YAML.
                            </div>
                        ) : (
                            savedRoutes?.map((route: any) => (
                                <RouteCard key={route.id} route={route} />
                            ))
                        )}
                    </div>
                </section>

                {/* Live Routes Section */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h2 style={{ margin: 0, fontSize: '20px' }}>Live in APISIX</h2>
                        <button onClick={refetchLive} style={{ cursor: 'pointer' }}>Refresh</button>
                    </div>

                    {liveError && <p style={{ color: 'red', background: '#fff1f0', padding: '10px' }}>Could not reach APISIX. Is it running?</p>}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {liveRoutes.length === 0 ? (
                            <div style={{ padding: '30px', textAlign: 'center', border: '2px dashed #eee', borderRadius: '8px', color: '#888' }}>
                                No routes found in APISIX.
                            </div>
                        ) : (
                            liveRoutes.map((routeItem: any) => {
                                const route = routeItem.value;
                                const id = routeItem.key.split('/').pop();
                                return <RouteCard key={routeItem.key} route={route} id={id} isLive />;
                            })
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};