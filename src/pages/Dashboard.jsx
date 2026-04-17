import React, { useState, useEffect, useCallback } from 'react';
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon,
    Sun, Clock, Gift, HeartCrack, PartyPopper, Quote,
    Plus, X, Edit2, Trash2
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { RRule } from 'rrule';

const Dashboard = () => {
    const { user } = useUser();
    const isAdmin = user?.publicMetadata?.role === 'admin';

    // ── Quotes state ──────────────────────────────────────────────
    const [quotes, setQuotes] = useState([]);
    const [isLoadingQuotes, setIsLoadingQuotes] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(null);
    const [apiError, setApiError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState(null);
    const [formData, setFormData] = useState({ quote: '', attribution: '' });
    const [isSaving, setIsSaving] = useState(false);

    // ── Today state ───────────────────────────────────────────────
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [familyMembers, setFamilyMembers] = useState([]);
    const [isLoadingFamily, setIsLoadingFamily] = useState(true);
    const [celebrations, setCelebrations] = useState([]);
    const [isLoadingCelebrations, setIsLoadingCelebrations] = useState(true);

    const currentDate = new Date();

    // ── Data fetching ─────────────────────────────────────────────
    const loadQuotes = useCallback(() => {
        setIsLoadingQuotes(true);
        fetch('/api/quotes')
            .then(r => r.json())
            .then(data => {
                if (data && data.error) { setApiError(data.error); setIsLoadingQuotes(false); return; }
                const rows = Array.isArray(data) ? data : [];
                setQuotes(rows);
                if (rows.length > 0) {
                    setCurrentIndex(prev => prev === null
                        ? Math.floor(Math.random() * rows.length)
                        : Math.min(prev, rows.length - 1));
                }
                setIsLoadingQuotes(false);
            })
            .catch(err => { setApiError(err.message); setIsLoadingQuotes(false); });
    }, []);

    useEffect(() => { loadQuotes(); }, [loadQuotes]);

    useEffect(() => {
        fetch('/api/family-members')
            .then(r => r.json())
            .then(data => { setFamilyMembers(data || []); setIsLoadingFamily(false); })
            .catch(() => setIsLoadingFamily(false));
    }, []);

    useEffect(() => {
        fetch('/api/celebrations')
            .then(r => r.json())
            .then(data => { setCelebrations(data || []); setIsLoadingCelebrations(false); })
            .catch(() => setIsLoadingCelebrations(false));
    }, []);

    // ── Quote actions ─────────────────────────────────────────────
    const handlePrevQuote = () => { if (quotes.length) setCurrentIndex(i => (i - 1 + quotes.length) % quotes.length); };
    const handleNextQuote = () => { if (quotes.length) setCurrentIndex(i => (i + 1) % quotes.length); };

    const openAdd = () => { setEditingQuote(null); setFormData({ quote: '', attribution: '' }); setIsFormOpen(true); };
    const openEdit = (q) => { setEditingQuote(q); setFormData({ quote: q.quote_desc, attribution: q.quote_author || '' }); setIsFormOpen(true); };
    const closeForm = () => { setIsFormOpen(false); setEditingQuote(null); };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const method = editingQuote ? 'PUT' : 'POST';
            const payload = {
                ...(editingQuote ? { id: editingQuote.quote_id } : {}),
                quote_desc: formData.quote,
                quote_author: formData.attribution || null,
            };
            await fetch('/api/quotes', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            await loadQuotes();
            closeForm();
        } catch (err) { console.error(err); } finally { setIsSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this quote?')) return;
        await fetch(`/api/quotes?id=${id}`, { method: 'DELETE' });
        setQuotes(prev => { const next = prev.filter(q => q.quote_id !== id); setCurrentIndex(next.length ? 0 : null); return next; });
    };

    // ── Date navigation ───────────────────────────────────────────
    const handlePrevDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); };
    const handleNextDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); };
    const handleDatePick = (e) => {
        const val = e.target.value; if (!val) return;
        const [y, m, d] = val.split('-');
        if (y && m && d) setSelectedDate(new Date(y, m - 1, d));
    };

    const getDayOfYear = (date) => {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = (date - start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
        return Math.floor(diff / 1000 / 60 / 60 / 24);
    };
    const formatLongDate = (date) => date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const getAge = (birthStr, targetStr) => {
        if (!birthStr || !targetStr) return null;
        const [bY, bM, bD] = birthStr.split('T')[0].split('-').map(Number);
        const [tY, tM, tD] = targetStr.split('T')[0].split('-').map(Number);
        let age = tY - bY;
        if (tM < bM || (tM === bM && tD < bD)) age--;
        return age;
    };

    const dayOfYear = getDayOfYear(selectedDate);
    const isToday = selectedDate.toDateString() === currentDate.toDateString();
    const selectedMonth = selectedDate.getMonth() + 1;
    const selectedDay = selectedDate.getDate();
    const selectedYear = selectedDate.getFullYear();

    // ── Family filtering ──────────────────────────────────────────
    const filteredBirthdays = [], filteredDeathdays = [];
    familyMembers.forEach(member => {
        if (member.family_birthday) {
            const [bY, bM, bD] = member.family_birthday.split('T')[0].split('-').map(Number);
            if (bM === selectedMonth && bD === selectedDay) {
                filteredBirthdays.push(member.family_deathday
                    ? { ...member, isDeceased: true, wouldBeAge: selectedYear - bY, deathDateStr: member.family_deathday.split('T')[0] }
                    : { ...member, isDeceased: false, age: selectedYear - bY });
            }
        }
        if (member.family_deathday) {
            const [, dM, dD] = member.family_deathday.split('T')[0].split('-').map(Number);
            if (dM === selectedMonth && dD === selectedDay)
                filteredDeathdays.push({ ...member, finalAge: getAge(member.family_birthday, member.family_deathday) });
        }
    });

    const filteredCelebrations = celebrations.filter(cel => {
        if (!cel.is_dynamic) return cel.fixed_month === selectedMonth && cel.fixed_day === selectedDay;
        try {
            const rule = RRule.fromString(cel.rrule_string);
            const s = new Date(selectedDate); s.setHours(0, 0, 0, 0);
            const e = new Date(selectedDate); e.setHours(23, 59, 59, 999);
            return rule.between(s, e, true).length > 0;
        } catch { return false; }
    });

    const current = quotes.length && currentIndex !== null ? quotes[currentIndex] : null;

    const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px 14px', fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' };
    const labelStyle = { display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' };
    return (
        <div style={{ maxWidth: '1200px', width: '100%', boxSizing: 'border-box', margin: '0 auto', padding: '32px' }}>

            {/* ── Wordmark ────────────────────────────────────── */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.3em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>Welcome to</div>
                <h1 style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '0.12em', color: 'var(--accent-primary)', margin: 0, textTransform: 'uppercase' }}>Cartwright Connect</h1>
            </div>

            {/* ── Quote card ──────────────────────────────────── */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '20px', padding: '20px 24px', border: '1px solid var(--border-color)', boxShadow: '0 8px 30px -10px rgba(0,0,0,0.3)', position: 'relative', marginBottom: '24px', height: '250px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', top: '16px', left: '20px', color: 'rgba(245,158,11,0.1)', lineHeight: 1 }}><Quote size={40} /></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {/* Prev quote */}
                    <button onClick={handlePrevQuote} disabled={!quotes.length} style={{ border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '10px', borderRadius: '50%', cursor: quotes.length ? 'pointer' : 'default', display: 'flex', flexShrink: 0, opacity: quotes.length ? 1 : 0.3 }}>
                        <ChevronLeft size={18} />
                    </button>

                    {/* Quote text */}
                    <div style={{ flex: 1, textAlign: 'center', minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto', padding: '0 12px' }}>
                        {isLoadingQuotes ? (
                            <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Loading...</span>
                        ) : !current ? (
                            <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                {apiError ? <><span style={{ color: '#ef4444' }}>Error:</span> {apiError}</> : 'No quotes yet.'}
                            </span>
                        ) : (
                            <>
                                <p style={{ fontSize: '1rem', fontWeight: 500, lineHeight: 1.5, color: 'var(--text-primary)', fontStyle: 'italic', margin: '0 0 6px 0', position: 'relative', zIndex: 1 }}>
                                    {current.quote_desc}
                                </p>
                                {current.quote_author && (
                                    <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>— {current.quote_author}</div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Next quote */}
                    <button onClick={handleNextQuote} disabled={!quotes.length} style={{ border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '10px', borderRadius: '50%', cursor: quotes.length ? 'pointer' : 'default', display: 'flex', flexShrink: 0, opacity: quotes.length ? 1 : 0.3 }}>
                        <ChevronRight size={18} />
                    </button>
                </div>

                {/* Quote controls row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {quotes.length > 0 && currentIndex !== null && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{currentIndex + 1} / {quotes.length}</span>
                    )}
                    <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>
                        <Plus size={12} /> Add Quote
                    </button>
                    {isAdmin && current && (
                        <>
                            <button onClick={() => openEdit(current)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem' }}>
                                <Edit2 size={12} /> Edit
                            </button>
                            <button onClick={() => handleDelete(current.quote_id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem' }}>
                                <Trash2 size={12} /> Delete
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── Today header ────────────────────────────────── */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '24px', padding: '28px 32px', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 16px rgba(245,158,11,0.3)' }}>
                        <Sun size={32} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Today in Cartwright</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
                            <Clock size={14} />
                            <span>Current Local Date: <strong
                                onClick={() => setSelectedDate(new Date())}
                                style={{ cursor: 'pointer', borderBottom: '1px dashed var(--text-secondary)', transition: 'color 0.2s' }}
                                onMouseOver={e => e.currentTarget.style.color = '#f59e0b'}
                                onMouseOut={e => e.currentTarget.style.color = ''}
                                title="Jump back to today"
                            >{formatLongDate(currentDate)}</strong></span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'var(--bg-primary)', padding: '8px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <button onClick={handlePrevDay} style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', padding: '10px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <ChevronLeft size={22} />
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '200px' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: isToday ? '#f59e0b' : 'var(--text-primary)' }}>
                            {isToday ? 'Today' : formatLongDate(selectedDate).split(',')[0]}
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            <div style={{ position: 'relative', width: '20px', height: '20px' }}>
                                <button style={{ position: 'absolute', inset: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CalendarIcon size={14} /></button>
                                <input type="date" value={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`} onChange={handleDatePick} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                            </div>
                        </div>
                        <div style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '3px 10px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700, marginTop: '6px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Day {dayOfYear} of {selectedDate.getFullYear()}
                        </div>
                    </div>
                    <button onClick={handleNextDay} style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', padding: '10px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <ChevronRight size={22} />
                    </button>
                </div>
            </div>

            {/* ── Family + Celebrations panels ─────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>

                {/* Family Events */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Gift size={18} style={{ color: '#22c55e' }} /> Family Events
                    </h2>
                    {isLoadingFamily ? (
                        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Scanning family archives...</div>
                    ) : (filteredBirthdays.length === 0 && filteredDeathdays.length === 0) ? (
                        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>None found for this date.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {filteredBirthdays.map((b, i) => (
                                <div key={`b-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', backgroundColor: 'var(--bg-primary)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                    {b.family_image_url ? (
                                        <img src={b.family_image_url} alt={b.family_first_name} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)', flexShrink: 0 }} />
                                    ) : (
                                        <div style={{ backgroundColor: b.isDeceased ? 'rgba(107,114,128,0.1)' : 'rgba(34,197,94,0.1)', color: b.isDeceased ? '#6b7280' : '#22c55e', padding: '8px', borderRadius: '50%', flexShrink: 0 }}>
                                            <Gift size={18} />
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{b.family_first_name} {b.family_last_name}</div>
                                        {b.isDeceased
                                            ? <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Would have been <strong>{b.wouldBeAge}</strong>, passed {new Date(b.deathDateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.</div>
                                            : <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Turning <strong>{b.age}</strong> years old! 🎂</div>
                                        }
                                    </div>
                                </div>
                            ))}
                            {filteredDeathdays.map((d, i) => (
                                <div key={`d-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', backgroundColor: 'var(--bg-primary)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                    {d.family_image_url ? (
                                        <img src={d.family_image_url} alt={d.family_first_name} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(239,68,68,0.4)', flexShrink: 0 }} />
                                    ) : (
                                        <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '8px', borderRadius: '50%', flexShrink: 0 }}><HeartCrack size={18} /></div>
                                    )}
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{d.family_first_name} {d.family_last_name} — Passed Away</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{d.finalAge !== null ? `Passed away at ${d.finalAge} years old.` : 'Passed away on this day.'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Celebrations */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PartyPopper size={18} style={{ color: '#a855f7' }} /> Celebrations
                    </h2>
                    {isLoadingCelebrations ? (
                        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Loading celebrations...</div>
                    ) : filteredCelebrations.length === 0 ? (
                        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No celebrations on this date.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {filteredCelebrations.map(cel => (
                                <div key={cel.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', backgroundColor: 'var(--bg-primary)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ backgroundColor: 'rgba(168,85,247,0.1)', color: '#a855f7', padding: '8px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px' }}>
                                        {cel.icon ? <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{cel.icon}</span> : <PartyPopper size={18} />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{cel.name}</div>
                                        {cel.description && <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{cel.description}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Quote modal ──────────────────────────────────── */}
            {isFormOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
                    <div style={{ backgroundColor: 'var(--bg-primary)', padding: '36px', borderRadius: '24px', width: '100%', maxWidth: '560px', border: '1px solid var(--border-color)', boxShadow: '0 30px 60px rgba(0,0,0,0.4)', margin: '0 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{editingQuote ? 'Edit Quote' : 'Add a Quote'}</h2>
                            <button onClick={closeForm} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div>
                                <label style={labelStyle}>Quote *</label>
                                <textarea style={{ ...inputStyle, minHeight: '110px' }} value={formData.quote} onChange={e => setFormData(p => ({ ...p, quote: e.target.value }))} required placeholder="Enter the quote..." />
                            </div>
                            <div>
                                <label style={labelStyle}>Attribution</label>
                                <input style={inputStyle} value={formData.attribution} onChange={e => setFormData(p => ({ ...p, attribution: e.target.value }))} placeholder="Who said it? (optional)" />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={closeForm} style={{ padding: '10px 20px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                                <button type="submit" disabled={isSaving} style={{ padding: '10px 20px', backgroundColor: '#f59e0b', color: '#000', border: 'none', borderRadius: '10px', cursor: isSaving ? 'wait' : 'pointer', fontWeight: 700, opacity: isSaving ? 0.7 : 1 }}>
                                    {isSaving ? 'Saving...' : (editingQuote ? 'Update' : 'Save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
