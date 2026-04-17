import React, { useState, useEffect } from 'react';
import { UserProfile, useUser } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { User, Phone, Globe, Save, Loader } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';

const Profile = () => {
    const { user } = useUser();
    const [familyProfile, setFamilyProfile] = useState(null);
    const [isLinked, setIsLinked] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
    const [formData, setFormData] = useState({ phone: '', website: '' });

    useEffect(() => {
        if (!user?.id) return;
        const load = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/my-family-profile?clerk_user_id=${user.id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data) {
                        setIsLinked(true);
                        setFamilyProfile(data);
                        setFormData({
                            phone: data.family_phone || '',
                            website: data.family_website || '',
                        });
                    } else {
                        setIsLinked(false);
                    }
                }
            } catch (e) {
                console.error('Failed to load family profile', e);
            }
            setIsLoading(false);
        };
        load();
    }, [user?.id]);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveStatus(null);
        try {
            let updatedImageUrl = familyProfile?.family_image_url || null;

            if (avatarFile) {
                const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(avatarFile.name)}`, {
                    method: 'POST',
                    body: avatarFile,
                });
                if (uploadRes.ok) {
                    const blobData = await uploadRes.json();
                    updatedImageUrl = blobData.url;
                }
            }

            const res = await fetch(`/api/my-family-profile?clerk_user_id=${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: formData.phone,
                    website: formData.website,
                    family_image_url: updatedImageUrl,
                }),
            });

            if (res.ok) {
                setSaveStatus('success');
                setFamilyProfile(prev => ({ ...prev, family_phone: formData.phone, family_website: formData.website, family_image_url: updatedImageUrl }));
                setAvatarFile(null);
            } else {
                setSaveStatus('error');
            }
        } catch (e) {
            setSaveStatus('error');
        }
        setIsSaving(false);
        setTimeout(() => setSaveStatus(null), 3000);
    };

    const inputStyle = {
        width: '100%', boxSizing: 'border-box',
        backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)',
        borderRadius: '10px', padding: '12px 14px', fontSize: '0.9rem',
        color: 'var(--text-primary)', outline: 'none',
    };
    const labelStyle = {
        display: 'block', fontSize: '0.72rem', fontWeight: 700,
        marginBottom: '6px', color: 'var(--text-secondary)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px', gap: '32px', width: '100%', boxSizing: 'border-box' }}>

            {/* Clerk built-in profile (password, email, 2FA, avatar) */}
            <UserProfile
                path="/profile"
                routing="path"
                appearance={{
                    baseTheme: dark,
                    variables: {
                        colorPrimary: '#3b82f6',
                        colorBackground: '#1e293b',
                        colorText: '#f8fafc',
                        colorTextSecondary: '#94a3b8',
                        fontFamily: 'Inter, system-ui, sans-serif'
                    },
                    elements: {
                        rootBox: { width: '100%', maxWidth: '1000px', margin: '0 auto' },
                        card: { boxShadow: 'none', border: '1px solid var(--border-color)' }
                    }
                }}
            />

            {/* Family Details Section */}
            <div style={{ width: '100%', maxWidth: '1000px' }}>
                <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>

                    {/* Card header */}
                    <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ backgroundColor: 'rgba(59,130,246,0.1)', padding: '8px', borderRadius: '10px', color: 'var(--accent-primary)' }}>
                            <User size={20} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Family Details</h2>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Your info in the Cartwright family directory</p>
                        </div>
                    </div>

                    <div style={{ padding: '28px' }}>
                        {isLoading ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                                <Loader size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                                <div>Loading your family profile...</div>
                            </div>
                        ) : !isLinked ? (
                            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                                <User size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>Your account is not yet linked to a family member record.</p>
                                <p style={{ margin: '6px 0 0', fontSize: '0.8rem', opacity: 0.6 }}>Ask an admin to link your account in the Family Members admin page.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                {/* Read-only name banner */}
                                <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    {familyProfile.family_image_url ? (
                                        <img src={familyProfile.family_image_url} alt="avatar" style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }} />
                                    ) : (
                                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                            {familyProfile.family_first_name?.[0] || '?'}
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                                            {familyProfile.family_first_name} {familyProfile.family_middle_name || ''} {familyProfile.family_last_name || ''}
                                        </div>
                                        {familyProfile.family_nickname && (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>"{familyProfile.family_nickname}"</div>
                                        )}
                                    </div>
                                </div>

                                {/* Editable fields */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={labelStyle}><Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />Phone</label>
                                        <input style={inputStyle} value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="e.g. (555) 123-4567" />
                                    </div>
                                    <div>
                                        <label style={labelStyle}><Globe size={12} style={{ display: 'inline', marginRight: '4px' }} />Website</label>
                                        <input style={inputStyle} value={formData.website} onChange={e => setFormData(p => ({ ...p, website: e.target.value }))} placeholder="e.g. yoursite.com" />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={labelStyle}>Update Avatar Image</label>
                                        <ImageUploader onFileSelect={(file) => setAvatarFile(file)} label="" />
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                                            This replaces your Cartwright avatar shown on birthdays. Your Clerk profile picture is set above.
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                                    {saveStatus === 'success' && <span style={{ fontSize: '0.85rem', color: '#22c55e' }}>✓ Saved successfully!</span>}
                                    {saveStatus === 'error' && <span style={{ fontSize: '0.85rem', color: '#ef4444' }}>✗ Failed to save. Try again.</span>}
                                    <button type="submit" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px', backgroundColor: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: isSaving ? 'default' : 'pointer', opacity: isSaving ? 0.6 : 1, fontSize: '0.875rem' }}>
                                        {isSaving ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
