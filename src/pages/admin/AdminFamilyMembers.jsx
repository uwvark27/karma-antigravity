import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, X, Copy, Skull, Cake } from 'lucide-react';
import PaginationControls from '../../components/PaginationControls';
import ImageUploader from '../../components/ImageUploader';

const AdminFamilyMembers = () => {
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isCopying, setIsCopying] = useState(false);
    const [filters, setFilters] = useState({ id: '', name: '', sex: '', birthday: '', contact: '', website: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [usersList, setUsersList] = useState([]);
    const [avatarFile, setAvatarFile] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        maiden_name: '',
        nickname: '',
        sex: 'M',
        birthday: '',
        deathday: '',
        desc: '',
        email: '',
        phone: '',
        website: '',
        clerk_user_id: '',
        family_image_url: ''
    });

    useEffect(() => {
        fetchMembers();
        fetchUsersList();
    }, []);

    const fetchUsersList = async () => {
        try {
            const res = await fetch('/api/users');
            if (res.ok) setUsersList(await res.json());
        } catch (error) { console.error('Failed to fetch users', error); }
    };

    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/family-members');
            if (res.ok) {
                const data = await res.json();
                setMembers(data);
            } else {
                const errData = await res.text();
                alert("API ERROR: " + errData);
            }
        } catch (error) {
            console.error('Failed to fetch family members', error);
        }
        setIsLoading(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            first_name: '', middle_name: '', last_name: '', maiden_name: '',
            nickname: '', sex: 'M', birthday: '', deathday: '', desc: '',
            email: '', phone: '', website: '', clerk_user_id: '', family_image_url: ''
        });
        setEditingId(null);
        setIsCopying(false);
        setAvatarFile(null);
        setIsFormOpen(false);
    };

    const mapToFormData = (member) => ({
        first_name: member.family_first_name || '',
        middle_name: member.family_middle_name || '',
        last_name: member.family_last_name || '',
        maiden_name: member.family_maiden_name || '',
        nickname: member.family_nickname || '',
        sex: member.family_sex || 'M',
        birthday: member.family_birthday ? member.family_birthday.split('T')[0] : '',
        deathday: member.family_deathday ? member.family_deathday.split('T')[0] : '',
        desc: member.family_desc || '',
        email: member.family_email || '',
        phone: member.family_phone || '',
        website: member.family_website || '',
        clerk_user_id: member.clerk_user_id || '',
        family_image_url: member.family_image_url || ''
    });

    const openEditForm = (member) => {
        setFormData(mapToFormData(member));
        setEditingId(member.family_member_id);
        setIsCopying(false);
        setAvatarFile(null);
        setIsFormOpen(true);
    };

    const handleCopy = (member) => {
        setFormData(mapToFormData(member));
        setEditingId(null);
        setIsCopying(true);
        setAvatarFile(null);
        setIsFormOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            first_name: formData.first_name,
            middle_name: formData.middle_name,
            last_name: formData.last_name,
            maiden_name: formData.maiden_name,
            nickname: formData.nickname,
            sex: formData.sex,
            birthday: formData.birthday,
            deathday: formData.deathday,
            desc: formData.desc,
            email: formData.email,
            phone: formData.phone,
            website: formData.website,
            clerk_user_id: formData.clerk_user_id,
            family_image_url: formData.family_image_url
        };

        try {
            if (avatarFile) {
                const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(avatarFile.name)}`, {
                    method: 'POST',
                    body: avatarFile
                });
                if (uploadRes.ok) {
                    const blobData = await uploadRes.json();
                    payload.family_image_url = blobData.url;
                }
            }
            let res;
            if (editingId) {
                payload.id = editingId;
                res = await fetch('/api/family-members', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch('/api/family-members', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                window.alert(`Database Error: ${errorData.error || res.statusText}`);
                return;
            }

            fetchMembers();
            resetForm();
        } catch (error) {
            console.error('Failed to save record', error);
            window.alert('Network request failed.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this family member?")) return;
        try {
            await fetch(`/api/family-members?id=${id}`, { method: 'DELETE' });
            fetchMembers();
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setCurrentPage(1);
    };

    const filteredMembers = members.filter(member => {
        const matchId = filters.id === '' || String(member.family_member_id).includes(filters.id);
        const nameStr = `${member.family_first_name || ''} ${member.family_middle_name || ''} ${member.family_last_name || ''} ${member.family_nickname || ''}`.toLowerCase();
        const matchName = filters.name === '' || nameStr.includes(filters.name.toLowerCase());
        const matchSex = filters.sex === '' || (member.family_sex && member.family_sex.toLowerCase().includes(filters.sex.toLowerCase()));
        const bdayStr = member.family_birthday ? new Date(member.family_birthday).toLocaleDateString() : '';
        const matchBday = filters.birthday === '' || bdayStr.includes(filters.birthday);
        const contactStr = `${member.family_phone || ''} ${member.family_email || ''}`.toLowerCase();
        const matchContact = filters.contact === '' || contactStr.includes(filters.contact.toLowerCase());
        const websiteStr = (member.family_website || '').toLowerCase();
        const matchWebsite = filters.website === '' || websiteStr.includes(filters.website.toLowerCase());
        return matchId && matchName && matchSex && matchBday && matchContact && matchWebsite;
    });

    const paginatedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // To test if birthday is today
    const isBirthdayToday = (birthdayString) => {
        // 1. If there's no birthday listed, return false immediately
        if (!birthdayString) return false;

        // 2. Convert the database string into a JS Date object
        const bday = new Date(birthdayString);
        const today = new Date(); // Gets exactly right now

        // 3. Compare ONLY the month and the day of the month
        return (
            bday.getDate() === today.getDate() &&
            bday.getMonth() === today.getMonth()
        );
    };

    return (
        <div style={{ padding: '32px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--accent-primary)', textAlign: 'center' }}>Family Members</h2>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Manage, create, and modify your family member directory.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <button
                    onClick={() => { resetForm(); setIsFormOpen(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--accent-primary)', color: 'white', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', transition: 'all 0.2s ease', fontSize: '0.9rem' }}
                    onMouseOver={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                    <Plus size={18} /> Add Family Member
                </button>
            </div>

            {isFormOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                    <div style={{ backgroundColor: 'var(--bg-secondary)', width: '100%', maxWidth: '640px', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>

                        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-primary)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                                {editingId ? 'Edit Family Member' : isCopying ? 'Copy Family Member' : 'New Family Member'}
                            </h3>
                            <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', borderRadius: '50%' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '24px', overflowY: 'auto' }}>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>

                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>First Name *</label>
                                        <input required name="first_name" value={formData.first_name} onChange={handleInputChange} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none' }} />
                                    </div>

                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Middle Name</label>
                                        <input name="middle_name" value={formData.middle_name} onChange={handleInputChange} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none' }} />
                                    </div>

                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Name</label>
                                        <input name="last_name" value={formData.last_name} onChange={handleInputChange} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none' }} />
                                    </div>

                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Maiden Name</label>
                                        <input name="maiden_name" value={formData.maiden_name} onChange={handleInputChange} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none' }} />
                                    </div>

                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nickname</label>
                                        <input name="nickname" value={formData.nickname} onChange={handleInputChange} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none' }} />
                                    </div>

                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sex *</label>
                                        <select required name="sex" value={formData.sex} onChange={handleInputChange} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}>
                                            <option value="M">Male (M)</option>
                                            <option value="F">Female (F)</option>
                                            <option value="O">Other (O)</option>
                                        </select>
                                    </div>

                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Birthday</label>
                                        <input type="date" name="birthday" value={formData.birthday} onChange={handleInputChange} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none', colorScheme: 'dark' }} />
                                    </div>

                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deathday</label>
                                        <input type="date" name="deathday" value={formData.deathday} onChange={handleInputChange} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none', colorScheme: 'dark' }} />
                                    </div>

                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
                                        <textarea name="desc" value={formData.desc} onChange={handleInputChange} rows="3" placeholder="Biography or notes..." style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}></textarea>
                                    </div>

                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</label>
                                        <input name="phone" value={formData.phone} onChange={handleInputChange} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none' }} />
                                    </div>

                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                                        <input name="email" value={formData.email} onChange={handleInputChange} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none' }} />
                                    </div>

                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Website</label>
                                        <input name="website" value={formData.website} onChange={handleInputChange} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none' }} />
                                    </div>

                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Associated User Account</label>
                                        <select name="clerk_user_id" value={formData.clerk_user_id} onChange={handleInputChange} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}>
                                            <option value="">-- No Linked Account --</option>
                                            {usersList.map(u => (
                                                <option key={u.id} value={u.id}>{u.email}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avatar Image</label>
                                        {formData.family_image_url && !avatarFile && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', padding: '10px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                                <img src={formData.family_image_url} alt="Current avatar" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)', flexShrink: 0 }} />
                                                <div style={{ flex: 1, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current avatar</div>
                                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, family_image_url: '' }))} style={{ padding: '4px 10px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', cursor: 'pointer' }}>
                                                    Clear
                                                </button>
                                            </div>
                                        )}
                                        <ImageUploader onFileSelect={(file) => setAvatarFile(file)} label="" />
                                        <div style={{ marginTop: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                            Clear the current avatar to let the Clerk profile picture sync automatically on next login.
                                        </div>
                                    </div>

                                </div>

                                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={resetForm} style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', backgroundColor: 'transparent', border: '1px solid var(--border-color)', cursor: 'pointer' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>Cancel</button>
                                    <button type="submit" style={{ padding: '10px 24px', backgroundColor: 'var(--accent-primary)', color: 'white', fontSize: '0.875rem', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} onMouseOver={(e) => { e.currentTarget.style.opacity = '0.9'; }} onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}>Save Member</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                {isLoading ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading members...</div>
                ) : members.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No family members found. Add one above!</div>
                ) : (
                    <div style={{ width: '100%', overflowX: 'auto' }}>
                        <PaginationControls isTop={true} totalItems={filteredMembers.length} currentPage={currentPage} itemsPerPage={itemsPerPage} setCurrentPage={setCurrentPage} setItemsPerPage={setItemsPerPage} />
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
                                    <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sex</th>
                                    <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Birthday</th>
                                    <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</th>
                                    <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Website</th>
                                    <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                                </tr>
                                <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '8px 16px' }}><input placeholder="Filter Name..." value={filters.name} onChange={(e) => handleFilterChange('name', e.target.value)} style={{ width: '100%', padding: '6px 8px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} /></th>
                                    <th style={{ padding: '8px 16px' }}><input placeholder="Filter Sex..." value={filters.sex} onChange={(e) => handleFilterChange('sex', e.target.value)} style={{ width: '100%', padding: '6px 8px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} /></th>
                                    <th style={{ padding: '8px 16px' }}><input placeholder="Filter..." value={filters.birthday} onChange={(e) => handleFilterChange('birthday', e.target.value)} style={{ width: '100%', padding: '6px 8px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} /></th>
                                    <th style={{ padding: '8px 16px' }}><input placeholder="Filter Contact..." value={filters.contact} onChange={(e) => handleFilterChange('contact', e.target.value)} style={{ width: '100%', padding: '6px 8px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} /></th>
                                    <th style={{ padding: '8px 16px' }}><input placeholder="Filter..." value={filters.website} onChange={(e) => handleFilterChange('website', e.target.value)} style={{ width: '100%', padding: '6px 8px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} /></th>
                                    <th style={{ padding: '8px 16px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedMembers.map((member, idx) => (
                                    <tr key={member.family_member_id} onClick={() => openEditForm(member)} style={{ borderBottom: idx === paginatedMembers.length - 1 ? 'none' : '1px solid var(--border-color)', transition: 'background-color 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <td style={{ padding: '16px', color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 600 }}>
                                            {member.family_first_name} {member.family_middle_name || ''} {member.family_last_name || ''} {member.family_deathday === null ? '' : <Skull />} {isBirthdayToday(member.family_birthday) && <Cake />}
                                            {member.family_nickname && <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-secondary)', marginTop: '4px' }}>"{member.family_nickname}"</span>}
                                        </td>
                                        <td style={{ padding: '16px', color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: 'bold' }}>{member.family_sex}</td>
                                        <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                            {member.family_birthday ? new Date(member.family_birthday).toLocaleDateString() : '-'}
                                        </td>
                                        <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.4' }}>
                                            {member.family_phone && <span style={{ display: 'block', color: 'var(--text-primary)' }}>{member.family_phone}</span>}
                                            {member.family_email && <span style={{ display: 'block' }}>{member.family_email}</span>}
                                            {!member.family_phone && !member.family_email && '-'}
                                        </td>
                                        <td style={{ padding: '16px', fontSize: '0.875rem' }}>
                                            {member.family_website ? (
                                                <a
                                                    href={member.family_website.startsWith('http') ? member.family_website : `https://${member.family_website}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}
                                                    onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                                    onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                                                >
                                                    {member.family_website.replace(/^https?:\/\//, '')}
                                                </a>
                                            ) : '-'}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                                <button onClick={(e) => { e.stopPropagation(); openEditForm(member); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={(e) => { e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }} title="Edit"><Pencil size={18} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleCopy(member); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={(e) => { e.currentTarget.style.color = '#10b981'; e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }} title="Copy"><Copy size={18} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(member.family_member_id); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }} title="Delete"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <PaginationControls isTop={false} totalItems={filteredMembers.length} currentPage={currentPage} itemsPerPage={itemsPerPage} setCurrentPage={setCurrentPage} setItemsPerPage={setItemsPerPage} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminFamilyMembers;
