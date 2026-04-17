import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle } from 'lucide-react';

const ImageUploader = ({ onFileSelect, label = "Select Image File", multiple = false }) => {
    const [selectedCount, setSelectedCount] = useState(0);
    const fileInputRef = useRef(null);

    const handleSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setSelectedCount(files.length);
        
        if (onFileSelect) {
            if (multiple) {
                onFileSelect(files);
            } else {
                onFileSelect(files[0]);
            }
        }

        // Reset so the same file could technically be selected again if they removed it
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', border: '1px dashed var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-primary)' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
            
            <div style={{ position: 'relative' }}>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleSelect} 
                    accept="image/*"
                    multiple={multiple}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', transition: 'background-color 0.2s' }}>
                    <UploadCloud size={16} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        {selectedCount > 0 ? `Selected ${selectedCount} file${selectedCount > 1 ? 's' : ''} - Click to change` : 'Click to select image file(s)'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ImageUploader;
