import { useConfigManager } from '../../hooks/useConfigManager';

export const RouteDesigner = () => {
    const { configManager, config } = useConfigManager();

    console.log('config', config);
    console.log('schema', configManager.getSchema());

    return (
        <>
            <div>form</div>
            <form>
                <input type="text" />
            </form>
        </>
    );
};
