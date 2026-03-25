import { useEffect } from 'react';
import { useConfigManager } from '../../hooks/useConfigManager';

export const RouteDesigner = () => {
    const { configManager, config, schema } = useConfigManager();

    useEffect(() => {
        console.log('config', config);
        console.log('schema', schema);
    }, [config, schema]);

    return (
        <>
            <div>form</div>
            <form>
                <input type="text" />
            </form>
        </>
    );
};
