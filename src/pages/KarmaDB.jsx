import React from 'react';

const KarmaDB = () => {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">KarmaDB Admin</h1>
            <p className="text-[var(--text-secondary)]">Database management and system settings.</p>
            <div className="mt-8 p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg">
                <p className="text-sm font-mono text-[var(--accent-primary)]">Status: Active</p>
                <p className="text-sm text-[var(--text-secondary)] mt-2">Only administrators can access this area.</p>
            </div>
        </div>
    );
};

export default KarmaDB;
