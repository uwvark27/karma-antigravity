import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, CheckCircle2, MapPin, Activity, FileDown, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { gpx } from '@tmcw/togeojson';
import 'leaflet/dist/leaflet.css';

import PlaceFormModal from '../../components/PlaceFormModal';
import PaginationControls from '../../components/PaginationControls';

const HealthActivities = () => {
    const [dataset, setDataset] = useState([]);
    const [familyMembers, setFamilyMembers] = useState([]);
    const [places, setPlaces] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [activeMapId, setActiveMapId] = useState(null);
    const [activeGeoJson, setActiveGeoJson] = useState(null);
    const [showPlaceModal, setShowPlaceModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    const initialForm = {
        member: '1',
        place: '',
        subname: 'RUNNING',
        date: new Date().toISOString().split('T')[0],
        distance: '',
        duration: '',
        event_name: '',
        event_desc: '',
        gpx: ''
    };
    const [formData, setFormData] = useState(initialForm);

    const [filters, setFilters] = useState({
        subname: '',
        date: '',
        distance: '',
        duration: '',
        member: '',
        event_name: '',
        event_desc: '',
        location: ''
    });

    const [placeSearch, setPlaceSearch] = useState('');
    const [showPlaceDropdown, setShowPlaceDropdown] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');
    const [showMemberDropdown, setShowMemberDropdown] = useState(false);
    const [activeTab, setActiveTab] = useState('ALL');

    useEffect(() => {
        fetchFamilyMembers();
        fetchPlaces();
        fetchActivities();
    }, []);

    const fetchFamilyMembers = async () => {
        try {
            const res = await fetch('/api/family-members');
            if (res.ok) {
                const data = await res.json();
                setFamilyMembers(data);
                const defaultMem = data.find(f => f.family_member_id == initialForm.member);
                if (defaultMem) {
                    setMemberSearch(formatMember(defaultMem));
                }
            }
        } catch (error) {
            console.error("Failed to load family members", error);
        }
    };

    const fetchPlaces = async () => {
        try {
            const res = await fetch('/api/places');
            if (res.ok) {
                const data = await res.json();
                setPlaces(data);
            }
        } catch (error) {
            console.error("Failed to load places", error);
        }
    };

    const fetchActivities = async () => {
        try {
            const res = await fetch('/api/health-activities');
            const data = await res.json();
            setDataset(data);
        } catch (error) {
            console.error("Failed to load activities", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const fileString = event.target.result;
            setFormData(prev => ({ ...prev, gpx: fileString }));
            window.alert('GPX file loaded into memory successfully!');
        };
        reader.readAsText(file);
    };

    const resetForm = () => {
        setFormData(initialForm);
        setPlaceSearch('');
        const defaultMem = familyMembers.find(f => f.family_member_id == initialForm.member);
        setMemberSearch(defaultMem ? formatMember(defaultMem) : '');
        setEditingId(null);
        document.getElementById('gpxUpload').value = '';
    };

    const formatPlace = (p) => {
        if (!p) return '';
        let str = p.place_name || 'Unknown';
        if (p.place_addr) str += ` - ${p.place_addr}`;
        if (p.place_city) str += `, ${p.place_city}`;
        if (p.place_state) str += `, ${p.place_state}`;
        return str;
    };

    const handlePlaceSuccess = async (newPlaceId) => {
        try {
            const res = await fetch('/api/places');
            if (res.ok) {
                const data = await res.json();
                setPlaces(data);
                const p = data.find(x => x.place_id == newPlaceId);
                if (p) setPlaceSearch(formatPlace(p));
                setFormData(prev => ({ ...prev, place: newPlaceId }));
            }
        } catch (error) {
            console.error('Failed to reload places', error);
        }
    };

    const formatMember = (m) => {
        if (!m) return '';
        return `${m.family_first_name || ''} ${m.family_last_name || ''}`.trim() || 'Unknown';
    };

    const handleEdit = (record) => {
        setEditingId(record.calendar_id);
        const dStr = record.calendar_date ? new Date(record.calendar_date).toISOString().split('T')[0] : '';
        setFormData({
            member: record.calendar_member || '1',
            place: record.place_id || '',
            subname: record.calendar_subname || 'RUNNING',
            date: dStr,
            distance: record.calendar_num || '',
            duration: record.calendar_num2 || '',
            event_name: record.calendar_event_name || '',
            event_desc: record.calendar_event_desc || '',
            gpx: record.calendar_gpx || ''
        });
        if (record.place_id && places.length > 0) {
            const p = places.find(x => x.place_id == record.place_id);
            setPlaceSearch(formatPlace(p));
        } else {
            setPlaceSearch('');
        }
        if (record.calendar_member && familyMembers.length > 0) {
            const fm = familyMembers.find(f => f.family_member_id == record.calendar_member);
            setMemberSearch(formatMember(fm));
        } else {
            setMemberSearch('');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = { ...formData };
        if (payload.distance === '') delete payload.distance;
        if (payload.duration === '') delete payload.duration;

        try {
            let res;
            if (editingId) {
                payload.id = editingId;
                res = await fetch('/api/health-activities', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch('/api/health-activities', {
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

            fetchActivities();
            resetForm();
        } catch (error) {
            console.error('Failed to save record', error);
            window.alert('Network request failed.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this activity?")) return;
        try {
            const res = await fetch(`/api/health-activities?id=${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                window.alert(`Database Error: ${errorData.error || res.statusText}`);
                return;
            }
            fetchActivities();
        } catch (error) {
            console.error("Failed to delete", error);
            window.alert('Network request failed.');
        }
    };

    const viewMap = (record) => {
        if (activeMapId === record.calendar_id) {
            setActiveMapId(null);
            setActiveGeoJson(null);
            return;
        }

        if (!record.calendar_gpx) {
            window.alert('No GPX data attached to this activity.');
            return;
        }

        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(record.calendar_gpx, 'text/xml');

            // Check for XML parsing errors
            const errorNode = xmlDoc.querySelector('parsererror');
            if (errorNode) throw new Error('Invalid XML');

            const geoJsonData = gpx(xmlDoc);
            setActiveGeoJson(geoJsonData);
            setActiveMapId(record.calendar_id);
        } catch (err) {
            console.error(err);
            window.alert('Failed to parse GPX data. The file may be corrupt or invalid.');
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const filteredData = dataset.filter(rec => {
        const matchTab = activeTab === 'ALL' || rec.calendar_subname === activeTab;
        const matchSubname = filters.subname === '' || (rec.calendar_subname && rec.calendar_subname.toLowerCase().includes(filters.subname.toLowerCase()));
        const matchDate = filters.date === '' || (rec.calendar_date && new Date(rec.calendar_date).toLocaleDateString().includes(filters.date));
        const matchDist = filters.distance === '' || (rec.calendar_num !== null && String(rec.calendar_num).includes(filters.distance));
        const matchDur = filters.duration === '' || (rec.calendar_num2 !== null && String(rec.calendar_num2).includes(filters.duration));

        const fm = familyMembers.find(f => f.family_member_id == rec.calendar_member);
        const memName = fm ? fm.family_first_name.toLowerCase() : 'unknown';
        const matchMember = filters.member === '' || memName.includes(filters.member.toLowerCase());

        const matchEventName = filters.event_name === '' || (rec.calendar_event_name && rec.calendar_event_name.toLowerCase().includes(filters.event_name.toLowerCase()));
        const matchEventDesc = filters.event_desc === '' || (rec.calendar_event_desc && rec.calendar_event_desc.toLowerCase().includes(filters.event_desc.toLowerCase()));
        
        const p = places.find(x => x.place_id == rec.place_id);
        const locName = p ? formatPlace(p).toLowerCase() : '';
        const matchLoc = filters.location === '' || locName.includes(filters.location.toLowerCase());

        return matchTab && matchSubname && matchDate && matchDist && matchDur && matchMember && matchLoc && matchEventName && matchEventDesc;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, activeTab]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Statistical Aggregates
    const stats = {
        running: { total: 0, minTime: Date.now(), count: 0 },
        biking: { total: 0, minTime: Date.now(), count: 0 },
        steps: { total: 0, minTime: Date.now(), count: 0 }
    };

    dataset.forEach(rec => {
        const dist = parseFloat(rec.calendar_num) || 0;
        const sub = rec.calendar_subname;
        let t = Date.now();
        if (rec.calendar_date) t = new Date(rec.calendar_date).getTime();

        if (sub === 'RUNNING') { stats.running.total += dist; stats.running.count++; if (t < stats.running.minTime) stats.running.minTime = t; }
        else if (sub === 'BIKING') { stats.biking.total += dist; stats.biking.count++; if (t < stats.biking.minTime) stats.biking.minTime = t; }
        else if (sub === 'STEPS') { stats.steps.total += dist; stats.steps.count++; if (t < stats.steps.minTime) stats.steps.minTime = t; }
    });

    const resolveAverages = (stat) => {
        const msPerDay = 1000 * 60 * 60 * 24;
        let daysDiff = stat.count > 0 ? Math.max(1, (Date.now() - stat.minTime) / msPerDay) : 1;
        const daily = stat.total / daysDiff;
        const weekly = daily * 7;
        const yearly = daily * 365;
        return { daily, weekly, yearly };
    };

    const runAvgs = resolveAverages(stats.running);
    const bikeAvgs = resolveAverages(stats.biking);
    const stepAvgs = resolveAverages(stats.steps);

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
                <Activity style={{ color: 'var(--accent-primary)' }} size={28} />
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>Health Activities</h1>
            </div>

            {/* Form */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '32px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                        {editingId ? 'Edit Activity' : 'Log New Activity'}
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

                        <div style={{ gridColumn: 'span 1', position: 'relative' }}>
                            <InputLabel>Family Member *</InputLabel>
                            <input
                                type="text"
                                value={memberSearch}
                                onChange={(e) => {
                                    setMemberSearch(e.target.value);
                                    setShowMemberDropdown(true);
                                    if (e.target.value === '') setFormData(prev => ({ ...prev, member: '' }));
                                }}
                                onFocus={() => setShowMemberDropdown(true)}
                                style={inputStyle}
                                placeholder="Search family members..."
                            />
                            {showMemberDropdown && memberSearch && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', marginTop: '4px', zIndex: 50, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                    {familyMembers.filter(m => formatMember(m).toLowerCase().includes(memberSearch.toLowerCase())).map(m => (
                                        <div
                                            key={m.family_member_id}
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, member: m.family_member_id }));
                                                setMemberSearch(formatMember(m));
                                                setShowMemberDropdown(false);
                                            }}
                                            style={{ padding: '8px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', cursor: 'pointer', borderBottom: '1px solid var(--bg-primary)' }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            {formatMember(m)}
                                        </div>
                                    ))}
                                    {familyMembers.filter(m => formatMember(m).toLowerCase().includes(memberSearch.toLowerCase())).length === 0 && (
                                        <div style={{ padding: '8px 12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No members found.</div>
                                    )}
                                </div>
                            )}
                            {/* Invisible overlay to close dropdown */}
                            {showMemberDropdown && <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowMemberDropdown(false)} />}
                        </div>

                        <div style={{ gridColumn: 'span 1', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <InputLabel>Location</InputLabel>
                                <button type="button" onClick={(e) => { e.stopPropagation(); setShowPlaceModal(true); }} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                                    <Plus size={12} /> New Place
                                </button>
                            </div>
                            <input
                                type="text"
                                value={placeSearch}
                                onChange={(e) => {
                                    setPlaceSearch(e.target.value);
                                    setShowPlaceDropdown(true);
                                    if (e.target.value === '') setFormData(prev => ({ ...prev, place: '' }));
                                }}
                                onFocus={() => setShowPlaceDropdown(true)}
                                style={inputStyle}
                                placeholder="Search places..."
                            />
                            {showPlaceDropdown && placeSearch && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', marginTop: '4px', zIndex: 50, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                    {places.filter(p => formatPlace(p).toLowerCase().includes(placeSearch.toLowerCase())).slice(0, 20).map(p => (
                                        <div
                                            key={p.place_id}
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, place: p.place_id }));
                                                setPlaceSearch(formatPlace(p));
                                                setShowPlaceDropdown(false);
                                            }}
                                            style={{ padding: '8px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', cursor: 'pointer', borderBottom: '1px solid var(--bg-primary)' }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            {formatPlace(p)}
                                        </div>
                                    ))}
                                    {places.filter(p => formatPlace(p).toLowerCase().includes(placeSearch.toLowerCase())).length === 0 && (
                                        <div style={{ padding: '8px 12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No places found.</div>
                                    )}
                                </div>
                            )}
                            {/* Invisible overlay to close dropdown */}
                            {showPlaceDropdown && <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowPlaceDropdown(false)} />}
                        </div>

                        <div style={{ gridColumn: 'span 1' }}>
                            <InputLabel>Type *</InputLabel>
                            <select name="subname" value={formData.subname} onChange={handleInputChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                                <option value="RUNNING">Running</option>
                                <option value="BIKING">Biking</option>
                                <option value="STEPS">Steps</option>
                            </select>
                        </div>

                        <div style={{ gridColumn: 'span 1' }}>
                            <InputLabel>Date *</InputLabel>
                            <input required type="date" name="date" value={formData.date} onChange={handleInputChange} style={{ ...inputStyle, colorScheme: 'dark' }} />
                        </div>

                        <div style={{ gridColumn: 'span 1' }}>
                            <InputLabel>Distance (Miles / Steps) *</InputLabel>
                            <input required type="number" step="any" name="distance" value={formData.distance} onChange={handleInputChange} style={inputStyle} placeholder="e.g. 5.2" />
                        </div>

                        <div style={{ gridColumn: 'span 1' }}>
                            <InputLabel>Duration (Minutes)</InputLabel>
                            <input type="number" step="any" name="duration" value={formData.duration} onChange={handleInputChange} style={inputStyle} placeholder="e.g. 45" />
                        </div>

                        <div style={{ gridColumn: 'span 1' }}>
                            <InputLabel>Event Name</InputLabel>
                            <input type="text" name="event_name" value={formData.event_name} onChange={handleInputChange} style={inputStyle} placeholder="Event Name / Title" />
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                            <InputLabel>Event Description</InputLabel>
                            <input type="text" name="event_desc" value={formData.event_desc} onChange={handleInputChange} style={inputStyle} placeholder="How did it feel?" />
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                            <InputLabel>Attach GPX File (Optional Map Track)</InputLabel>
                            <input id="gpxUpload" type="file" accept=".gpx" onChange={handleFileUpload} style={{ ...inputStyle, padding: '8px' }} />
                            {formData.gpx && <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: 'var(--accent-primary)' }}>GPX Data attached ({Math.round(formData.gpx.length / 1024)} KB)</p>}
                        </div>

                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                        <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseOut={(e) => e.currentTarget.style.filter = 'none'}>
                            <CheckCircle2 size={18} />
                            {editingId ? 'Save Changes' : 'Log Activity'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {['ALL', 'RUNNING', 'BIKING', 'STEPS', 'STATS'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: activeTab === tab ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                            color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
                            border: '1px solid',
                            borderColor: activeTab === tab ? 'var(--accent-primary)' : 'var(--border-color)',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab === 'ALL' ? 'All Activities' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {/* List or Stats conditionally */}
            {activeTab === 'STATS' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>Total Miles Ran</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)', margin: '0 0 16px 0' }}>{stats.running.total.toFixed(1)}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <div><span style={{ display: 'block', fontWeight: 600 }}>Daily Avg</span>{runAvgs.daily.toFixed(1)}</div>
                            <div><span style={{ display: 'block', fontWeight: 600 }}>Weekly Avg</span>{runAvgs.weekly.toFixed(1)}</div>
                            <div><span style={{ display: 'block', fontWeight: 600 }}>Yearly Est</span>{runAvgs.yearly.toFixed(0)}</div>
                        </div>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>Total Miles Biked</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)', margin: '0 0 16px 0' }}>{stats.biking.total.toFixed(1)}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <div><span style={{ display: 'block', fontWeight: 600 }}>Daily Avg</span>{bikeAvgs.daily.toFixed(1)}</div>
                            <div><span style={{ display: 'block', fontWeight: 600 }}>Weekly Avg</span>{bikeAvgs.weekly.toFixed(1)}</div>
                            <div><span style={{ display: 'block', fontWeight: 600 }}>Yearly Est</span>{bikeAvgs.yearly.toFixed(0)}</div>
                        </div>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>Total Steps Walked</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)', margin: '0 0 16px 0' }}>{stats.steps.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <div><span style={{ display: 'block', fontWeight: 600 }}>Daily Avg</span>{stepAvgs.daily.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            <div><span style={{ display: 'block', fontWeight: 600 }}>Weekly Avg</span>{stepAvgs.weekly.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            <div><span style={{ display: 'block', fontWeight: 600 }}>Yearly Est</span>{stepAvgs.yearly.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    {isLoading ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading activities...</div>
                    ) : dataset.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No activities recorded yet. Go touch grass!</div>
                    ) : (
                        <div style={{ width: '100%', overflowX: 'auto' }}>
                            <PaginationControls isTop={true} totalItems={filteredData.length} currentPage={currentPage} itemsPerPage={itemsPerPage} setCurrentPage={setCurrentPage} setItemsPerPage={setItemsPerPage} />
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '800px' }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                    <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', width: '120px' }}>
                                            Member
                                            <input type="text" placeholder="Filter..." value={filters.member} onChange={(e) => handleFilterChange('member', e.target.value)} style={filterInputStyle} onClick={(e) => e.stopPropagation()} />
                                        </th>
                                        {activeTab === 'ALL' && (
                                            <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', width: '120px' }}>
                                                Type
                                                <input type="text" placeholder="Filter..." value={filters.subname} onChange={(e) => handleFilterChange('subname', e.target.value)} style={filterInputStyle} onClick={(e) => e.stopPropagation()} />
                                            </th>
                                        )}
                                        <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', width: '150px' }}>
                                            Date
                                            <input type="text" placeholder="Filter..." value={filters.date} onChange={(e) => handleFilterChange('date', e.target.value)} style={filterInputStyle} onClick={(e) => e.stopPropagation()} />
                                        </th>
                                        <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Distance
                                            <input type="text" placeholder="Filter..." value={filters.distance} onChange={(e) => handleFilterChange('distance', e.target.value)} style={filterInputStyle} onClick={(e) => e.stopPropagation()} />
                                        </th>
                                        {activeTab !== 'STEPS' && (
                                            <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Duration
                                                <input type="text" placeholder="Filter..." value={filters.duration} onChange={(e) => handleFilterChange('duration', e.target.value)} style={filterInputStyle} onClick={(e) => e.stopPropagation()} />
                                            </th>
                                        )}
                                        {activeTab !== 'STEPS' && (
                                            <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Location
                                                <input type="text" placeholder="Filter..." value={filters.location} onChange={(e) => handleFilterChange('location', e.target.value)} style={filterInputStyle} onClick={(e) => e.stopPropagation()} />
                                            </th>
                                        )}
                                        <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Event Name
                                            <input type="text" placeholder="Filter..." value={filters.event_name} onChange={(e) => handleFilterChange('event_name', e.target.value)} style={filterInputStyle} onClick={(e) => e.stopPropagation()} />
                                        </th>
                                        <th style={{ padding: '16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Event Description
                                            <input type="text" placeholder="Filter..." value={filters.event_desc} onChange={(e) => handleFilterChange('event_desc', e.target.value)} style={filterInputStyle} onClick={(e) => e.stopPropagation()} />
                                        </th>
                                        <th style={{ padding: '16px', width: '140px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.map((rec) => (
                                        <React.Fragment key={rec.calendar_id}>
                                            <tr
                                                style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s', cursor: 'pointer', backgroundColor: activeMapId === rec.calendar_id ? 'var(--bg-primary)' : 'transparent' }}
                                                onMouseOver={(e) => { if (activeMapId !== rec.calendar_id) e.currentTarget.style.backgroundColor = 'var(--bg-primary)' }}
                                                onMouseOut={(e) => { if (activeMapId !== rec.calendar_id) e.currentTarget.style.backgroundColor = 'transparent' }}
                                                onClick={() => handleEdit(rec)}
                                            >
                                                <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                                                    {(() => {
                                                        const fm = familyMembers.find(f => f.family_member_id == rec.calendar_member);
                                                        return fm ? fm.family_first_name : 'Unknown';
                                                    })()}
                                                </td>
                                                {activeTab === 'ALL' && (
                                                    <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                                                        {rec.calendar_subname}
                                                    </td>
                                                )}
                                                <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                    {rec.calendar_date ? new Date(rec.calendar_date).toLocaleDateString() : '-'}
                                                </td>
                                                <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                    {rec.calendar_num !== null 
                                                        ? (rec.calendar_subname === 'STEPS' 
                                                            ? Math.round(rec.calendar_num).toLocaleString() 
                                                            : Number(rec.calendar_num).toFixed(1))
                                                        : '-'}
                                                </td>
                                                {activeTab !== 'STEPS' && (
                                                    <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                        {rec.calendar_num2 !== null ? `${Math.round(rec.calendar_num2)}m` : '-'}
                                                    </td>
                                                )}
                                                {activeTab !== 'STEPS' && (
                                                    <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {(() => {
                                                            if (!rec.place_id) return '-';
                                                            const p = places.find(x => x.place_id == rec.place_id);
                                                            return p ? formatPlace(p) : '-';
                                                        })()}
                                                    </td>
                                                )}
                                                <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {rec.calendar_event_name || '-'}
                                                </td>
                                                <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {rec.calendar_event_desc || '-'}
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                        {rec.calendar_gpx && (
                                                            <button onClick={(e) => { e.stopPropagation(); viewMap(rec); }} style={{ padding: '8px', color: activeMapId === rec.calendar_id ? '#fff' : 'var(--text-secondary)', backgroundColor: activeMapId === rec.calendar_id ? 'var(--accent-primary)' : 'transparent', border: '1px solid', borderColor: activeMapId === rec.calendar_id ? 'var(--accent-primary)' : 'var(--border-color)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={(e) => { if (activeMapId !== rec.calendar_id) { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--text-secondary)'; } }} onMouseOut={(e) => { if (activeMapId !== rec.calendar_id) { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; } }} title="Toggle Map">
                                                                <MapPin size={16} />
                                                            </button>
                                                        )}
                                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(rec); }} style={{ padding: '8px', color: 'var(--text-secondary)', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--text-secondary)'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }} title="Edit">
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(rec.calendar_id); }} style={{ padding: '8px', color: '#ef4444', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = '#ef4444'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'var(--border-color)'; }} title="Delete">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {activeMapId === rec.calendar_id && activeGeoJson && (
                                                <tr style={{ backgroundColor: '#111827' }}>
                                                    <td colSpan={activeTab === 'STEPS' ? 5 : 8} style={{ padding: '24px' }}>
                                                        <div style={{ height: '400px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--border-color)' }}>
                                                            <MapContainer
                                                                bounds={undefined}
                                                                zoom={13}
                                                                center={
                                                                    activeGeoJson?.features?.[0]?.geometry?.coordinates?.[0]
                                                                        ? [activeGeoJson.features[0].geometry.coordinates[0][1], activeGeoJson.features[0].geometry.coordinates[0][0]]
                                                                        : [40, -75]
                                                                }
                                                                style={{ height: '100%', width: '100%' }}
                                                            >
                                                                <TileLayer
                                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                                />
                                                                <GeoJSON
                                                                    data={activeGeoJson}
                                                                    style={{ color: '#ef4444', weight: 4, opacity: 0.8 }}
                                                                />
                                                            </MapContainer>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                    {filteredData.length === 0 && dataset.length > 0 && (
                                        <tr>
                                            <td colSpan={activeTab === 'STEPS' ? 6 : 9} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                No activities match your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            <PaginationControls isTop={false} totalItems={filteredData.length} currentPage={currentPage} itemsPerPage={itemsPerPage} setCurrentPage={setCurrentPage} setItemsPerPage={setItemsPerPage} />
                        </div>
                    )}
                </div>
            )}
            <PlaceFormModal 
                isOpen={showPlaceModal} 
                onClose={() => setShowPlaceModal(false)} 
                onSuccess={handlePlaceSuccess} 
            />
        </div>
    );
};

export default HealthActivities;
