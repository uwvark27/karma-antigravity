import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, X, Copy } from 'lucide-react';
import PaginationControls from '../../components/PaginationControls';

const AdminCalendars = () => {
    const [calendars, setCalendars] = useState([]);
    const [familyMembers, setFamilyMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isCopying, setIsCopying] = useState(false);
    const [filters, setFilters] = useState({ member: '', name: '', date: '', event: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [formData, setFormData] = useState({
        member: 1, // Defaulting to 1
        name: '',
        subname: '',
        date: '',
        dateEnd: '',
        event: '',
        placeId: '',
        categoryId: '',
        num: '',
        num2: ''
    });

    useEffect(() => {
        fetchCalendars();
        fetchFamilyMembers();
    }, []);

    const fetchFamilyMembers = async () => {
        try {
            const res = await fetch('/api/family-members');
            if (res.ok) {
                const data = await res.json();
                setFamilyMembers(data);
            } else {
                const errData = await res.text();
                // Alert the user precisely what failed
                alert("FAMILY API ERROR: " + errData);
            }
        } catch (error) {
            console.error('Failed to fetch family members', error);
        }
    };

    const fetchCalendars = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/calendars');
            if (res.ok) {
                const data = await res.json();
                setCalendars(data);
            } else {
                const errData = await res.text();
                alert("CALENDARS API ERROR: " + errData);
            }
        } catch (error) {
            console.error('Failed to fetch calendars', error);
        }
        setIsLoading(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            member: 1, // default to 1
            name: '',
            subname: '',
            date: '',
            dateEnd: '',
            event: '',
            placeId: '',
            categoryId: '',
            num: '',
            num2: ''
        });
        setEditingId(null);
        setIsCopying(false);
        setIsFormOpen(false);
    };

    const openEditForm = (calendar) => {
        setFormData({
            member: calendar.calendar_member !== null ? calendar.calendar_member : 1,
            name: calendar.calendar_name || '',
            subname: calendar.calendar_subname || '',
            date: calendar.calendar_date ? calendar.calendar_date.split('T')[0] : '',
            dateEnd: calendar.calendar_date_end ? calendar.calendar_date_end.split('T')[0] : '',
            event: calendar.calendar_event || '',
            placeId: calendar.place_id || '',
            categoryId: calendar.category_id || '',
            num: calendar.calendar_num || '',
            num2: calendar.calendar_num2 || ''
        });
        setEditingId(calendar.calendar_id);
        setIsCopying(false);
        setIsFormOpen(true);
    };

    const handleCopy = (calendar) => {
        setFormData({
            member: calendar.calendar_member !== null ? calendar.calendar_member : 1,
            name: calendar.calendar_name || '',
            subname: calendar.calendar_subname || '',
            date: calendar.calendar_date ? calendar.calendar_date.split('T')[0] : '',
            dateEnd: calendar.calendar_date_end ? calendar.calendar_date_end.split('T')[0] : '',
            event: calendar.calendar_event || '',
            placeId: calendar.place_id || '',
            categoryId: calendar.category_id || '',
            num: calendar.calendar_num || '',
            num2: calendar.calendar_num2 || ''
        });
        setEditingId(null); // Null forces a NEW record creation
        setIsCopying(true);
        setIsFormOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            member: parseInt(formData.member, 10) || 0,
            name: formData.name,
            subname: formData.subname || null,
            date: formData.date,
            dateEnd: formData.dateEnd || null,
            event: formData.event,
            placeId: formData.placeId ? parseInt(formData.placeId, 10) : null,
            categoryId: formData.categoryId ? parseInt(formData.categoryId, 10) : null,
            num: formData.num ? parseFloat(formData.num) : null,
            num2: formData.num2 ? parseFloat(formData.num2) : null
        };

        try {
            if (editingId) {
                payload.id = editingId;
                await fetch('/api/calendars', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                await fetch('/api/calendars', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
            fetchCalendars();
            resetForm();
        } catch (error) {
            console.error('Failed to save calendar record', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this calendar record?")) return;
        try {
            await fetch(`/api/calendars?id=${id}`, { method: 'DELETE' });
            fetchCalendars();
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setCurrentPage(1);
    };

    const filteredCalendars = calendars.filter(cal => {
        let memStr = `ID ${cal.calendar_member}`;
        const fm = familyMembers.find(f => f.family_member_id == cal.calendar_member);
        if (fm) memStr = `${fm.family_first_name} ${fm.family_last_name}`;
        
        const matchMem = filters.member === '' || memStr.toLowerCase().includes(filters.member.toLowerCase());
        
        const nameStr = `${cal.calendar_name || ''} ${cal.calendar_subname || ''}`.toLowerCase();
        const matchName = filters.name === '' || nameStr.includes(filters.name.toLowerCase());
        
        const dateStr = cal.calendar_date ? new Date(cal.calendar_date).toLocaleDateString() : '';
        const matchDate = filters.date === '' || dateStr.includes(filters.date);
        
        const matchEvent = filters.event === '' || (cal.calendar_event && cal.calendar_event.toLowerCase().includes(filters.event.toLowerCase()));

        return matchMem && matchName && matchDate && matchEvent;
    });

    const paginatedCalendars = filteredCalendars.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div style={{ padding: '32px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Centered Header */}
            <div className="flex flex-col items-center mb-8">
                <h2 className="text-3xl font-bold mb-2 text-[var(--accent-primary)]">Calendars</h2>
                <p className="text-[var(--text-secondary)] text-center">Manage, create, and modify your system calendar records.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <button
                    onClick={() => { resetForm(); setIsFormOpen(true); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        backgroundColor: 'var(--accent-primary)', color: 'white',
                        padding: '10px 20px', borderRadius: '8px',
                        fontWeight: 'bold', border: 'none', cursor: 'pointer',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.2s ease', fontSize: '0.9rem'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                    <Plus size={18} /> Add Calendar Record
                </button>
            </div>

            {isFormOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px'
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-secondary)',
                        width: '100%',
                        maxWidth: '560px',
                        borderRadius: '12px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: '90vh',
                        overflow: 'hidden'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '16px 24px',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: 'var(--bg-primary)'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                                {editingId ? 'Edit Calendar Record' : isCopying ? 'Copy Calendar Record' : 'New Calendar Record'}
                            </h3>
                            <button
                                onClick={resetForm}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--text-secondary)', padding: '4px', borderRadius: '50%'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body / Form */}
                        <div style={{ padding: '24px', overflowY: 'auto' }}>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>

                                    {/* Member Field (Full Width) */}
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calendar Member *</label>
                                        <select required name="member" value={formData.member} onChange={handleInputChange} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}>
                                            <option value="" disabled>Select Family Member</option>
                                            {familyMembers.length === 0 && <option value="1">ID 1</option>}
                                            {familyMembers.map(fm => (
                                                <option key={fm.family_member_id} value={fm.family_member_id}>
                                                    {fm.family_first_name} {fm.family_last_name} (ID: {fm.family_member_id})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Name Field */}
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calendar Name *</label>
                                        <input required name="name" value={formData.name} onChange={handleInputChange} placeholder="E.g. Summer Trip" style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none' }} />
                                    </div>

                                    {/* Subname Field */}
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subname</label>
                                        <input name="subname" value={formData.subname} onChange={handleInputChange} placeholder="Optional" style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none' }} />
                                    </div>

                                    {/* Date Fields */}
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start Date *</label>
                                        <input required type="date" name="date" value={formData.date} onChange={handleInputChange} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none', colorScheme: 'dark' }} />
                                    </div>

                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>End Date</label>
                                        <input type="date" name="dateEnd" value={formData.dateEnd} onChange={handleInputChange} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none', colorScheme: 'dark' }} />
                                    </div>

                                    {/* Event Details */}
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event Details *</label>
                                        <textarea required name="event" value={formData.event} onChange={handleInputChange} rows="3" placeholder="Describe the event..." style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}></textarea>
                                    </div>

                                    {/* Divider */}
                                    <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '16px', margin: '8px 0' }}>
                                        <div style={{ height: '1px', backgroundColor: 'var(--border-color)', flex: 1 }}></div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Advanced Config</span>
                                        <div style={{ height: '1px', backgroundColor: 'var(--border-color)', flex: 1 }}></div>
                                    </div>

                                    {/* Advanced IDs */}
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Place ID</label>
                                        <input type="number" name="placeId" value={formData.placeId} onChange={handleInputChange} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none' }} />
                                    </div>

                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category ID</label>
                                        <input type="number" name="categoryId" value={formData.categoryId} onChange={handleInputChange} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none' }} />
                                    </div>

                                    {/* Advanced Nums */}
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Weight / Num 1</label>
                                        <input type="number" step="any" name="num" value={formData.num} onChange={handleInputChange} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none' }} />
                                    </div>

                                    <div style={{ gridColumn: 'span 1' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Metric / Num 2</label>
                                        <input type="number" step="any" name="num2" value={formData.num2} onChange={handleInputChange} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none' }} />
                                    </div>
                                </div>

                                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', backgroundColor: 'transparent', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{ padding: '10px 24px', backgroundColor: 'var(--accent-primary)', color: 'white', fontSize: '0.875rem', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        onMouseOver={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}
                                    >
                                        Save Record
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* List */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                {isLoading ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading logs...</div>
                ) : calendars.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No calendar records found. Add your first one above!</div>
                ) : (
                    <div style={{ width: '100%', overflowX: 'auto' }}>
                        <PaginationControls isTop={true} totalItems={filteredCalendars.length} currentPage={currentPage} itemsPerPage={itemsPerPage} setCurrentPage={setCurrentPage} setItemsPerPage={setItemsPerPage} />
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Member</th>
                                    <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
                                    <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                                    <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event</th>
                                    <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                                </tr>
                                <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '8px 16px' }}><input placeholder="Filter Member..." value={filters.member} onChange={(e) => handleFilterChange('member', e.target.value)} style={{ width: '100%', padding: '6px 8px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} /></th>
                                    <th style={{ padding: '8px 16px' }}><input placeholder="Filter Name..." value={filters.name} onChange={(e) => handleFilterChange('name', e.target.value)} style={{ width: '100%', padding: '6px 8px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} /></th>
                                    <th style={{ padding: '8px 16px' }}><input placeholder="Filter..." value={filters.date} onChange={(e) => handleFilterChange('date', e.target.value)} style={{ width: '100%', padding: '6px 8px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} /></th>
                                    <th style={{ padding: '8px 16px' }}><input placeholder="Filter Event..." value={filters.event} onChange={(e) => handleFilterChange('event', e.target.value)} style={{ width: '100%', padding: '6px 8px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} /></th>
                                    <th style={{ padding: '8px 16px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedCalendars.map((cal, idx) => (
                                    <tr key={cal.calendar_id} onClick={() => openEditForm(cal)} style={{ borderBottom: idx === paginatedCalendars.length - 1 ? 'none' : '1px solid var(--border-color)', transition: 'background-color 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <td style={{ padding: '16px', fontWeight: 600, color: 'var(--accent-primary)', fontSize: '0.875rem' }}>
                                            {(() => {
                                                const fm = familyMembers.find(f => f.family_member_id == cal.calendar_member);
                                                return fm ? `${fm.family_first_name} ${fm.family_last_name}` : `ID ${cal.calendar_member}`;
                                            })()}
                                        </td>
                                        <td style={{ padding: '16px', color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 500 }}>
                                            {cal.calendar_name}
                                            {cal.calendar_subname && <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-secondary)', marginTop: '4px' }}>{cal.calendar_subname}</span>}
                                        </td>
                                        <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                            {cal.calendar_date ? new Date(cal.calendar_date).toLocaleDateString() : '-'}
                                        </td>
                                        <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={cal.calendar_event}>
                                            {cal.calendar_event}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openEditForm(cal); }}
                                                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    onMouseOver={(e) => { e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                    title="Edit"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleCopy(cal); }}
                                                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    onMouseOver={(e) => { e.currentTarget.style.color = '#10b981'; e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)'; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                    title="Copy/Duplicate"
                                                >
                                                    <Copy size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(cal.calendar_id); }}
                                                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <PaginationControls isTop={false} totalItems={filteredCalendars.length} currentPage={currentPage} itemsPerPage={itemsPerPage} setCurrentPage={setCurrentPage} setItemsPerPage={setItemsPerPage} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminCalendars;
