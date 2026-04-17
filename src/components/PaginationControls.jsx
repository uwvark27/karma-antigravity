import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PaginationControls = ({ isTop, totalItems, currentPage, itemsPerPage, setCurrentPage, setItemsPerPage }) => {
    if (totalItems === 0) return null;

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: isTop ? '1px solid var(--border-color)' : 'none', borderTop: isTop ? 'none' : '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', position: isTop ? 'sticky' : 'static', top: isTop ? 0 : 'auto', zIndex: isTop ? 11 : 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} records
                </div>
                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.875rem', cursor: 'pointer' }}>
                    <option value={10}>10 records</option>
                    <option value={25}>25 records</option>
                    <option value={50}>50 records</option>
                    <option value={100}>100 records</option>
                </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--text-primary)', padding: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, display: 'flex', alignItems: 'center' }}>
                    <ChevronLeft size={18} />
                </button>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    Page {currentPage} of {totalPages || 1}
                </span>
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages || totalPages === 0} style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', color: (currentPage === totalPages || totalPages === 0) ? 'var(--text-secondary)' : 'var(--text-primary)', padding: '6px', cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer', opacity: (currentPage === totalPages || totalPages === 0) ? 0.5 : 1, display: 'flex', alignItems: 'center' }}>
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default PaginationControls;
