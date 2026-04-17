import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sun, Clock, Gift, HeartCrack, PartyPopper } from 'lucide-react';
import { RRule } from 'rrule';

// Public read-only version — no admin controls, no Clerk dependency.
const CartwrightToday = () => {
    const isAdmin = false;

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [familyMembers, setFamilyMembers] = useState([]);
    const [isLoadingFamily, setIsLoadingFamily] = useState(true);
    const [celebrations, setCelebrations] = useState([]);
    const [isLoadingCelebrations, setIsLoadingCelebrations] = useState(true);

    const currentDate = new Date();

    useEffect(() => {
        fetch('/api/family-members')
            .then(res => res.json())
            .then(data => { setFamilyMembers(data || []); setIsLoadingFamily(false); })
            .catch(() => setIsLoadingFamily(false));
    }, []);

    useEffect(() => {
        fetch('/api/celebrations')
            .then(res => res.json())
            .then(data => { setCelebrations(data || []); setIsLoadingCelebrations(false); })
            .catch(() => setIsLoadingCelebrations(false));
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

    const dayOfYear = getDayOfYear(selectedDate);
    const isToday = selectedDate.toDateString() === currentDate.toDateString();
    const selectedMonth = selectedDate.getMonth() + 1;
    const selectedDay = selectedDate.getDate();
    const selectedYear = selectedDate.getFullYear();

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

    const filteredCelebrations = celebrations.filter(cel => {
        if (!cel.is_dynamic) return cel.fixed_month === selectedMonth && cel.fixed_day === selectedDay;
        try {
            const rule = RRule.fromString(cel.rrule_string);
            const rangeStart = new Date(selectedDate); rangeStart.setHours(0, 0, 0, 0);
            const rangeEnd = new Date(selectedDate); rangeEnd.setHours(23, 59, 59, 999);
            return rule.between(rangeStart, rangeEnd, true).length > 0;
        } catch (e) { return false; }
    });

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>

            {/* Header */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '24px', padding: '32px', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 16px rgba(245, 158, 11, 0.3)' }}>
                        <Sun size={40} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Today in Karma</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            <Clock size={16} />
                            <span>Current Local Date: <strong>{formatLongDate(currentDate)}</strong></span>
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

            {/* Data Panels */}
            <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>

                {/* Family Events */}
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

                {/* Celebrations — read-only, no admin controls */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 20px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <PartyPopper size={20} style={{ color: '#a855f7' }} /> Celebrations
                    </h2>
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
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>{cel.name}</div>
                                        {cel.description && <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{cel.description}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CartwrightToday;
