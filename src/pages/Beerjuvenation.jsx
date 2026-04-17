import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, CheckCircle2, Calendar, Image as ImageIcon, ImagePlus, ChevronLeft, ChevronRight } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import { useUser } from '@clerk/clerk-react';

const Beerjuvenation = () => {
    const { user } = useUser();
    const isAdmin = user?.publicMetadata?.role === 'admin';

    const [dataset, setDataset] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeYear, setActiveYear] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(-1);

    const [formData, setFormData] = useState({
        year: new Date().getFullYear(),
        year_name: '',
        description: '',
        main_image_url: null,
        main_image_file: null,
        secondary_images: []
    });

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState(null);

    const handleDragStart = (index) => setDraggedIndex(index);
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (index) => {
        if (draggedIndex === null || draggedIndex === index) return;
        setFormData(prev => {
            const newArray = [...prev.secondary_images];
            const [moved] = newArray.splice(draggedIndex, 1);
            newArray.splice(index, 0, moved);
            return { ...prev, secondary_images: newArray };
        });
        setDraggedIndex(null);
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/beerjuvenation');
            const data = await res.json();
            setDataset(data);
            if (data.length > 0 && !activeYear) {
                setActiveYear(data[0].year);
            }
        } catch (error) {
            console.error("Failed to load records", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenForm = (record = null) => {
        if (record) {
            setIsEditing(true);
            setFormData({
                year: record.year,
                year_name: record.year_name || '',
                description: record.description || '',
                main_image_url: record.main_image_url || null,
                main_image_file: null,
                secondary_images: record.secondary_image_urls || []
            });
        } else {
            setIsEditing(false);
            setFormData({
                year: new Date().getFullYear(),
                year_name: '',
                description: '',
                main_image_url: null,
                main_image_file: null,
                secondary_images: []
            });
        }
        setIsFormOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let finalMainImageUrl = formData.main_image_url;
            if (formData.main_image_file) {
                const ext = formData.main_image_file.name.split('.').pop() || 'jpg';
                const uploadName = `BEERJUVENATION_${formData.year}_01.${ext}`;
                const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(uploadName)}`, { method: 'POST', body: formData.main_image_file });
                const blobObj = await uploadRes.json();
                finalMainImageUrl = `${blobObj.url}?v=${Date.now()}`;
            }

            const finalSecondaryUrls = [];
            let seq = 2; // Indexes start at 2 since Main Image is 01
            for (const item of formData.secondary_images) {
                if (typeof item === 'string') {
                    finalSecondaryUrls.push(item);
                    seq++;
                } else {
                    const ext = item.name.split('.').pop() || 'jpg';
                    const uploadName = `BEERJUVENATION_${formData.year}_${String(seq).padStart(2, '0')}.${ext}`;
                    const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(uploadName)}`, { method: 'POST', body: item });
                    const blobObj = await uploadRes.json();
                    finalSecondaryUrls.push(`${blobObj.url}?v=${Date.now()}`);
                    seq++;
                }
            }

            const payload = {
                year: formData.year,
                year_name: formData.year_name,
                description: formData.description,
                main_image_url: finalMainImageUrl,
                secondary_image_urls: finalSecondaryUrls
            };

            const method = isEditing ? 'PUT' : 'POST';
            const res = await fetch('/api/beerjuvenation', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                alert(`Error: ${err.error || res.statusText}`);
                setIsSaving(false);
                return;
            }

            await fetchRecords();
            setIsFormOpen(false);
            setActiveYear(formData.year);
        } catch (error) {
            console.error("Save failed", error);
            alert("Network request failed.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (year) => {
        if (!window.confirm(`Are you sure you want to delete the entry for ${year}?`)) return;
        try {
            await fetch(`/api/beerjuvenation?year=${year}`, { method: 'DELETE' });
            if (activeYear === year) setActiveYear(null);
            fetchRecords();
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const activeRecord = dataset.find(d => d.year === activeYear);

    const allImages = activeRecord ? [
        ...(activeRecord.main_image_url ? [activeRecord.main_image_url] : []),
        ...(activeRecord.secondary_image_urls || [])
    ] : [];

    const openLightbox = (url) => setLightboxIndex(allImages.indexOf(url));

    // Common styling
    const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none' };
    const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>

            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Calendar style={{ color: '#f59e0b' }} size={32} />
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>Beerjuvenation</h1>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Since the beginning of time there have been men that make their fortunes off the backs of others. This holiday is meant for us who toil. Let it all go for a while. Be happy, be content with right now! Relax!</p>
                    </div>
                </div>
            </div>

            {/* Layout: Sidebar & Main Content */}
            <div style={{ display: 'flex', gap: '32px', minHeight: '600px', alignItems: 'flex-start' }}>

                {/* Year Sidebar Navigation */}
                <div style={{ width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {isAdmin && (
                        <button 
                            onClick={() => handleOpenForm(null)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', backgroundColor: '#f59e0b', color: 'black', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.4)' }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                        >
                            <Plus size={18} />
                            Add New Entry
                        </button>
                    )}
                    
                    <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', margin: '0 0 16px 0' }}>Timeline</h3>

                        {isLoading ? (
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Loading...</div>
                        ) : dataset.length === 0 ? (
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No entries yet.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {dataset.map(rec => (
                                    <button
                                        key={rec.year}
                                        onClick={() => setActiveYear(rec.year)}
                                        style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '12px 16px', width: '100%',
                                            backgroundColor: activeYear === rec.year ? 'var(--bg-primary)' : 'transparent',
                                            border: activeYear === rec.year ? '1px solid var(--border-color)' : '1px solid transparent',
                                            borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                                            color: activeYear === rec.year ? '#f59e0b' : 'var(--text-primary)',
                                            fontWeight: activeYear === rec.year ? 600 : 400
                                        }}
                                        onMouseOver={e => { if (activeYear !== rec.year) e.currentTarget.style.backgroundColor = 'var(--bg-primary)' }}
                                        onMouseOut={e => { if (activeYear !== rec.year) e.currentTarget.style.backgroundColor = 'transparent' }}
                                    >
                                        <span>{rec.year}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main View Area */}
                <div style={{ flexGrow: 1 }}>
                    {activeRecord ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Record Header */}
                            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '24px', marginBottom: '8px' }}>
                                <h2 style={{ fontSize: '3rem', fontWeight: 800, margin: '0 0 16px 0', color: '#f59e0b', letterSpacing: '-0.02em', lineHeight: 1 }}>
                                    {activeRecord.year} {activeRecord.year_name && <span style={{ fontSize: '2rem', color: 'var(--text-primary)', fontWeight: 600, marginLeft: '8px' }}>- {activeRecord.year_name}</span>}
                                </h2>
                                {isAdmin && (
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={() => handleOpenForm(activeRecord)} style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Edit2 size={14} /> Edit Entry
                                        </button>
                                        <button onClick={() => handleDelete(activeRecord.year)} style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 500, color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Trash2 size={14} /> Delete Entry
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-color)', fontSize: '1rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                                {activeRecord.description ? (
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{activeRecord.description}</div>
                                ) : (
                                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No description provided.</span>
                                )}
                            </div>

                            {/* Main Image Banner */}
                            {activeRecord.main_image_url ? (
                                <div onClick={() => openLightbox(activeRecord.main_image_url)} style={{ width: '100%', height: '500px', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', position: 'relative', cursor: 'pointer' }}>
                                    <img src={activeRecord.main_image_url} alt={`${activeRecord.year} Main`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            ) : (
                                <div style={{ width: '100%', height: '300px', borderRadius: '16px', backgroundColor: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                    <ImageIcon size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                                    <p>No main image provided for {activeRecord.year}</p>
                                </div>
                            )}

                            {/* Secondary Images Gallery */}
                            {activeRecord.secondary_image_urls && activeRecord.secondary_image_urls.length > 0 && (
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '16px' }}>Gallery</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                                        {activeRecord.secondary_image_urls.map((url, i) => (
                                            <div key={i} onClick={() => openLightbox(url)} style={{ borderRadius: '12px', overflow: 'hidden', height: '200px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                                                <img src={url} alt={`Gallery ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
                            <Calendar size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                            <h2>Select a Year</h2>
                            <p>Pick a year from the timeline to view</p>
                        </div>
                    )}
                </div>

            </div>

            {/* Lightbox / Image Carousel */}
            {lightboxIndex >= 0 && allImages.length > 0 && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'white', fontWeight: 600, fontSize: '1.25rem', letterSpacing: '0.05em' }}>{lightboxIndex + 1} / {allImages.length}</span>
                        <button onClick={() => setLightboxIndex(-1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={36} />
                        </button>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        {allImages.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => (prev - 1 + allImages.length) % allImages.length); }}
                                style={{ position: 'absolute', left: '32px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', color: 'white', padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
                            >
                                <ChevronLeft size={32} />
                            </button>
                        )}

                        <img
                            src={allImages[lightboxIndex]}
                            alt={`Lightbox ${lightboxIndex}`}
                            style={{ maxWidth: '85vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                        />

                        {allImages.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => (prev + 1) % allImages.length); }}
                                style={{ position: 'absolute', right: '32px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', color: 'white', padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
                            >
                                <ChevronRight size={32} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Form */}
            {isFormOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ backgroundColor: 'var(--bg-primary)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{isEditing ? `Edit ${formData.year}` : 'Add New Entry'}</h2>
                            <button onClick={() => setIsFormOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ display: 'flex', gap: '24px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Year *</label>
                                    <input
                                        type="number"
                                        value={formData.year}
                                        onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) || '' })}
                                        required
                                        readOnly={isEditing}
                                        style={{ ...inputStyle, opacity: isEditing ? 0.7 : 1, cursor: isEditing ? 'not-allowed' : 'text' }}
                                    />
                                    {isEditing && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>Primary key cannot be reassigned.</span>}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>This Years Name</label>
                                    <input
                                        type="text"
                                        value={formData.year_name}
                                        onChange={e => setFormData({ ...formData, year_name: e.target.value })}
                                        placeholder="e.g. The Year of the Stout"
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Description Details</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={6}
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                    placeholder="Tell the story of this year's brewing experience..."
                                />
                            </div>

                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                                <label style={labelStyle}>Main Highlight Image</label>
                                {formData.main_image_url || formData.main_image_file ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
                                        <img src={formData.main_image_file ? URL.createObjectURL(formData.main_image_file) : formData.main_image_url} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                                        <button type="button" onClick={() => setFormData({ ...formData, main_image_url: null, main_image_file: null })} style={{ padding: '8px', color: '#ef4444', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}>Remove Primary Image</button>
                                    </div>
                                ) : (
                                    <ImageUploader 
                                        onFileSelect={(file) => setFormData(prev => ({...prev, main_image_file: file}))} 
                                        label="Select or drop the main showcase image" 
                                    />
                                )}
                            </div>

                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <label style={{ ...labelStyle, marginBottom: 0 }}>Secondary Images Gallery ({formData.secondary_images.length})</label>
                                </div>

                                {formData.secondary_images.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                                        {formData.secondary_images.map((item, i) => (
                                            <div
                                                key={i}
                                                draggable
                                                onDragStart={() => handleDragStart(i)}
                                                onDragOver={handleDragOver}
                                                onDrop={() => handleDrop(i)}
                                                style={{ position: 'relative', width: '100px', height: '100px', cursor: 'grab', opacity: draggedIndex === i ? 0.4 : 1, transition: 'opacity 0.2s', zIndex: draggedIndex === i ? 10 : 1 }}
                                            >
                                                <img src={typeof item === 'string' ? item : URL.createObjectURL(item)} alt={`Gallery grid ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)', pointerEvents: 'none' }} />
                                                <button type="button" onClick={() => setFormData({ ...formData, secondary_images: formData.secondary_images.filter((_, idx) => idx !== i) })} style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#ef4444', color: 'white', borderRadius: '50%', border: 'none', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, zIndex: 20 }}>
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <ImageUploader 
                                    multiple={true} 
                                    onFileSelect={(files) => setFormData(prev => ({...prev, secondary_images: [...prev.secondary_images, ...files]}))} 
                                    label="Add additional gallery images" 
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                                <button type="button" onClick={() => setIsFormOpen(false)} style={{ padding: '12px 24px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                                    Cancel
                                </button>
                                {(() => {
                                    const isSubmitDisabled = isSaving || !(formData.main_image_url || formData.main_image_file);
                                    return (
                                        <button type="submit" disabled={isSubmitDisabled} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#f59e0b', color: 'black', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: isSaving ? 'wait' : isSubmitDisabled ? 'not-allowed' : 'pointer', boxShadow: isSubmitDisabled ? 'none' : '0 2px 4px rgba(0,0,0,0.1)', transform: isSaving ? 'scale(0.96)' : 'scale(1)', opacity: isSubmitDisabled ? 0.5 : 1, filter: (isSubmitDisabled && !isSaving) ? 'grayscale(1)' : 'none', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                                            <CheckCircle2 size={18} />
                                            {isSaving ? 'Processing Content...' : (isEditing ? 'Save Changes' : 'Publish Entry')}
                                        </button>
                                    );
                                })()}
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Beerjuvenation;
