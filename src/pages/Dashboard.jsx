import React from 'react';
import { LayoutGrid, Users, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate('/login');
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <aside style={{ width: '250px', backgroundColor: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', padding: '1.5rem' }} className="flex flex-col">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', color: 'var(--accent-primary)' }}>Karma</h2>

                <nav className="flex flex-col" style={{ gap: '0.5rem', flex: 1 }}>
                    <NavItem icon={<LayoutGrid size={20} />} label="Dashboard" active />
                    <NavItem icon={<Users size={20} />} label="Users" />
                    <NavItem icon={<Settings size={20} />} label="Settings" />
                </nav>

                <button onClick={handleLogout} className="flex items-center" style={{ gap: '0.75rem', color: 'var(--text-secondary)', padding: '0.75rem', borderRadius: '0.5rem', marginTop: 'auto', background: 'transparent', width: '100%' }}>
                    <LogOut size={20} />
                    <span>Sign Out</span>
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1" style={{ padding: '2rem', overflowY: 'auto' }}>
                <header className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.8rem' }}>Dashboard</h1>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        U
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    <Card title="Total Users" value="1,234" />
                    <Card title="Active Sessions" value="56" />
                    <Card title="Revenue" value="$12,345" />
                </div>
            </main>
        </div>
    );
};

const NavItem = ({ icon, label, active }) => (
    <div className="flex items-center" style={{
        gap: '0.75rem',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        backgroundColor: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        color: active ? 'var(--accent-primary)' : 'var(--text-secondary)'
    }}>
        {icon}
        <span>{label}</span>
    </div>
);

const Card = ({ title, value }) => (
    <div style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '1.5rem',
        borderRadius: '1rem',
        border: '1px solid var(--border-color)'
    }}>
        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{title}</h3>
        <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{value}</p>
    </div>
);

export default Dashboard;
