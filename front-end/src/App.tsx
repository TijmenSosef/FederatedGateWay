import './App.css'
import {Routes, Route, Link} from 'react-router-dom';
import {Dashboard} from "./components/Dashboard/Dashboard.tsx";
import {Config} from "./pages/config/Config.tsx";
import {RouteOverview} from "./components/Routes/RouteOverview.tsx";
import {SchemaPage} from "./pages/schema/SchemaPage.tsx";
import {RouteDesigner} from "./pages/designer/RouteDesigner.tsx";
import {GitConfig} from "./pages/gitConfig/GitConfig.tsx";

const Home = () => {
    return (
        <>
            <h1>WeAreFrank APISIX</h1>
            <div style={{textAlign: 'center', marginTop: '50px'}}>
                <nav style={{display: 'flex', gap: '20px', justifyContent: 'center'}}>
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/config">Configuration</Link>
                    <Link to="/routes">Routes</Link>
                    <Link to="/designer">Route Designer</Link>
                    <Link to="/schema">Route Schema</Link>
                </nav>
            </div>
        </>
    );
};

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/dashboard" element={<Dashboard/>}/>
            <Route path="/config" element={<Config/>}/>
            <Route path="/routes" element={<RouteOverview/>}/>
            <Route path="/schema" element={<SchemaPage/>}/>
            <Route path="/designer" element={<RouteDesigner/>}/>
            <Route path="/gitConfig" element={<GitConfig/>}/>
        </Routes>
    )
}

export default App