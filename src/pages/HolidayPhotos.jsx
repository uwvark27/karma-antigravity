import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, CheckCircle2, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import { useUser } from '@clerk/clerk-react';

const HolidayPhotos = () => {
    const { user } = useUser();
    const isAdmin = user?.publicMetadata?.role === 'admin';

    const [dataset, setDataset] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(-1);

    const [formData, setFormData] = useState({
        year: new Date().getFullYear(),
        image_url: null,
        image_file: null
    });

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/holiday-photos');
            const data = await res.json();
            setDataset(data);
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
                image_url: record.image_url || null,
                image_file: null
            });
        } else {
            setIsEditing(false);
            setFormData({
                year: new Date().getFullYear(),
                image_url: null,
                image_file: null
            });
        }
        setIsFormOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let finalImageUrl = formData.image_url;

            // Optional: Formally stream the binary payload if a new file is bound
            if (formData.image_file) {
                const ext = formData.image_file.name.split('.').pop() || 'jpg';
                const uploadName = `HOLIDAY_PHOTO_${formData.year}.${ext}`;

                const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(uploadName)}`, {
                    method: 'POST',
                    body: formData.image_file
                });

                if (!uploadRes.ok) throw new Error("Vercel Blob failed to process the image stream.");

                const blobObj = await uploadRes.json();

                // Append cache bypass tag to database record only string visually
                finalImageUrl = `${blobObj.url}?v=${Date.now()}`;
            }

            const method = isEditing ? 'PUT' : 'POST';
            const payload = { ...formData, image_url: finalImageUrl };
            delete payload.image_file;

            const res = await fetch('/api/holiday-photos', {
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
        } catch (error) {
            console.error("Save failed", error);
            alert("Network request failed.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (year) => {
        if (!window.confirm(`Are you sure you want to delete the photo for ${year}?`)) return;
        try {
            const res = await fetch(`/api/holiday-photos?year=${year}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            await fetchRecords();
            if (lightboxIndex !== -1) setLightboxIndex(-1);
        } catch (error) {
            console.error(error);
            alert("Failed to delete record.");
        }
    };

    // Styling
    const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none' };
    const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' };

    // Extract all images for Lightbox
    const allImages = dataset.filter(d => d.image_url).map(d => d.image_url);
    const openLightbox = (url) => setLightboxIndex(allImages.indexOf(url));

    return (
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Holiday Photos</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.1rem' }}>Trying to take a nice family photo once a year</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => handleOpenForm(null)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#f59e0b', color: 'black', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.4)' }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                    >
                        <Plus size={18} /> Add New Photo
                    </button>
                )}
            </div>

            {/* Main Visual Grid */}
            {isLoading ? (
                <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>Loading gallery...</div>
                </div>
            ) : dataset.length === 0 ? (
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px dashed var(--border-color)', minHeight: '400px' }}>
                    <ImageIcon size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                    <h2>No Holiday Photos Found</h2>
                    <p>It looks like there are no holidays recorded yet.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {dataset.map((record) => (
                        <div key={record.year} style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', height: '350px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                            {record.image_url ? (
                                <img
                                    src={record.image_url}
                                    alt={`Holiday ${record.year}`}
                                    onClick={() => openLightbox(record.image_url)}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.3s' }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                    No Image
                                </div>
                            )}

                            {/* Overlay Badge */}
                            <div style={{ position: 'absolute', bottom: '16px', left: '16px', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: '8px 16px', borderRadius: '8px', color: 'white', fontWeight: 'bold', fontSize: '1.25rem', pointerEvents: 'none' }}>
                                {record.year}
                            </div>

                            {/* Admin Controls Overlay */}
                            {isAdmin && (
                                <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                                    <button onClick={(e) => { e.stopPropagation(); handleOpenForm(record); }} style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', border: 'none', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(record.year); }} style={{ backgroundColor: 'rgba(239, 68, 68, 0.8)', backdropFilter: 'blur(4px)', border: 'none', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

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
                    <div style={{ backgroundColor: 'var(--bg-primary)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{isEditing ? `Edit Photo for ${formData.year}` : 'Upload Holiday Photo'}</h2>
                            <button onClick={() => setIsFormOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label style={labelStyle}>Year *</label>
                                <input
                                    type="number"
                                    value={formData.year}
                                    onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                                    disabled={isEditing}
                                    style={{ ...inputStyle, backgroundColor: isEditing ? 'var(--bg-secondary)' : 'var(--bg-primary)', cursor: isEditing ? 'not-allowed' : 'text' }}
                                />
                                {isEditing && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>Primary key cannot be reassigned.</span>}
                            </div>

                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                                <label style={labelStyle}>Holiday Image</label>
                                {formData.image_url || formData.image_file ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
                                        <img src={formData.image_file ? URL.createObjectURL(formData.image_file) : formData.image_url} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                                        <button type="button" onClick={() => setFormData({ ...formData, image_url: null, image_file: null })} style={{ padding: '8px', color: '#ef4444', backgroundColor: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}>Remove Image</button>
                                    </div>
                                ) : (
                                    <ImageUploader
                                        onFileSelect={(file) => setFormData(prev => ({ ...prev, image_file: file }))}
                                        label="Select or drop the holiday photo"
                                    />
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                                <button type="button" onClick={() => setIsFormOpen(false)} style={{ padding: '12px 24px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                                    Cancel
                                </button>
                                {(() => {
                                    const isSubmitDisabled = isSaving || !(formData.image_url || formData.image_file);
                                    return (
                                        <button type="submit" disabled={isSubmitDisabled} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#f59e0b', color: 'black', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: isSaving ? 'wait' : isSubmitDisabled ? 'not-allowed' : 'pointer', boxShadow: isSubmitDisabled ? 'none' : '0 2px 4px rgba(0,0,0,0.1)', transform: isSaving ? 'scale(0.96)' : 'scale(1)', opacity: isSubmitDisabled ? 0.5 : 1, filter: (isSubmitDisabled && !isSaving) ? 'grayscale(1)' : 'none', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                                            <CheckCircle2 size={18} />
                                            {isSaving ? 'Processing...' : (isEditing ? 'Save Changes' : 'Upload Photo')}
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

export default HolidayPhotos;
