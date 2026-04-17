import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sun, Clock, Gift, HeartCrack, PartyPopper, Plus, X, Trash2, Edit2 } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { RRule } from 'rrule';

const KarmaToday = () => {
    const { user } = useUser();
    const isAdmin = user?.publicMetadata?.role === 'admin';

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [familyMembers, setFamilyMembers] = useState([]);
    const [isLoadingFamily, setIsLoadingFamily] = useState(true);
    const [celebrations, setCelebrations] = useState([]);
    const [isLoadingCelebrations, setIsLoadingCelebrations] = useState(true);
    const [isCelebrationFormOpen, setIsCelebrationFormOpen] = useState(false);
    const [isSavingCelebration, setIsSavingCelebration] = useState(false);
    const [editingCelebrationId, setEditingCelebrationId] = useState(null);
    const [celebrationForm, setCelebrationForm] = useState({
        name: '',
        description: '',
        is_dynamic: false,
        fixed_month: '',
        fixed_day: '',
        rrule_string: '',
        icon: ''
    });

    const dateInputRef = useRef(null);
    const currentDate = new Date();

    useEffect(() => {
        fetch('/api/family-members')
            .then(res => res.json())
            .then(data => { setFamilyMembers(data || []); setIsLoadingFamily(false); })
            .catch(err => { console.error("Failed to load family members", err); setIsLoadingFamily(false); });
    }, []);

    useEffect(() => {
        fetch('/api/celebrations')
            .then(res => res.json())
            .then(data => { setCelebrations(data || []); setIsLoadingCelebrations(false); })
            .catch(err => { console.error("Failed to load celebrations", err); setIsLoadingCelebrations(false); });
    }, []);

    const getDayOfYear = (date) => {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = (date - start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
        return Math.floor(diff / 1000 / 60 / 60 / 24);
    };

    const handlePrevDay = () => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 1);
        setSelectedDate(prev);
    };

    const handleNextDay = () => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);
        setSelectedDate(next);
    };

    const handleDatePick = (e) => {
        const val = e.target.value;
        if (!val) return;
        const [year, month, day] = val.split('-');
        if (year && month && day) setSelectedDate(new Date(year, month - 1, day));
    };

    const formatLongDate = (date) =>
        date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const getAge = (birthStr, targetStr) => {
        if (!birthStr || !targetStr) return null;
        const [bY, bM, bD] = birthStr.split('T')[0].split('-').map(Number);
        const [tY, tM, tD] = targetStr.split('T')[0].split('-').map(Number);
        let age = tY - bY;
        if (tM < bM || (tM === bM && tD < bD)) age--;
        return age;
    };

    // ── Date matching ──────────────────────────────────────────────
    const dayOfYear = getDayOfYear(selectedDate);
    const isToday = selectedDate.toDateString() === currentDate.toDateString();
    const selectedMonth = selectedDate.getMonth() + 1;
    const selectedDay = selectedDate.getDate();
    const selectedYear = selectedDate.getFullYear();

    // Family filter
    const filteredBirthdays = [];
    const filteredDeathdays = [];
    familyMembers.forEach(member => {
        if (member.family_birthday) {
            const [bY, bM, bD] = member.family_birthday.split('T')[0].split('-').map(Number);
            if (bM === selectedMonth && bD === selectedDay) {
                if (member.family_deathday) {
                    filteredBirthdays.push({ ...member, isDeceased: true, wouldBeAge: selectedYear - bY, deathDateStr: member.family_deathday.split('T')[0] });
                } else {
                    filteredBirthdays.push({ ...member, isDeceased: false, age: selectedYear - bY });
                }
            }
        }
        if (member.family_deathday) {
            const [dY, dM, dD] = member.family_deathday.split('T')[0].split('-').map(Number);
            if (dM === selectedMonth && dD === selectedDay) {
                filteredDeathdays.push({ ...member, finalAge: getAge(member.family_birthday, member.family_deathday) });
            }
        }
    });

    // Celebrations filter using RRule
    const filteredCelebrations = celebrations.filter(cel => {
        if (!cel.is_dynamic) {
            return cel.fixed_month === selectedMonth && cel.fixed_day === selectedDay;
        }
        // Dynamic: generate occurrences around selectedDate and check if any match
        try {
            const rule = RRule.fromString(cel.rrule_string);
            const rangeStart = new Date(selectedDate);
            rangeStart.setHours(0, 0, 0, 0);
            const rangeEnd = new Date(selectedDate);
            rangeEnd.setHours(23, 59, 59, 999);
            const occurrences = rule.between(rangeStart, rangeEnd, true);
            return occurrences.length > 0;
        } catch (e) {
            return false;
        }
    });

    const openAddCelebration = () => {
        setEditingCelebrationId(null);
        setCelebrationForm({ name: '', description: '', is_dynamic: false, fixed_month: '', fixed_day: '', rrule_string: '', icon: '' });
        setIsCelebrationFormOpen(true);
    };

    const openEditCelebration = (cel) => {
        setEditingCelebrationId(cel.id);
        setCelebrationForm({
            name: cel.name || '',
            description: cel.description || '',
            is_dynamic: cel.is_dynamic || false,
            fixed_month: cel.fixed_month || '',
            fixed_day: cel.fixed_day || '',
            rrule_string: cel.rrule_string || '',
            icon: cel.icon || ''
        });
        setIsCelebrationFormOpen(true);
    };

    // ── Save new celebration ──────────────────────────────────────
    const handleSaveCelebration = async (e) => {
        e.preventDefault();
        setIsSavingCelebration(true);
        try {
            const method = editingCelebrationId ? 'PUT' : 'POST';
            const payload = {
                ...(editingCelebrationId ? { id: editingCelebrationId } : {}),
                name: celebrationForm.name,
                description: celebrationForm.description || null,
                is_dynamic: celebrationForm.is_dynamic,
                fixed_month: !celebrationForm.is_dynamic ? (parseInt(celebrationForm.fixed_month) || null) : null,
                fixed_day: !celebrationForm.is_dynamic ? (parseInt(celebrationForm.fixed_day) || null) : null,
                rrule_string: celebrationForm.is_dynamic ? celebrationForm.rrule_string : null,
                icon: celebrationForm.icon || null
            };
            await fetch('/api/celebrations', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const updated = await fetch('/api/celebrations').then(r => r.json());
            setCelebrations(updated || []);
            setIsCelebrationFormOpen(false);
            setEditingCelebrationId(null);
            setCelebrationForm({ name: '', description: '', is_dynamic: false, fixed_month: '', fixed_day: '', rrule_string: '', icon: '' });
        } catch (err) {
            console.error('Failed to save celebration', err);
        } finally {
            setIsSavingCelebration(false);
        }
    };

    const handleDeleteCelebration = async (id) => {
        if (!window.confirm('Remove this celebration?')) return;
        await fetch(`/api/celebrations?id=${id}`, { method: 'DELETE' });
        setCelebrations(prev => prev.filter(c => c.id !== id));
    };

    // ── Styles ────────────────────────────────────────────────────
    const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.875rem', color: 'var(--text-primary)', outline: 'none' };
    const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>

            {/* ── Header Component ──────────────────────────────────── */}
            <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '24px', padding: '32px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 16px rgba(245, 158, 11, 0.3)' }}>
                        <Sun size={40} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Today in Karma</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            <Clock size={16} />
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'var(--bg-primary)', padding: '8px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                    <button onClick={handlePrevDay} style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <ChevronLeft size={24} />
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '220px' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: isToday ? '#f59e0b' : 'var(--text-primary)' }}>
                            {isToday ? 'Today' : formatLongDate(selectedDate).split(',')[0]}
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            <div style={{ position: 'relative', width: '24px', height: '24px' }}>
                                <button style={{ position: 'absolute', inset: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CalendarIcon size={16} />
                                </button>
                                <input type="date" value={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`} onChange={handleDatePick} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                            </div>
                        </div>
                        <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, marginTop: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Day {dayOfYear} of {selectedDate.getFullYear()}
                        </div>
                    </div>

                    <button onClick={handleNextDay} style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>

            {/* ── Data Panels ───────────────────────────────────────── */}
            <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>

                {/* Family Events Panel */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 20px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Gift size={20} style={{ color: '#22c55e' }} /> Family Events
                    </h2>
                    {isLoadingFamily ? (
                        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Scanning family archives...</div>
                    ) : (filteredBirthdays.length === 0 && filteredDeathdays.length === 0) ? (
                        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>None found for this date.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {filteredBirthdays.map((b, i) => (
                                <div key={`b-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', backgroundColor: 'var(--bg-primary)', padding: '14px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ backgroundColor: b.isDeceased ? 'rgba(107,114,128,0.1)' : 'rgba(34,197,94,0.1)', color: b.isDeceased ? '#6b7280' : '#22c55e', padding: '10px', borderRadius: '50%', flexShrink: 0 }}>
                                        <Gift size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                                            {b.family_first_name} {b.family_nickname ? `"${b.family_nickname}"` : ''} {b.family_last_name}
                                        </div>
                                        {b.isDeceased ? (
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                                                Would have been <strong>{b.wouldBeAge}</strong> today, but sadly passed away on <strong>{new Date(b.deathDateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>.
                                            </div>
                                        ) : (
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                                Turning <strong>{b.age}</strong> years old! 🎂
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {filteredDeathdays.map((d, i) => (
                                <div key={`d-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', backgroundColor: 'var(--bg-primary)', padding: '14px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '10px', borderRadius: '50%', flexShrink: 0 }}>
                                        <HeartCrack size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                                            {d.family_first_name} {d.family_last_name} — Passed Away
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                            {d.finalAge !== null ? `Passed away at ${d.finalAge} years old.` : 'Passed away on this day.'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Celebrations Panel */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <PartyPopper size={20} style={{ color: '#a855f7' }} /> Celebrations
                        </h2>
                        {isAdmin && (
                            <button onClick={openAddCelebration} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                                <Plus size={14} /> Add Holiday
                            </button>
                        )}
                    </div>

                    {isLoadingCelebrations ? (
                        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Loading celebrations...</div>
                    ) : filteredCelebrations.length === 0 ? (
                        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No celebrations on this date.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {filteredCelebrations.map((cel) => (
                                <div key={cel.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', backgroundColor: 'var(--bg-primary)', padding: '14px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ backgroundColor: 'rgba(168,85,247,0.1)', color: '#a855f7', padding: '10px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px' }}>
                                        {cel.icon ? (
                                            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{cel.icon}</span>
                                        ) : (
                                            <PartyPopper size={20} />
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>{cel.name}</div>
                                        {cel.description && <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{cel.description}</div>}
                                    </div>
                                    {isAdmin && (
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button onClick={() => openEditCelebration(cel)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                                                <Edit2 size={15} />
                                            </button>
                                            <button onClick={() => handleDeleteCelebration(cel.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Days Old Panel ────────────────────────────────────── */}
            {(() => {
                const PRIMARY_NAMES = ['Marc', 'Alejandra', 'Isaac', 'Pax', 'Lyra'];
                const RETIREMENT_AGE = 65;
                const LIFE_EXPECTANCY = { M: 76, F: 81, default: 79 };

                const msPerDay = 1000 * 60 * 60 * 24;

                // Strip time component — chevron nav preserves original page-load time
                const today0 = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

                const getNextBirthday = (birthStr) => {
                    const [, bM, bD] = birthStr.split('T')[0].split('-').map(Number);
                    const next = new Date(today0.getFullYear(), bM - 1, bD);
                    if (next < today0) next.setFullYear(next.getFullYear() + 1);
                    return next;
                };

                const daysUntil = (targetDate) => {
                    const t = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
                    return Math.round((t - today0) / msPerDay);
                };

                const primaryMembers = familyMembers
                    .filter(m => PRIMARY_NAMES.includes(m.family_first_name))
                    .sort((a, b) => PRIMARY_NAMES.indexOf(a.family_first_name) - PRIMARY_NAMES.indexOf(b.family_first_name));

                const metrics = primaryMembers.map(m => {
                    if (!m.family_birthday) return { ...m, invalid: true };
                    const [bY, bM, bD] = m.family_birthday.split('T')[0].split('-').map(Number);
                    const birthday = new Date(bY, bM - 1, bD);
                    const daysOld = Math.floor((today0 - birthday) / msPerDay);
                    const ageNow = today0.getFullYear() - bY -
                        ((today0.getMonth() + 1 < bM || (today0.getMonth() + 1 === bM && today0.getDate() < bD)) ? 1 : 0);
                    const daysToNextBirthday = daysUntil(getNextBirthday(m.family_birthday));
                    const retirementDate = new Date(bY + RETIREMENT_AGE, bM - 1, bD);
                    const daysToRetirement = daysUntil(retirementDate);
                    const lifespan = LIFE_EXPECTANCY[m.family_sex] || LIFE_EXPECTANCY.default;
                    const deathDate = new Date(bY + lifespan, bM - 1, bD);
                    const daysToEstDeath = daysUntil(deathDate);
                    return { ...m, daysOld, daysToNextBirthday, daysToRetirement, daysToEstDeath, ageNow, lifespan };
                });

                const fmtDays = (n) => {
                    if (n < 0) return <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>Passed</span>;
                    if (n === 0) return <span style={{ color: '#22c55e', fontWeight: 700 }}>Today!</span>;
                    const y = Math.floor(n / 365), d = n % 365;
                    return y > 0 ? `${y}y ${d}d` : `${n}d`;
                };

                const th = { padding: '10px 16px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', textAlign: 'right', borderBottom: '2px solid var(--border-color)', whiteSpace: 'nowrap' };
                const td = { padding: '14px 16px', textAlign: 'right', fontSize: '0.875rem', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' };

                return (
                    <div style={{ marginTop: '24px', backgroundColor: 'var(--bg-secondary)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border-color)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 20px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                            ⏳ Days Old
                        </h2>
                        {isLoadingFamily ? (
                            <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Computing...</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '8px' }}>
                                            <th style={{ ...th, textAlign: 'left' }}>Name</th>
                                            <th style={th}>Age</th>
                                            <th style={th}>Days Old</th>
                                            <th style={th}>Next Birthday</th>
                                            <th style={th}>Retirement ({RETIREMENT_AGE})</th>
                                            <th style={th}>Est. Lifetime ✝</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {metrics.map((m, i) => m.invalid ? null : (
                                            <tr key={m.family_member_id} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)', transition: 'background 0.15s' }}>
                                                <td style={{ ...td, textAlign: 'left', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    {m.family_first_name}
                                                </td>
                                                <td style={{ ...td, color: 'var(--text-secondary)' }}>{m.ageNow}</td>
                                                <td style={{ ...td, color: 'var(--text-primary)', fontWeight: 600 }}>{m.daysOld.toLocaleString()}</td>
                                                <td style={{ ...td, color: m.daysToNextBirthday <= 7 ? '#f59e0b' : 'var(--text-secondary)', fontWeight: m.daysToNextBirthday <= 7 ? 700 : 400 }}>
                                                    {fmtDays(m.daysToNextBirthday)}
                                                </td>
                                                <td style={{ ...td, color: m.daysToRetirement < 0 ? '#22c55e' : 'var(--text-secondary)' }}>
                                                    {m.daysToRetirement < 0 ? '🎉 Retired!' : fmtDays(m.daysToRetirement)}
                                                </td>
                                                <td style={{ ...td, color: '#ef4444' }}>
                                                    {m.daysToEstDeath < 0
                                                        ? <span style={{ color: '#6b7280' }}>—</span>
                                                        : <>{fmtDays(m.daysToEstDeath)} <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>(~{m.lifespan}yr)</span></>
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div style={{ marginTop: '12px', fontSize: '0.72rem', color: 'var(--text-secondary)', textAlign: 'right', fontStyle: 'italic' }}>
                                    ✝ US CDC 2022 averages: ♂ 76 yrs · ♀ 81 yrs. Statistical estimates only.
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* ── Add Celebration Modal ─────────────────────────────── */}
            {isCelebrationFormOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ backgroundColor: 'var(--bg-primary)', padding: '32px', borderRadius: '20px', width: '100%', maxWidth: '520px', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{editingCelebrationId ? 'Edit Celebration' : 'Add Celebration'}</h2>
                            <button onClick={() => { setIsCelebrationFormOpen(false); setEditingCelebrationId(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCelebration} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div>
                                <label style={labelStyle}>Name *</label>
                                <input style={inputStyle} value={celebrationForm.name} onChange={e => setCelebrationForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. National Donut Day" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end' }}>
                                <div>
                                    <label style={labelStyle}>Description</label>
                                    <input style={inputStyle} value={celebrationForm.description} onChange={e => setCelebrationForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Icon (emoji)</label>
                                    <input
                                        style={{ ...inputStyle, width: '64px', textAlign: 'center', fontSize: '1.5rem', padding: '8px' }}
                                        value={celebrationForm.icon}
                                        onChange={e => setCelebrationForm(p => ({ ...p, icon: e.target.value }))}
                                        maxLength={2}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={celebrationForm.is_dynamic} onChange={e => setCelebrationForm(p => ({ ...p, is_dynamic: e.target.checked }))} />
                                    <span>Dynamic/Floating date (uses RRule)</span>
                                </label>
                            </div>

                            {!celebrationForm.is_dynamic ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={labelStyle}>Month (1–12) *</label>
                                        <input style={inputStyle} type="number" min="1" max="12" value={celebrationForm.fixed_month} onChange={e => setCelebrationForm(p => ({ ...p, fixed_month: e.target.value }))} required={!celebrationForm.is_dynamic} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Day (1–31) *</label>
                                        <input style={inputStyle} type="number" min="1" max="31" value={celebrationForm.fixed_day} onChange={e => setCelebrationForm(p => ({ ...p, fixed_day: e.target.value }))} required={!celebrationForm.is_dynamic} />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label style={labelStyle}>RRule String *</label>
                                    <input style={inputStyle} value={celebrationForm.rrule_string} onChange={e => setCelebrationForm(p => ({ ...p, rrule_string: e.target.value }))} required={celebrationForm.is_dynamic} placeholder="e.g. FREQ=YEARLY;BYMONTH=11;BYDAY=4TH" />
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                                        Examples: <br />
                                        Thanksgiving: <code>FREQ=YEARLY;BYMONTH=11;BYDAY=4TH</code><br />
                                        Mother's Day: <code>FREQ=YEARLY;BYMONTH=5;BYDAY=2SU</code>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                                <button type="button" onClick={() => { setIsCelebrationFormOpen(false); setEditingCelebrationId(null); }} style={{ padding: '10px 20px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSavingCelebration} style={{ padding: '10px 20px', backgroundColor: '#a855f7', color: 'white', border: 'none', borderRadius: '8px', cursor: isSavingCelebration ? 'wait' : 'pointer', fontWeight: 600, opacity: isSavingCelebration ? 0.7 : 1 }}>
                                    {isSavingCelebration ? 'Saving...' : (editingCelebrationId ? 'Update' : 'Save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default KarmaToday;
