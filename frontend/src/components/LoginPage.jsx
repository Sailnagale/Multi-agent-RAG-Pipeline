import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  ArrowLeft, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  Eye,
  EyeOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import authSounds from '../utils/authSounds';
import { authenticateUser, registerAccount, getDemoUser } from '../utils/authService';

export default function LoginPage({ onLogin, onBack }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [soundOn, setSoundOn] = useState(() => authSounds.isEnabled());

  // States: 'idle' | 'watching' | 'covering' | 'sad' | 'celebrating'
  const [charState, setCharState] = useState('idle');
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lookAngle, setLookAngle] = useState(0);

  const toggleAudio = () => {
    const next = authSounds.toggleSound();
    setSoundOn(next);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setLoginError('');
    if (charState !== 'covering' && charState !== 'celebrating') {
      setCharState('watching');
      // Gaze towards the right (where the form is located)
      const offset = Math.min(Math.max((e.target.value.length - 10) * 0.35, 1), 5);
      setLookAngle(offset);
    }
  };

  const handlePasswordFocus = () => {
    setLoginError('');
    setCharState('covering');
    authSounds.playWhoosh();
  };

  const handlePasswordBlur = () => {
    if (charState === 'covering') {
      setCharState('idle');
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setLoginError('');
    authSounds.playKeypop();
    if (charState !== 'celebrating') {
      setCharState('covering');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError('');

    setTimeout(() => {
      if (isSignUp) {
        const res = registerAccount({ name, email, organization, password });
        setIsSubmitting(false);
        if (!res.success) {
          authSounds.playSad();
          setCharState('sad');
          setLoginError(res.error);
          return;
        }

        authSounds.playSuccess();
        setCharState('celebrating');
        setLoginSuccess(true);
        setTimeout(() => {
          onLogin(res.user);
        }, 1400);
      } else {
        const res = authenticateUser(email, password);
        setIsSubmitting(false);
        if (!res.success) {
          authSounds.playSad();
          setCharState('sad');
          setLoginError(res.error);
          return;
        }

        authSounds.playSuccess();
        setCharState('celebrating');
        setLoginSuccess(true);
        setTimeout(() => {
          onLogin(res.user);
        }, 1400);
      }
    }, 450);
  };

  const handleDemoLogin = () => {
    setEmail('admin@apex-capital.com');
    setPassword('admin123');
    setLoginError('');
    setCharState('celebrating');
    setLoginSuccess(true);
    authSounds.playSuccess();
    const demo = getDemoUser();
    setTimeout(() => {
      onLogin(demo);
    }, 1200);
  };

  const isCovering = charState === 'covering';
  const isSad = charState === 'sad';
  const isCelebrating = charState === 'celebrating';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes squadCheer {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-22px) rotate(3deg); }
        }
        @keyframes squadCheerAlt {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-26px) rotate(-4deg); }
        }
        @keyframes squadSad {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px) rotate(-3deg); }
          75% { transform: translateX(5px) rotate(3deg); }
        }
        @keyframes tearStream {
          0% { transform: translateY(0) scaleY(0.5); opacity: 0; }
          40% { opacity: 1; transform: translateY(8px) scaleY(1.2); }
          100% { transform: translateY(24px) scaleY(0.8); opacity: 0; }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(120px) rotate(360deg); opacity: 0; }
        }
        @keyframes tailWagFast {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(32deg); }
        }
        .anim-cheer-1 { animation: squadCheer 0.48s ease-in-out infinite; }
        .anim-cheer-2 { animation: squadCheerAlt 0.52s ease-in-out infinite; }
        .anim-sad-squad { animation: squadSad 0.6s ease-in-out infinite; }
        .tear-fall { animation: tearStream 1.1s infinite; }
        .cat-tail-anim { animation: tailWagFast 0.8s ease-in-out infinite; transform-origin: bottom center; }
      `}</style>

      {/* Floating Confetti Particle FX on Successful Login */}
      {isCelebrating && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50 }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                top: `${(i * 4) % 40}%`,
                left: `${(i * 7) % 95}%`,
                fontSize: `${16 + (i % 3) * 6}px`,
                animation: `confettiFall ${0.8 + (i % 5) * 0.2}s ${i * 0.08}s infinite`
              }}
            >
              {['🎉', '⭐', '🎊', '✨', '🎈', '🍌', '🐾'][i % 7]}
            </span>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* LEFT HALF: THE ANIMATED MINIONS & CATS THEATER */}
      {/* ======================================================== */}
      <div style={{
        flex: '1.15',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '2.5rem',
        background: isCelebrating
          ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(245, 158, 11, 0.04) 100%)'
          : isSad
          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(30, 58, 138, 0.08) 100%)'
          : 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)',
        borderRight: '1px solid var(--border-subtle)',
        position: 'relative'
      }}>
        {/* Top Back / Logo bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, flexWrap: 'wrap', gap: '0.75rem' }}>
          <button
            onClick={onBack}
            className="btn btn-secondary"
            style={{
              padding: '0.5rem 0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem'
            }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {/* Audio Toggle Button */}
            <button
              type="button"
              onClick={toggleAudio}
              title={soundOn ? 'Mute authentication sounds' : 'Unmute authentication sounds'}
              style={{
                background: soundOn ? 'rgba(59, 130, 246, 0.16)' : 'rgba(255, 255, 255, 0.08)',
                border: `1px solid ${soundOn ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                color: soundOn ? 'var(--accent-blue)' : 'var(--text-muted)',
                borderRadius: '20px',
                padding: '0.35rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
            >
              {soundOn ? <Volume2 size={15} color="var(--accent-blue)" /> : <VolumeX size={15} />}
              <span>{soundOn ? 'Sound On' : 'Sound Muted'}</span>
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              background: isCelebrating ? '#10b981' : isSad ? '#ef4444' : isCovering ? '#f59e0b' : 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.78rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease'
            }}>
              {isCelebrating 
                ? '🥳 SQUAD CELEBRATING' 
                : isSad 
                ? '😢 SQUAD CRYING' 
                : isCovering 
                ? '🙈 COVERING EYES & LOOKING AWAY LEFT' 
                : '👀 SQUAD WATCHING YOU'}
            </div>
          </div>
        </div>

        {/* Center Stage Presentation Header */}
        <div style={{ textAlign: 'center', margin: '1rem 0', zIndex: 10 }}>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            {isCovering 
              ? '🙈 "We are NOT looking! Looking away to the left!"' 
              : isCelebrating 
              ? '🎉 "Bello! Banana! Password Verified!"' 
              : isSad 
              ? '😿 "Waaah! Wrong Password! Broken hearts!"' 
              : 'The FinRAG Minion & Feline Guard Squad'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto' }}>
            {isCovering 
              ? 'Characters on the squad are covering their goggles or turning away left to protect your credentials.' 
              : isCelebrating 
              ? 'All 4 Minions and 3 Cats are dancing and celebrating your authenticated entry!' 
              : isSad 
              ? 'Uh oh! The characters are crying real tears. Double-check your password on the right!' 
              : 'Type your password on the right and watch the Minions & Cats react in real-time.'}
          </p>
        </div>

        {/* ======================================================== */}
        {/* CHARACTER SQUAD ARENA: 4 MINIONS + 3 CATS (7 TOTAL) */}
        {/* ======================================================== */}
        <div style={{
          position: 'relative',
          height: '280px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '24px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: '14px',
          padding: '0 1rem 12px',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}>
          {/* Ground Floor Shadow Line */}
          <div style={{
            position: 'absolute',
            bottom: '6px',
            left: '3%',
            right: '3%',
            height: '14px',
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 75%)',
            borderRadius: '50%'
          }} />

          {/* ──────────────────────────────────────────────────────── */}
          {/* 1. CAT #1: SLEEK TUXEDO CAT (Looks away far left on password) */}
          {/* ──────────────────────────────────────────────────────── */}
          <div className={isCelebrating ? 'anim-cheer-1' : isSad ? 'anim-sad-squad' : ''} style={{
            position: 'relative',
            width: '68px',
            height: '100px',
            transition: 'transform 0.35s ease',
            // LOOKS AWAY TO THE LEFT!
            transform: isCovering ? 'rotate(-25deg) translateX(-12px)' : 'none',
            zIndex: 3
          }}>
            {/* Ears */}
            <div style={{ position: 'absolute', top: '2px', left: '8px', width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '18px solid #0f172a' }}>
              <div style={{ position: 'absolute', top: '5px', left: '-5px', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '10px solid #f472b6' }} />
            </div>
            <div style={{ position: 'absolute', top: '2px', right: '8px', width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '18px solid #0f172a' }}>
              <div style={{ position: 'absolute', top: '5px', left: '-5px', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '10px solid #f472b6' }} />
            </div>

            {/* Cat Body */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '4px',
              right: '4px',
              height: '82px',
              background: '#1e293b',
              borderRadius: '30px 30px 14px 14px',
              overflow: 'hidden',
              boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.4)'
            }}>
              {/* White Tuxedo Chest */}
              <div style={{ position: 'absolute', bottom: 0, left: '14px', right: '14px', height: '42px', background: '#f8fafc', borderRadius: '18px 18px 6px 6px' }} />

              {/* Eyes */}
              {!isCovering && (
                <div style={{ position: 'absolute', top: '20px', left: '10px', right: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ width: '13px', height: isSad ? '4px' : '12px', background: isSad ? '#0f172a' : '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!isSad && <div style={{ width: '6px', height: '6px', background: '#0f172a', borderRadius: '50%', transform: `translateX(${lookAngle}px)` }} />}
                  </div>
                  <div style={{ width: '13px', height: isSad ? '4px' : '12px', background: isSad ? '#0f172a' : '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!isSad && <div style={{ width: '6px', height: '6px', background: '#0f172a', borderRadius: '50%', transform: `translateX(${lookAngle}px)` }} />}
                  </div>
                </div>
              )}

              {/* Nose */}
              <div style={{ position: 'absolute', top: '36px', left: '50%', transform: 'translateX(-50%)', width: '6px', height: '4px', background: '#f472b6', borderRadius: '50%' }} />

              {/* Tears */}
              {isSad && (
                <>
                  <div className="tear-fall" style={{ position: 'absolute', top: '26px', left: '12px', width: '3px', height: '7px', background: '#60a5fa', borderRadius: '50%' }} />
                  <div className="tear-fall" style={{ position: 'absolute', top: '26px', right: '12px', width: '3px', height: '7px', background: '#60a5fa', borderRadius: '50%' }} />
                </>
              )}
            </div>

            {/* Paws */}
            <div style={{
              position: 'absolute',
              top: isCovering ? '26px' : isCelebrating ? '16px' : '68px',
              left: '8px',
              width: '15px',
              height: '15px',
              background: '#f8fafc',
              borderRadius: '50%',
              border: '2px solid #1e293b',
              transition: 'all 0.25s',
              zIndex: 5
            }} />
            <div style={{
              position: 'absolute',
              top: isCovering ? '26px' : isCelebrating ? '16px' : '68px',
              right: '8px',
              width: '15px',
              height: '15px',
              background: '#f8fafc',
              borderRadius: '50%',
              border: '2px solid #1e293b',
              transition: 'all 0.25s',
              zIndex: 5
            }} />

            {/* Tail */}
            <div className="cat-tail-anim" style={{ position: 'absolute', bottom: '6px', left: '-8px', width: '8px', height: '32px', background: '#0f172a', borderRadius: '6px' }} />
          </div>

          {/* ──────────────────────────────────────────────────────── */}
          {/* 2. MINION #1: KEVIN (Tall Two-Eyed, covers eyes with black gloves) */}
          {/* ──────────────────────────────────────────────────────── */}
          <div className={isCelebrating ? 'anim-cheer-2' : isSad ? 'anim-sad-squad' : ''} style={{
            position: 'relative',
            width: '74px',
            height: '142px',
            transition: 'transform 0.3s ease',
            zIndex: 4
          }}>
            {/* Sprouts Hair */}
            <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '3px' }}>
              <div style={{ width: '2px', height: '11px', background: '#1e293b', transform: 'rotate(-15deg)' }} />
              <div style={{ width: '2px', height: '14px', background: '#1e293b' }} />
              <div style={{ width: '2px', height: '11px', background: '#1e293b', transform: 'rotate(15deg)' }} />
            </div>

            {/* Body */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '4px',
              right: '4px',
              bottom: 0,
              background: '#facc15',
              borderRadius: '34px 34px 14px 14px',
              boxShadow: 'inset -4px -4px 8px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}>
              {/* Strap */}
              <div style={{ position: 'absolute', top: '24px', left: 0, right: 0, height: '9px', background: '#1e293b' }} />

              {/* Double Goggles */}
              <div style={{ position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '3px' }}>
                {[0, 1].map((idx) => (
                  <div key={idx} style={{
                    width: '28px',
                    height: '28px',
                    background: '#94a3b8',
                    borderRadius: '50%',
                    border: '3px solid #64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '8px', height: '8px', background: '#78350f', borderRadius: '50%', transform: isSad ? 'translateY(2px)' : `translateX(${lookAngle}px)` }}>
                        <div style={{ width: '4px', height: '4px', background: '#000', borderRadius: '50%', margin: '2px auto' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mouth */}
              <div style={{
                position: 'absolute',
                top: '48px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: isCelebrating ? '20px' : '14px',
                height: isCelebrating ? '10px' : isSad ? '4px' : '6px',
                background: isCelebrating ? '#991b1b' : 'transparent',
                borderBottom: isCelebrating ? 'none' : isSad ? 'none' : '3px solid #78350f',
                borderTop: isSad ? '3px solid #78350f' : 'none',
                borderRadius: isCelebrating ? '0 0 14px 14px' : '50%'
              }} />

              {/* Dungarees */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '54px', background: '#2563eb' }}>
                <div style={{ position: 'absolute', top: '-14px', left: '3px', width: '9px', height: '22px', background: '#1d4ed8', transform: 'rotate(-20deg)' }} />
                <div style={{ position: 'absolute', top: '-14px', right: '3px', width: '9px', height: '22px', background: '#1d4ed8', transform: 'rotate(20deg)' }} />
                <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', width: '20px', height: '18px', background: '#1e40af', borderRadius: '3px 3px 8px 8px', color: '#fff', fontSize: '10px', fontWeight: 900, textAlign: 'center' }}>G</div>
              </div>

              {/* Tears */}
              {isSad && (
                <>
                  <div className="tear-fall" style={{ position: 'absolute', top: '38px', left: '22px', width: '4px', height: '9px', background: '#60a5fa', borderRadius: '50%' }} />
                  <div className="tear-fall" style={{ position: 'absolute', top: '38px', right: '22px', width: '4px', height: '9px', background: '#60a5fa', borderRadius: '50%' }} />
                </>
              )}
            </div>

            {/* Hands Covering Eyes */}
            <div style={{
              position: 'absolute',
              top: isCovering ? '26px' : isCelebrating ? '10px' : '70px',
              left: isCovering ? '20px' : '-2px',
              width: '18px',
              height: '18px',
              background: '#0f172a',
              borderRadius: '50%',
              zIndex: 10,
              boxShadow: '0 3px 6px rgba(0,0,0,0.3)',
              transition: 'all 0.25s',
              transform: isCovering ? 'scale(1.3) rotate(15deg)' : isCelebrating ? 'translateY(-10px)' : 'none'
            }} />
            <div style={{
              position: 'absolute',
              top: isCovering ? '26px' : isCelebrating ? '10px' : '70px',
              right: isCovering ? '20px' : '-2px',
              width: '18px',
              height: '18px',
              background: '#0f172a',
              borderRadius: '50%',
              zIndex: 10,
              boxShadow: '0 3px 6px rgba(0,0,0,0.3)',
              transition: 'all 0.25s',
              transform: isCovering ? 'scale(1.3) rotate(-15deg)' : isCelebrating ? 'translateY(-10px)' : 'none'
            }} />
          </div>

          {/* ──────────────────────────────────────────────────────── */}
          {/* 3. CAT #2: WHITE FLUFFY PERSIAN CAT (Covers eyes with white paws) */}
          {/* ──────────────────────────────────────────────────────── */}
          <div className={isCelebrating ? 'anim-cheer-1' : isSad ? 'anim-sad-squad' : ''} style={{
            position: 'relative',
            width: '64px',
            height: '92px',
            zIndex: 3
          }}>
            {/* White Ears */}
            <div style={{ position: 'absolute', top: '4px', left: '6px', width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderBottom: '16px solid #e2e8f0' }}>
              <div style={{ position: 'absolute', top: '4px', left: '-5px', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '9px solid #fecdd3' }} />
            </div>
            <div style={{ position: 'absolute', top: '4px', right: '6px', width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderBottom: '16px solid #e2e8f0' }}>
              <div style={{ position: 'absolute', top: '4px', left: '-5px', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '9px solid #fecdd3' }} />
            </div>

            {/* Fluffy Body */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '4px',
              right: '4px',
              height: '74px',
              background: '#f8fafc',
              borderRadius: '26px 26px 14px 14px',
              border: '1px solid #cbd5e1',
              overflow: 'hidden'
            }}>
              {/* Blue Eyes */}
              {!isCovering && (
                <div style={{ position: 'absolute', top: '18px', left: '9px', right: '9px', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ width: '12px', height: isSad ? '4px' : '11px', background: isSad ? '#0f172a' : '#0284c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!isSad && <div style={{ width: '5px', height: '5px', background: '#0f172a', borderRadius: '50%', transform: `translateX(${lookAngle}px)` }} />}
                  </div>
                  <div style={{ width: '12px', height: isSad ? '4px' : '11px', background: isSad ? '#0f172a' : '#0284c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!isSad && <div style={{ width: '5px', height: '5px', background: '#0f172a', borderRadius: '50%', transform: `translateX(${lookAngle}px)` }} />}
                  </div>
                </div>
              )}

              {/* Nose & Mouth */}
              <div style={{ position: 'absolute', top: '32px', left: '50%', transform: 'translateX(-50%)', width: '6px', height: '4px', background: '#f43f5e', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', top: '37px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', color: '#64748b', fontWeight: 800 }}>
                {isCelebrating ? '∇' : isSad ? '﹏' : '3'}
              </div>

              {/* Tears */}
              {isSad && (
                <div className="tear-fall" style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '8px', background: '#60a5fa', borderRadius: '50%' }} />
              )}
            </div>

            {/* Paws */}
            <div style={{
              position: 'absolute',
              top: isCovering ? '22px' : isCelebrating ? '12px' : '58px',
              left: '9px',
              width: '14px',
              height: '14px',
              background: '#f1f5f9',
              borderRadius: '50%',
              border: '2px solid #cbd5e1',
              transition: 'all 0.25s',
              transform: isCovering ? 'scale(1.2)' : 'none',
              zIndex: 5
            }} />
            <div style={{
              position: 'absolute',
              top: isCovering ? '22px' : isCelebrating ? '12px' : '58px',
              right: '9px',
              width: '14px',
              height: '14px',
              background: '#f1f5f9',
              borderRadius: '50%',
              border: '2px solid #cbd5e1',
              transition: 'all 0.25s',
              transform: isCovering ? 'scale(1.2)' : 'none',
              zIndex: 5
            }} />

            {/* Tail */}
            <div className="cat-tail-anim" style={{ position: 'absolute', bottom: '4px', left: '-6px', width: '8px', height: '26px', background: '#e2e8f0', borderRadius: '6px' }} />
          </div>

          {/* ──────────────────────────────────────────────────────── */}
          {/* 4. MINION #2: STUART (One-Eyed, looks away to the left!) */}
          {/* ──────────────────────────────────────────────────────── */}
          <div className={isCelebrating ? 'anim-cheer-1' : isSad ? 'anim-sad-squad' : ''} style={{
            position: 'relative',
            width: '68px',
            height: '124px',
            transition: 'transform 0.3s ease',
            // LOOKS AWAY TO THE LEFT ON PASSWORD!
            transform: isCovering ? 'rotate(-18deg) translateX(-10px)' : 'none',
            zIndex: 4
          }}>
            {/* Combed Hair */}
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '18px', height: '6px', borderTop: '3px solid #1e293b', borderRadius: '50%' }} />

            {/* Body */}
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '4px',
              right: '4px',
              bottom: 0,
              background: '#facc15',
              borderRadius: '30px 30px 12px 12px',
              boxShadow: 'inset -3px -3px 6px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}>
              {/* Strap */}
              <div style={{ position: 'absolute', top: '22px', left: 0, right: 0, height: '8px', background: '#1e293b' }} />

              {/* Single Cyclops Goggle */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '32px',
                height: '32px',
                background: '#94a3b8',
                borderRadius: '50%',
                border: '3px solid #64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '10px', height: '10px', background: '#78350f', borderRadius: '50%', transform: isCovering ? 'translateX(-4px)' : isSad ? 'translateY(2px)' : `translateX(${lookAngle}px)` }}>
                    <div style={{ width: '5px', height: '5px', background: '#000', borderRadius: '50%', margin: '2.5px auto' }} />
                  </div>
                </div>
              </div>

              {/* Mouth */}
              <div style={{
                position: 'absolute',
                top: '50px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: isCelebrating ? '18px' : '12px',
                height: isCelebrating ? '9px' : isSad ? '3px' : '5px',
                background: isCelebrating ? '#991b1b' : 'transparent',
                borderBottom: isCelebrating ? 'none' : isSad ? 'none' : '3px solid #78350f',
                borderTop: isSad ? '3px solid #78350f' : 'none',
                borderRadius: isCelebrating ? '0 0 12px 12px' : '50%'
              }} />

              {/* Dungarees */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '46px', background: '#2563eb' }}>
                <div style={{ position: 'absolute', top: '-12px', left: '3px', width: '8px', height: '18px', background: '#1d4ed8', transform: 'rotate(-20deg)' }} />
                <div style={{ position: 'absolute', top: '-12px', right: '3px', width: '8px', height: '18px', background: '#1d4ed8', transform: 'rotate(20deg)' }} />
              </div>

              {/* Tears */}
              {isSad && (
                <div className="tear-fall" style={{ position: 'absolute', top: '42px', left: '50%', transform: 'translateX(-50%)', width: '5px', height: '10px', background: '#60a5fa', borderRadius: '50%' }} />
              )}
            </div>

            {/* Hands Pointing Away Left when Covering */}
            <div style={{
              position: 'absolute',
              top: isCovering ? '38px' : isCelebrating ? '8px' : '62px',
              left: isCovering ? '-8px' : '-2px',
              width: '16px',
              height: '16px',
              background: '#0f172a',
              borderRadius: '50%',
              zIndex: 10,
              transition: 'all 0.25s',
              transform: isCovering ? 'translateX(-8px) scale(1.2)' : 'none'
            }} />
            <div style={{
              position: 'absolute',
              top: isCovering ? '38px' : isCelebrating ? '8px' : '62px',
              right: isCovering ? '26px' : '-2px',
              width: '16px',
              height: '16px',
              background: '#0f172a',
              borderRadius: '50%',
              zIndex: 10,
              transition: 'all 0.25s',
              transform: isCovering ? 'translateX(-12px)' : 'none'
            }} />
          </div>

          {/* ──────────────────────────────────────────────────────── */}
          {/* 5. MINION #3: BOB (Short Round Cute Minion with Teddy) */}
          {/* ──────────────────────────────────────────────────────── */}
          <div className={isCelebrating ? 'anim-cheer-2' : isSad ? 'anim-sad-squad' : ''} style={{
            position: 'relative',
            width: '64px',
            height: '108px',
            transition: 'transform 0.3s ease',
            zIndex: 4
          }}>
            {/* Bald Round Head */}
            <div style={{
              position: 'absolute',
              top: '6px',
              left: '2px',
              right: '2px',
              bottom: 0,
              background: '#facc15',
              borderRadius: '30px 30px 14px 14px',
              boxShadow: 'inset -3px -3px 6px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}>
              {/* Strap */}
              <div style={{ position: 'absolute', top: '18px', left: 0, right: 0, height: '8px', background: '#1e293b' }} />

              {/* Heterochromia Eyes (One Green, One Brown!) */}
              <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '2px' }}>
                {/* Left eye: Green */}
                <div style={{ width: '24px', height: '24px', background: '#94a3b8', borderRadius: '50%', border: '2.5px solid #64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '14px', height: '14px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '7px', height: '7px', background: '#16a34a', borderRadius: '50%', transform: isSad ? 'translateY(2px)' : `translateX(${lookAngle}px)` }} />
                  </div>
                </div>
                {/* Right eye: Brown */}
                <div style={{ width: '24px', height: '24px', background: '#94a3b8', borderRadius: '50%', border: '2.5px solid #64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '14px', height: '14px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '7px', height: '7px', background: '#78350f', borderRadius: '50%', transform: isSad ? 'translateY(2px)' : `translateX(${lookAngle}px)` }} />
                  </div>
                </div>
              </div>

              {/* Cute Smile / Big Cry */}
              <div style={{
                position: 'absolute',
                top: '40px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: isCelebrating ? '18px' : isSad ? '12px' : '12px',
                height: isCelebrating ? '10px' : isSad ? '4px' : '6px',
                background: isCelebrating ? '#991b1b' : 'transparent',
                borderBottom: isCelebrating ? 'none' : isSad ? 'none' : '3px solid #78350f',
                borderTop: isSad ? '3px solid #78350f' : 'none',
                borderRadius: isCelebrating ? '0 0 12px 12px' : '50%'
              }} />

              {/* Dungarees */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '42px', background: '#2563eb' }}>
                <div style={{ position: 'absolute', top: '-10px', left: '2px', width: '8px', height: '16px', background: '#1d4ed8', transform: 'rotate(-20deg)' }} />
                <div style={{ position: 'absolute', top: '-10px', right: '2px', width: '8px', height: '16px', background: '#1d4ed8', transform: 'rotate(20deg)' }} />
              </div>

              {/* Tears */}
              {isSad && (
                <>
                  <div className="tear-fall" style={{ position: 'absolute', top: '30px', left: '16px', width: '4px', height: '8px', background: '#60a5fa', borderRadius: '50%' }} />
                  <div className="tear-fall" style={{ position: 'absolute', top: '30px', right: '16px', width: '4px', height: '8px', background: '#60a5fa', borderRadius: '50%' }} />
                </>
              )}
            </div>

            {/* Bob Covers Eyes with Gloves */}
            <div style={{
              position: 'absolute',
              top: isCovering ? '18px' : isCelebrating ? '4px' : '54px',
              left: isCovering ? '16px' : '-2px',
              width: '16px',
              height: '16px',
              background: '#0f172a',
              borderRadius: '50%',
              zIndex: 10,
              transition: 'all 0.25s',
              transform: isCovering ? 'scale(1.3)' : 'none'
            }} />
            <div style={{
              position: 'absolute',
              top: isCovering ? '18px' : isCelebrating ? '4px' : '54px',
              right: isCovering ? '16px' : '-2px',
              width: '16px',
              height: '16px',
              background: '#0f172a',
              borderRadius: '50%',
              zIndex: 10,
              transition: 'all 0.25s',
              transform: isCovering ? 'scale(1.3)' : 'none'
            }} />
          </div>

          {/* ──────────────────────────────────────────────────────── */}
          {/* 6. MINION #4: OTTO (Chubby Minion with Braces / Looks away left) */}
          {/* ──────────────────────────────────────────────────────── */}
          <div className={isCelebrating ? 'anim-cheer-1' : isSad ? 'anim-sad-squad' : ''} style={{
            position: 'relative',
            width: '68px',
            height: '118px',
            transition: 'transform 0.3s ease',
            // LOOKS AWAY TO THE LEFT!
            transform: isCovering ? 'rotate(-20deg) translateX(-8px)' : 'none',
            zIndex: 3
          }}>
            {/* Hair Strands */}
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px' }}>
              <div style={{ width: '2px', height: '8px', background: '#1e293b', transform: 'rotate(-25deg)' }} />
              <div style={{ width: '2px', height: '8px', background: '#1e293b', transform: 'rotate(25deg)' }} />
            </div>

            {/* Round Body */}
            <div style={{
              position: 'absolute',
              top: '6px',
              left: '2px',
              right: '2px',
              bottom: 0,
              background: '#facc15',
              borderRadius: '32px 32px 14px 14px',
              boxShadow: 'inset -3px -3px 6px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}>
              {/* Strap */}
              <div style={{ position: 'absolute', top: '22px', left: 0, right: 0, height: '8px', background: '#1e293b' }} />

              {/* Two Big Goggles */}
              <div style={{ position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '2px' }}>
                {[0, 1].map((idx) => (
                  <div key={idx} style={{
                    width: '26px',
                    height: '26px',
                    background: '#94a3b8',
                    borderRadius: '50%',
                    border: '2.5px solid #64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{ width: '15px', height: '15px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '7px', height: '7px', background: '#78350f', borderRadius: '50%', transform: isCovering ? 'translateX(-4px)' : isSad ? 'translateY(2px)' : `translateX(${lookAngle}px)` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Braces Mouth */}
              <div style={{
                position: 'absolute',
                top: '46px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '18px',
                height: '8px',
                background: '#e2e8f0',
                border: '1.5px solid #64748b',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '7px',
                color: '#475569',
                fontWeight: 900
              }}>
                [#]
              </div>

              {/* Dungarees */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '44px', background: '#2563eb' }} />

              {/* Tears */}
              {isSad && (
                <div className="tear-fall" style={{ position: 'absolute', top: '38px', left: '50%', transform: 'translateX(-50%)', width: '5px', height: '9px', background: '#60a5fa', borderRadius: '50%' }} />
              )}
            </div>

            {/* Gloves */}
            <div style={{
              position: 'absolute',
              top: isCovering ? '32px' : isCelebrating ? '8px' : '62px',
              left: isCovering ? '-4px' : '-2px',
              width: '16px',
              height: '16px',
              background: '#0f172a',
              borderRadius: '50%',
              zIndex: 10,
              transition: 'all 0.25s'
            }} />
            <div style={{
              position: 'absolute',
              top: isCovering ? '32px' : isCelebrating ? '8px' : '62px',
              right: isCovering ? '-4px' : '-2px',
              width: '16px',
              height: '16px',
              background: '#0f172a',
              borderRadius: '50%',
              zIndex: 10,
              transition: 'all 0.25s'
            }} />
          </div>

          {/* ──────────────────────────────────────────────────────── */}
          {/* 7. CAT #3: PLAYFUL ORANGE TABBY CAT (Rightmost) */}
          {/* ──────────────────────────────────────────────────────── */}
          <div className={isCelebrating ? 'anim-cheer-2' : isSad ? 'anim-sad-squad' : ''} style={{
            position: 'relative',
            width: '66px',
            height: '96px',
            transition: 'transform 0.3s ease',
            transform: isCovering ? 'rotate(12deg)' : 'none',
            zIndex: 3
          }}>
            {/* Orange Ears */}
            <div style={{ position: 'absolute', top: '3px', left: '7px', width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderBottom: '16px solid #ea580c' }}>
              <div style={{ position: 'absolute', top: '5px', left: '-4px', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '9px solid #fecdd3' }} />
            </div>
            <div style={{ position: 'absolute', top: '3px', right: '7px', width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderBottom: '16px solid #ea580c' }}>
              <div style={{ position: 'absolute', top: '5px', left: '-4px', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '9px solid #fecdd3' }} />
            </div>

            {/* Body */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '4px',
              right: '4px',
              height: '78px',
              background: '#f97316',
              borderRadius: '28px 28px 14px 14px',
              boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}>
              {/* Tabby Stripes */}
              <div style={{ position: 'absolute', top: '6px', left: '50%', transform: 'translateX(-50%)', width: '16px', height: '3px', background: '#c2410c', borderRadius: '2px' }} />
              <div style={{ position: 'absolute', bottom: 0, left: '12px', right: '12px', height: '36px', background: '#ffedd5', borderRadius: '16px 16px 4px 4px' }} />

              {/* Eyes */}
              {!isCovering && (
                <div style={{ position: 'absolute', top: '18px', left: '9px', right: '9px', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ width: '12px', height: isSad ? '3px' : '11px', background: isSad ? '#0f172a' : '#0284c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!isSad && <div style={{ width: '6px', height: '6px', background: '#0f172a', borderRadius: '50%', transform: `translateX(${lookAngle}px)` }} />}
                  </div>
                  <div style={{ width: '12px', height: isSad ? '3px' : '11px', background: isSad ? '#0f172a' : '#0284c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!isSad && <div style={{ width: '6px', height: '6px', background: '#0f172a', borderRadius: '50%', transform: `translateX(${lookAngle}px)` }} />}
                  </div>
                </div>
              )}

              {/* Nose & Mouth */}
              <div style={{ position: 'absolute', top: '34px', left: '50%', transform: 'translateX(-50%)', width: '6px', height: '4px', background: '#f43f5e', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', top: '39px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', color: '#7c2d12', fontWeight: 900 }}>
                {isCelebrating ? '∇' : isSad ? '﹏' : '3'}
              </div>

              {/* Tears */}
              {isSad && (
                <div className="tear-fall" style={{ position: 'absolute', top: '26px', right: '12px', width: '4px', height: '8px', background: '#60a5fa', borderRadius: '50%' }} />
              )}
            </div>

            {/* Paws (Covering eyes) */}
            <div style={{
              position: 'absolute',
              top: isCovering ? '22px' : isCelebrating ? '12px' : '62px',
              left: '8px',
              width: '15px',
              height: '15px',
              background: '#ffedd5',
              borderRadius: '50%',
              border: '2px solid #ea580c',
              transition: 'all 0.25s',
              transform: isCovering ? 'scale(1.2)' : 'none',
              zIndex: 5
            }} />
            <div style={{
              position: 'absolute',
              top: isCovering ? '22px' : isCelebrating ? '12px' : '62px',
              right: '8px',
              width: '15px',
              height: '15px',
              background: '#ffedd5',
              borderRadius: '50%',
              border: '2px solid #ea580c',
              transition: 'all 0.25s',
              transform: isCovering ? 'scale(1.2)' : 'none',
              zIndex: 5
            }} />

            {/* Tail */}
            <div className="cat-tail-anim" style={{ position: 'absolute', bottom: '6px', right: '-8px', width: '8px', height: '30px', background: '#ea580c', borderRadius: '6px' }} />
          </div>

        </div>

        {/* Bottom Feature Badges */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', zIndex: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={16} color="var(--accent-emerald)" />
            <span>Strict Client-Side Privacy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Sparkles size={16} color="var(--accent-amber)" />
            <span>5-Agent Multi-Perspective Analysis</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT HALF: LOGIN / SIGN UP FORM */}
      {/* ======================================================== */}
      <div style={{
        flex: '0.85',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2.5rem',
        backgroundColor: 'var(--bg-card)',
        overflowY: 'auto'
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {/* Header */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563eb, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              marginBottom: '0.75rem',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.35)'
            }}>
              <Lock size={20} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {isSignUp ? 'Create your account' : 'Sign in to FinRAG'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {isSignUp 
                ? 'Register to unlock persistent analysis and multi-agent audits' 
                : 'Welcome back! Enter credentials or use 1-click instant demo'}
            </p>
          </div>

          {/* Feedback Alerts */}
          {loginError && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '12px',
              color: '#fca5a5',
              fontSize: '0.825rem',
              marginBottom: '1.25rem',
              animation: 'squadSad 0.4s ease'
            }}>
              <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
              <span>{loginError}</span>
            </div>
          )}

          {loginSuccess && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              borderRadius: '12px',
              color: '#6ee7b7',
              fontSize: '0.825rem',
              marginBottom: '1.25rem'
            }}>
              <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0 }} />
              <span>Login successful! The squad is cheering for you!</span>
            </div>
          )}

          {/* Quick 1-Click Demo Login Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            className="btn"
            style={{
              width: '100%',
              marginBottom: '1.5rem',
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid var(--accent-blue)',
              color: 'var(--accent-blue)',
              padding: '0.75rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              boxShadow: '0 2px 10px rgba(59, 130, 246, 0.15)'
            }}
          >
            <Sparkles size={16} /> Instant Demo Login (Dr. Michael Chen)
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            margin: '1rem 0 1.5rem',
            color: 'var(--text-muted)',
            fontSize: '0.75rem'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            <span>or sign in with email</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {isSignUp && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="e.g. Dr. Jane Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>
            )}

            {/* Email Field (Characters watch & eye tracking) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Work Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  placeholder="m.chen@apex-capital.com"
                  value={email}
                  onChange={handleEmailChange}
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>

            {/* Password Field (Triggers eyes covering & looking away left) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Password
                </label>
                <span style={{
                  fontSize: '0.72rem',
                  color: isCovering ? '#f59e0b' : 'var(--text-muted)',
                  fontWeight: isCovering ? 700 : 400
                }}>
                  {isCovering ? '🙈 Characters looking away left!' : 'Demo: "admin123" (wrong pass triggers crying 😿)'}
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color={isCovering ? 'var(--accent-blue)' : 'var(--text-muted)'} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onFocus={handlePasswordFocus}
                  onBlur={handlePasswordBlur}
                  onChange={handlePasswordChange}
                  className="input-field"
                  style={{
                    paddingLeft: '2.5rem',
                    paddingRight: '2.5rem',
                    borderColor: isCovering ? 'var(--accent-blue)' : undefined,
                    boxShadow: isCovering ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : undefined
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute',
                    right: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Institutional Firm / Organization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Global Asset Management"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="input-field"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isCelebrating}
              className="btn btn-primary"
              style={{
                marginTop: '0.5rem',
                padding: '0.8rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
              }}
            >
              {isSubmitting ? 'Authenticating...' : isSignUp ? 'Create FinRAG Account' : 'Sign In to Platform'}
            </button>
          </form>

          {/* Toggle between Sign In & Sign Up */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            {isSignUp ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setLoginError('');
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setLoginError('');
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Create Account
                </button>
              </span>
            )}
          </div>

          {/* Quick Demo Credentials Guide */}
          <div style={{
            marginTop: '1.25rem',
            padding: '0.75rem',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px dashed var(--border-subtle)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>🔐 Test Accounts & Audio Feedback</span>
              <span style={{ color: soundOn ? '#10b981' : '#f59e0b', fontWeight: 600 }}>{soundOn ? '🔊 Sound Active' : '🔇 Muted'}</span>
            </div>
            <div style={{ lineHeight: 1.5 }}>
              <div>• <strong>Admin:</strong> <code>admin@apex-capital.com</code> &bull; Password: <code>admin123</code></div>
              <div>• <strong>Analyst:</strong> <code>demo@finrag.io</code> &bull; Password: <code>password123</code></div>
              <div>• <em>Type any incorrect password to hear crying sound FX & watch the characters weep!</em></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
