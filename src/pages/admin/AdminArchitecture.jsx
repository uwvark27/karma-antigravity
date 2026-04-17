import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, CheckCircle2, ChevronRight, Hash } from 'lucide-react';
import PaginationControls from '../../components/PaginationControls';

const AdminArchitecture = () => {
    const [dataset, setDataset] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);

    // Initial Empty State
    const initialForm = {
        name: '',
        desc: '',
        building_type: ''
    };
    const [formData, setFormData] = useState(initialForm);

    const [filters, setFilters] = useState({
        name: '',
        desc: '',
        building_type: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    useEffect(() => {
        fetchArchitecture();
    }, []);

    const fetchArchitecture = async () => {
        try {
            const res = await fetch('/api/architecture');
            const data = await res.json();
            setDataset(data);
        } catch (error) {
            console.error("Failed to load architecture", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData(initialForm);
        setEditingId(null);
    };

    const handleEdit = (record) => {
        setEditingId(record.arch_id);
        setFormData({
            name: record.arch_name || '',
            desc: record.arch_desc || '',
            building_type: record.building_type_id || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = { ...formData };
        if (payload.building_type === '') delete payload.building_type; // allow null

        try {
            let res;
            if (editingId) {
                payload.id = editingId;
                res = await fetch('/api/architecture', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch('/api/architecture', {
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

            fetchArchitecture();
            resetForm();
        } catch (error) {
            console.error('Failed to save record', error);
            window.alert('Network request failed.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;
        try {
            const res = await fetch(`/api/architecture?id=${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                window.alert(`Database Error: ${errorData.error || res.statusText}`);
                return;
            }
            fetchArchitecture();
        } catch (error) {
            console.error("Failed to delete", error);
            window.alert('Network request failed.');
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setCurrentPage(1);
    };

    const filteredData = dataset.filter(rec => {
        const matchName = filters.name === '' || (rec.arch_name && rec.arch_name.toLowerCase().includes(filters.name.toLowerCase()));
        const matchDesc = filters.desc === '' || (rec.arch_desc && rec.arch_desc.toLowerCase().includes(filters.desc.toLowerCase()));
        const matchType = filters.building_type === '' || (rec.building_type_id !== null && String(rec.building_type_id).includes(filters.building_type));
        return matchName && matchDesc && matchType;
    });

    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const InputLabel = ({ children }) => (
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {children}
        </label>
    );

    const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none' };
    const filterInputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 8px', fontSize: '0.75rem', color: 'var(--text-primary)', outline: 'none', marginTop: '4px' };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                <Hash style={{ color: 'var(--accent-primary)' }} size={28} />
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>Architecture Admin</h1>
            </div>

            {/* Form */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '32px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                        {editingId ? 'Edit Architecture' : 'Add New Architecture'}
                    </h2>
                    {editingId && (
                        <button onClick={resetForm} style={{ padding: '8px 16px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                            Cancel Edit
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Rows */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                        
                        <div style={{ gridColumn: 'span 1' }}>
                            <InputLabel>Architecture Name *</InputLabel>
                            <input required type="text" name="name" value={formData.name} onChange={handleInputChange} style={inputStyle} placeholder="e.g. Shopping Mall" />
                        </div>

                        <div style={{ gridColumn: 'span 1' }}>
                            <InputLabel>Building Type ID</InputLabel>
                            <input type="number" name="building_type" value={formData.building_type} onChange={handleInputChange} style={inputStyle} placeholder="e.g. 2" />
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                            <InputLabel>Description / URL</InputLabel>
                            <input type="text" name="desc" value={formData.desc} onChange={handleInputChange} style={inputStyle} placeholder="Optional details..." />
                        </div>

                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                        <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseOut={(e) => e.currentTarget.style.filter = 'none'}>
                            <CheckCircle2 size={18} />
                            {editingId ? 'Save Changes' : 'Add Record'}
                        </button>
                    </div>
                </form>
            </div>

            {/* List */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                {isLoading ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading architecture logic...</div>
                ) : dataset.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No architecture records found. Add your first one above!</div>
                ) : (
                    <div style={{ width: '100%', overflowX: 'auto' }}>
                        <PaginationControls isTop={true} totalItems={filteredData.length} currentPage={currentPage} itemsPerPage={itemsPerPage} setCurrentPage={setCurrentPage} setItemsPerPage={setItemsPerPage} />
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Name
                                        <input type="text" placeholder="Filter..." value={filters.name} onChange={(e) => handleFilterChange('name', e.target.value)} style={filterInputStyle} onClick={(e) => e.stopPropagation()} />
                                    </th>
                                    <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Building Type ID
                                        <input type="text" placeholder="Filter..." value={filters.building_type} onChange={(e) => handleFilterChange('building_type', e.target.value)} style={filterInputStyle} onClick={(e) => e.stopPropagation()} />
                                    </th>
                                    <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Description
                                        <input type="text" placeholder="Filter..." value={filters.desc} onChange={(e) => handleFilterChange('desc', e.target.value)} style={filterInputStyle} onClick={(e) => e.stopPropagation()} />
                                    </th>
                                    <th style={{ padding: '16px', width: '100px', textAlign: 'right' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((rec) => (
                                    <tr key={rec.arch_id} 
                                        style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s', cursor: 'pointer' }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        onClick={() => handleEdit(rec)}
                                    >
                                        <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                                            {rec.arch_name}
                                        </td>
                                        <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            {rec.building_type_id || '-'}
                                        </td>
                                        <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {rec.arch_desc || '-'}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                <button onClick={(e) => { e.stopPropagation(); handleEdit(rec); }} style={{ padding: '8px', color: 'var(--text-secondary)', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--text-secondary)'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }} title="Edit">
                                                    <Pencil size={16} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(rec.arch_id); }} style={{ padding: '8px', color: '#ef4444', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = '#ef4444'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'var(--border-color)'; }} title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredData.length === 0 && dataset.length > 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            No architecture matches your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <PaginationControls isTop={false} totalItems={filteredData.length} currentPage={currentPage} itemsPerPage={itemsPerPage} setCurrentPage={setCurrentPage} setItemsPerPage={setItemsPerPage} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminArchitecture;
