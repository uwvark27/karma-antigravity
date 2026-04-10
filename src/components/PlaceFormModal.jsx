import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const PlaceFormModal = ({ isOpen, onClose, onSuccess }) => {
    const [architectures, setArchitectures] = useState([]);
    
    const initialFormState = {
        ownership_id: 0, chain_id: 0, name: '', name_2: '', desc: '', arch_id: '',
        addr: '', addr_2: '', city: '', state: '', zip: '', country: 'US',
        phone: '', webpage: '', email: '', open_date: '', close_date: '', capacity: ''
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialFormState);
            fetchArchitectures();
        }
    }, [isOpen]);

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
            const res = await fetch('/api/places', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                onSuccess(data.place_id);
                onClose();
            } else {
                alert("Error saving place");
            }
        } catch (error) {
            console.error('Failed to save record', error);
        }
    };

    if (!isOpen) return null;

    const InputLabel = ({ children }) => (
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {children}
        </label>
    );

    const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none' };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'var(--bg-secondary)', width: '100%', maxWidth: '800px', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>

                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-primary)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                        New Place
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', borderRadius: '50%' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
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

                        </div>

                        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', backgroundColor: 'transparent', border: '1px solid var(--border-color)', cursor: 'pointer' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>Cancel</button>
                            <button type="submit" style={{ padding: '10px 24px', backgroundColor: 'var(--accent-primary)', color: 'white', fontSize: '0.875rem', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} onMouseOver={(e) => { e.currentTarget.style.opacity = '0.9'; }} onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}>Save Place</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PlaceFormModal;
