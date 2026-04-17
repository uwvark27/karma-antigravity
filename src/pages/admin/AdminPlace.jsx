import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, X, Copy } from 'lucide-react';
import PaginationControls from '../../components/PaginationControls';

const AdminPlace = () => {
    const [places, setPlaces] = useState([]);
    const [architectures, setArchitectures] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isCopying, setIsCopying] = useState(false);
    const [filters, setFilters] = useState({ id: '', name: '', location: '', architecture: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    const initialFormState = {
        ownership_id: 0, chain_id: 0, name: '', name_2: '', desc: '', arch_id: '',
        addr: '', addr_2: '', city: '', state: '', zip: '', country: 'US',
        phone: '', webpage: '', email: '', open_date: '', close_date: '', capacity: ''
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        Promise.all([fetchPlaces(), fetchArchitectures()]).then(() => setIsLoading(false));
    }, []);

    const fetchArchitectures = async () => {
        try {
            const res = await fetch('/api/architecture');
            if (res.ok) {
                const data = await res.json();
                setArchitectures(data);
            }
        } catch (error) {
            console.error('Failed to fetch architectures', error);
        }
    };

    const fetchPlaces = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/places');
            if (res.ok) {
                const data = await res.json();
                setPlaces(data);
            } else {
                const errData = await res.text();
                alert("API ERROR: " + errData);
            }
        } catch (error) {
            console.error('Failed to fetch places', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setEditingId(null);
        setIsCopying(false);
        setIsFormOpen(false);
    };

    const mapToFormData = (place) => ({
        ownership_id: place.place_ownership_id || 0,
        chain_id: place.chain_id || 0,
        name: place.place_name || '',
        name_2: place.place_name_2 || '',
        desc: place.place_desc || '',
        arch_id: place.arch_id || '',
        addr: place.place_addr || '',
        addr_2: place.place_addr_2 || '',
        city: place.place_city || '',
        state: place.place_state || '',
        zip: place.place_zip || '',
        country: place.place_country || 'US',
        phone: place.place_phone || '',
        webpage: place.place_webpage || '',
        email: place.place_email || '',
        open_date: place.place_open_date ? place.place_open_date.split('T')[0] : '',
        close_date: place.place_close_date ? place.place_close_date.split('T')[0] : '',
        capacity: place.place_capacity || ''
    });

    const openEditForm = (place) => {
        setFormData(mapToFormData(place));
        setEditingId(place.place_id);
        setIsCopying(false);
        setIsFormOpen(true);
    };

    const handleCopy = (place) => {
        setFormData(mapToFormData(place));
        setEditingId(null);
        setIsCopying(true);
        setIsFormOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            ...formData,
            ownership_id: parseInt(formData.ownership_id) || 0,
            chain_id: parseInt(formData.chain_id) || 0,
            arch_id: parseInt(formData.arch_id) || null,
            capacity: parseInt(formData.capacity) || null
        };

        try {
            if (editingId) {
                payload.id = editingId;
                await fetch('/api/places', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                await fetch('/api/places', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
            fetchPlaces();
            resetForm();
        } catch (error) {
            console.error('Failed to save record', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this place?")) return;
        try {
            await fetch(`/api/places?id=${id}`, { method: 'DELETE' });
            fetchPlaces();
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setCurrentPage(1);
    };

    const filteredPlaces = places.filter(place => {
        const matchId = filters.id === '' || String(place.place_id).includes(filters.id);
        const nameStr = `${place.place_name || ''} ${place.place_name_2 || ''}`.toLowerCase();
        const matchName = filters.name === '' || nameStr.includes(filters.name.toLowerCase());
        const locStr = `${place.place_addr || ''} ${place.place_addr_2 || ''} ${place.place_city || ''} ${place.place_state || ''} ${place.place_zip || ''} ${place.place_country || ''}`.toLowerCase();
        const matchLoc = filters.location === '' || locStr.includes(filters.location.toLowerCase());
        const archName = architectures.find(a => a.arch_id === place.arch_id)?.arch_name?.toLowerCase() || '';
        const matchArch = filters.architecture === '' || archName.includes(filters.architecture.toLowerCase());
        return matchId && matchName && matchLoc && matchArch;
    });

    const paginatedPlaces = filteredPlaces.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const InputLabel = ({ children }) => (
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {children}
        </label>
    );

    const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none' };

    return (
        <div style={{ padding: '32px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--accent-primary)', textAlign: 'center' }}>Places</h2>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Manage the central directory of locations, venues, and addresses.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <button
                    onClick={() => { resetForm(); setIsFormOpen(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--accent-primary)', color: 'white', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', transition: 'all 0.2s', fontSize: '0.9rem' }}
                    onMouseOver={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                    <Plus size={18} /> Add Place
                </button>
            </div>

            {isFormOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                    <div style={{ backgroundColor: 'var(--bg-secondary)', width: '100%', maxWidth: '800px', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>

                        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-primary)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                                {editingId ? 'Edit Place' : isCopying ? 'Copy Place' : 'New Place'}
                            </h3>
                            <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', borderRadius: '50%' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '24px', overflowY: 'auto' }}>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>

                                    {/* Row 1 */}
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <InputLabel>Place Name *</InputLabel>
                                        <input required name="name" value={formData.name} onChange={handleInputChange} style={inputStyle} />
                                    </div>
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <InputLabel>Country *</InputLabel>
                                        <input required name="country" value={formData.country} onChange={handleInputChange} maxLength="5" style={inputStyle} />
                                    </div>

                                    {/* Row 2 */}
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <InputLabel>Secondary Name</InputLabel>
                                        <input name="name_2" value={formData.name_2} onChange={handleInputChange} style={inputStyle} />
                                    </div>
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <InputLabel>Arch Type</InputLabel>
                                        <select name="arch_id" value={formData.arch_id} onChange={handleInputChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                                            <option value="">-- None --</option>
                                            {architectures.map(arch => (
                                                <option key={arch.arch_id} value={arch.arch_id}>
                                                    {arch.arch_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Divider */}
                                    <div style={{ gridColumn: 'span 3', height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }}></div>

                                    {/* Row 3 - Address */}
                                    <div style={{ gridColumn: 'span 3' }}>
                                        <InputLabel>Address Line 1</InputLabel>
                                        <input name="addr" value={formData.addr} onChange={handleInputChange} style={inputStyle} />
                                    </div>
                                    <div style={{ gridColumn: 'span 3' }}>
                                        <InputLabel>Address Line 2</InputLabel>
                                        <input name="addr_2" value={formData.addr_2} onChange={handleInputChange} style={inputStyle} />
                                    </div>

                                    {/* Row 4 - Location Details */}
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <InputLabel>City</InputLabel>
                                        <input name="city" value={formData.city} onChange={handleInputChange} style={inputStyle} />
                                    </div>
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <InputLabel>State</InputLabel>
                                        <input name="state" value={formData.state} onChange={handleInputChange} maxLength="2" style={inputStyle} />
                                    </div>
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <InputLabel>ZIP Code</InputLabel>
                                        <input name="zip" value={formData.zip} onChange={handleInputChange} maxLength="10" style={inputStyle} />
                                    </div>

                                    {/* Divider */}
                                    <div style={{ gridColumn: 'span 3', height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }}></div>

                                    {/* Row 5 - Contact */}
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <InputLabel>Phone</InputLabel>
                                        <input name="phone" value={formData.phone} onChange={handleInputChange} style={inputStyle} />
                                    </div>
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <InputLabel>Email</InputLabel>
                                        <input name="email" type="email" value={formData.email} onChange={handleInputChange} style={inputStyle} />
                                    </div>
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <InputLabel>Webpage</InputLabel>
                                        <input name="webpage" type="url" value={formData.webpage} onChange={handleInputChange} style={inputStyle} />
                                    </div>

                                    {/* Row 6 - Meta */}
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <InputLabel>Open Date</InputLabel>
                                        <input type="date" name="open_date" value={formData.open_date} onChange={handleInputChange} style={{ ...inputStyle, colorScheme: 'dark' }} />
                                    </div>
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <InputLabel>Close Date</InputLabel>
                                        <input type="date" name="close_date" value={formData.close_date} onChange={handleInputChange} style={{ ...inputStyle, colorScheme: 'dark' }} />
                                    </div>
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <InputLabel>Capacity</InputLabel>
                                        <input type="number" name="capacity" value={formData.capacity} onChange={handleInputChange} style={inputStyle} />
                                    </div>

                                    {/* Row 7 - Advanced */}
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <InputLabel>Ownership ID</InputLabel>
                                        <input type="number" name="ownership_id" value={formData.ownership_id} onChange={handleInputChange} style={inputStyle} />
                                    </div>
                                    <div style={{ gridColumn: 'span 1' }}>
                                        <InputLabel>Chain ID</InputLabel>
                                        <input type="number" name="chain_id" value={formData.chain_id} onChange={handleInputChange} style={inputStyle} />
                                    </div>

                                    <div style={{ gridColumn: 'span 3' }}>
                                        <InputLabel>Description</InputLabel>
                                        <textarea name="desc" value={formData.desc} onChange={handleInputChange} rows="2" style={{ ...inputStyle, resize: 'vertical' }}></textarea>
                                    </div>

                                </div>

                                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={resetForm} style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', backgroundColor: 'transparent', border: '1px solid var(--border-color)', cursor: 'pointer' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>Cancel</button>
                                    <button type="submit" style={{ padding: '10px 24px', backgroundColor: 'var(--accent-primary)', color: 'white', fontSize: '0.875rem', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} onMouseOver={(e) => { e.currentTarget.style.opacity = '0.9'; }} onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}>Save Place</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                {isLoading ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading places...</div>
                ) : places.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No places found. Add one above!</div>
                ) : (
                    <div style={{ width: '100%', overflowX: 'auto' }}>
                        <PaginationControls isTop={true} totalItems={filteredPlaces.length} currentPage={currentPage} itemsPerPage={itemsPerPage} setCurrentPage={setCurrentPage} setItemsPerPage={setItemsPerPage} />
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
                                    <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</th>
                                    <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Architecture</th>
                                    <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                                </tr>
                                <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '8px 16px' }}><input placeholder="Filter Name..." value={filters.name} onChange={(e) => handleFilterChange('name', e.target.value)} style={{ width: '100%', padding: '6px 8px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} /></th>
                                    <th style={{ padding: '8px 16px' }}><input placeholder="Filter Location..." value={filters.location} onChange={(e) => handleFilterChange('location', e.target.value)} style={{ width: '100%', padding: '6px 8px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} /></th>
                                    <th style={{ padding: '8px 16px' }}><input placeholder="Filter Arch..." value={filters.architecture} onChange={(e) => handleFilterChange('architecture', e.target.value)} style={{ width: '100%', padding: '6px 8px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} /></th>
                                    <th style={{ padding: '8px 16px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedPlaces.map((place, idx) => (
                                    <tr key={place.place_id} onClick={() => openEditForm(place)} style={{ borderBottom: idx === paginatedPlaces.length - 1 ? 'none' : '1px solid var(--border-color)', transition: 'background-color 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <td style={{ padding: '16px', color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 600 }}>
                                            {place.place_name}
                                            {place.place_name_2 && <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-secondary)', marginTop: '4px' }}>{place.place_name_2}</span>}
                                        </td>
                                        <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.4' }}>
                                            {place.place_addr && <span style={{ display: 'block', color: 'var(--text-primary)' }}>{place.place_addr}</span>}
                                            {place.place_addr_2 && <span style={{ display: 'block' }}>{place.place_addr_2}</span>}
                                            <span style={{ display: 'block' }}>
                                                {place.place_city ? `${place.place_city}, ` : ''}{place.place_state ? `${place.place_state} ` : ''}{place.place_zip || ''}
                                            </span>
                                            {place.place_country !== 'US' && <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.7 }}>{place.place_country}</span>}
                                        </td>
                                        <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                            {architectures.find(a => a.arch_id === place.arch_id)?.arch_name || '-'}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                                <button onClick={(e) => { e.stopPropagation(); openEditForm(place); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={(e) => { e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }} title="Edit"><Pencil size={18} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleCopy(place); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={(e) => { e.currentTarget.style.color = '#10b981'; e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }} title="Copy"><Copy size={18} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(place.place_id); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }} title="Delete"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <PaginationControls isTop={false} totalItems={filteredPlaces.length} currentPage={currentPage} itemsPerPage={itemsPerPage} setCurrentPage={setCurrentPage} setItemsPerPage={setItemsPerPage} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPlace;
