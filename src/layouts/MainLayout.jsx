import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { ChevronDown } from 'lucide-react';

const MainLayout = () => {
    const { user } = useUser();
    const { signOut } = useClerk();
    const navigate = useNavigate();

    // State
    const [isSitesOpen, setIsSitesOpen] = useState(false);
    const [isKarmaOpen, setIsKarmaOpen] = useState(false);

    // Refs
    const sitesDropdownRef = useRef(null);
    const karmaDropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            // Close Sites Dropdown if clicked outside
            if (sitesDropdownRef.current && !sitesDropdownRef.current.contains(event.target)) {
                setIsSitesOpen(false);
            }
            // Close Karma Dropdown if clicked outside
            if (karmaDropdownRef.current && !karmaDropdownRef.current.contains(event.target)) {
                setIsKarmaOpen(false);
            }
        }
        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [sitesDropdownRef, karmaDropdownRef]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    // Get initials if no image
    const initials = user?.firstName
        ? user.firstName[0].toUpperCase()
        : user?.username
            ? user.username[0].toUpperCase()
            : 'U';

    const showImage = user?.hasImage;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
            {/* Top Header */}
            <header style={{
                height: '80px',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 40px', // px-10 equivalent
                position: 'sticky',
                top: 0,
                zIndex: 50
            }}>
                {/* Left: Logo */}
                <div style={{ flexShrink: 0 }}>
                    <Link to="/dashboard" style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '0.05em', color: 'var(--accent-primary)', textDecoration: 'none' }}>
                        CARTWRIGHT
                    </Link>
                </div>

                {/* Center: Navigation */}
                <nav style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '48px', // gap-12 equivalent
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)'
                }}>
                    <Link to="/family-feed" style={{ color: 'var(--text-secondary)', fontWeight: 500, transition: 'color 0.2s', textDecoration: 'none' }}
                        onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                        Family Feed
                    </Link>

                    {/* Cartwright Sites Dropdown */}
                    <div ref={sitesDropdownRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => setIsSitesOpen(!isSitesOpen)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: 'var(--text-secondary)',
                                fontWeight: 500,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                fontSize: '1rem'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                        >
                            Cartwright Sites
                            <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: isSitesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                        </button>

                        {isSitesOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                marginTop: '8px',
                                width: '192px',
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                overflow: 'hidden',
                                zIndex: 60
                            }}>
                                <Link
                                    to="/beerjuvenation"
                                    style={{ display: 'block', padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'background-color 0.2s' }}
                                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                    onClick={() => setIsSitesOpen(false)}
                                >
                                    Beerjuvenation
                                </Link>
                                <Link
                                    to="/holiday-photos"
                                    style={{ display: 'block', padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'background-color 0.2s' }}
                                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                    onClick={() => setIsSitesOpen(false)}
                                >
                                    Holiday Photos
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Admin Only Links */}
                    {user?.publicMetadata?.role === 'admin' && (
                        <>
                            {/* KarmaDB Dropdown */}
                            <div ref={karmaDropdownRef} style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setIsKarmaOpen(!isKarmaOpen)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        color: 'var(--text-secondary)',
                                        fontWeight: 500,
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 0,
                                        fontSize: '1rem'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                                >
                                    KarmaDB
                                    <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: isKarmaOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                </button>

                                {isKarmaOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        marginTop: '8px',
                                        width: '192px',
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        overflow: 'hidden',
                                        zIndex: 60
                                    }}>
                                        <Link to="/karmadb/today" style={{ display: 'block', padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'background-color 0.2s' }} onClick={() => setIsKarmaOpen(false)} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                                            Today
                                        </Link>
                                        <Link to="/karmadb/health" style={{ display: 'block', padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'background-color 0.2s' }} onClick={() => setIsKarmaOpen(false)} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                                            Health
                                        </Link>
                                        <Link to="/karmadb/auto" style={{ display: 'block', padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'background-color 0.2s' }} onClick={() => setIsKarmaOpen(false)} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                                            Auto
                                        </Link>
                                        <Link to="/karmadb/stats" style={{ display: 'block', padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'background-color 0.2s' }} onClick={() => setIsKarmaOpen(false)} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                                            Stats
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <Link to="/beer" style={{ color: 'var(--text-secondary)', fontWeight: 500, transition: 'color 0.2s', textDecoration: 'none' }}
                                onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                            >
                                Beer
                            </Link>
                            <Link to="/media" style={{ color: 'var(--text-secondary)', fontWeight: 500, transition: 'color 0.2s', textDecoration: 'none' }}
                                onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                            >
                                Media
                            </Link>
                            <Link to="/events" style={{ color: 'var(--text-secondary)', fontWeight: 500, transition: 'color 0.2s', textDecoration: 'none' }}
                                onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                            >
                                Events
                            </Link>
                        </>
                    )}
                </nav>

                {/* Right: User Profile */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={() => navigate('/profile')}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            color: '#fff',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        {showImage ? (
                            <img src={user.imageUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span>{initials}</span>
                        )}
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
