import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';
import { useConfigManager } from '../../hooks/useConfigManager';

export const Header: React.FC = () => {
  const { schema, schemaLoading, fetchSchema } = useConfigManager();

  return (
    <header className="app-header">
      <div className="container header-inner">
        <Link to="/" className="brand">
          <span className="brand-accent">Frank<b>!</b></span>Gateway
        </Link>

        <nav className="nav-links">
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Dashboard
          </NavLink>

          <NavLink to="/loadConfig" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Schema Validation
          </NavLink>

          <NavLink to="/config" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Config
          </NavLink>
          <NavLink to="/designer" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Designer
          </NavLink>
        </nav>

        <div className="header-actions">
          <div className={schema ? "text-success text-small schema-status" : "text-muted text-small schema-status"}>
            {schema ? 'Schema Active' : 'Schema Missing'}
          </div>
          <button
            onClick={() => fetchSchema().catch(() => {})}
            disabled={schemaLoading}
            className={schemaLoading ? "" : "btn-primary"}
          >
            {schemaLoading ? 'Fetching...' : 'Fetch Schema'}
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
