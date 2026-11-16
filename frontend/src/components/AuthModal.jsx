import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, ShieldCheck, Sparkles, AlertCircle, CheckCircle2, Volume2, VolumeX } from 'lucide-react';
import authSounds from '../utils/authSounds';
import { authenticateUser, registerAccount, getDemoUser } from '../utils/authService';

export default function AuthModal({ isOpen, onClose, onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [soundOn, setSoundOn] = useState(() => authSounds.isEnabled());

  // Character emotional states: 'idle' | 'watching' | 'covering' | 'sad' | 'celebrating'
  const [charState, setCharState] = useState('idle');
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Eye tracking offsets based on email length
  const [lookAngle, setLookAngle] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCharState('idle');
      setLoginError('');
      setLoginSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleAudio = () => {
    const next = authSounds.toggleSound();
    setSoundOn(next);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setLoginError('');
    if (charState !== 'covering' && charState !== 'celebrating') {
      setCharState('watching');
      // Subtle eye shift based on text length
      const offset = Math.min(Math.max((e.target.value.length - 12) * 0.4, -4), 4);
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
          onClose();
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
          onClose();
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
      onClose();
    }, 1200);
  };

  // Helper flags
  const isCovering = charState === 'covering';
  const isSad = charState === 'sad';
  const isCelebrating = charState === 'celebrating';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(10px)',
      padding: '1rem',
      overflowY: 'auto'
    }}>
      <style>{`
        @keyframes minionBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px) rotate(3deg); }
        }
        @keyframes minionSadShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px) rotate(-2deg); }
          75% { transform: translateX(4px) rotate(2deg); }
        }
        @keyframes tearDrop {
          0% { transform: translateY(0); opacity: 0; }
          40% { opacity: 1; }
          100% { transform: translateY(16px); opacity: 0; }
        }
        @keyframes catTailWag {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(20deg); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(40px) rotate(180deg); opacity: 0; }
        }
        .anim-cheer {
          animation: minionBounce 0.5s ease-in-out infinite;
        }
        .anim-sad {
          animation: minionSadShake 0.6s ease-in-out infinite;
        }
        .tear {
          animation: tearDrop 1.2s infinite;
        }
        .cat-tail {
          animation: catTailWag 1s ease-in-out infinite;
          transform-origin: bottom center;
        }
      `}</style>

      <div 
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '1.75rem',
          position: 'relative',
          backgroundColor: 'var(--bg-card)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          border: '1px solid var(--border-medium)',
          borderRadius: '20px'
        }}
      >
        {/* Header Action Buttons (Sound Toggle & Close) */}
        <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.45rem', zIndex: 10 }}>
          <button
            type="button"
            onClick={toggleAudio}
            title={soundOn ? 'Mute authentication sounds' : 'Unmute authentication sounds'}
            style={{
              background: soundOn ? 'rgba(59, 130, 246, 0.16)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${soundOn ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: soundOn ? 'var(--accent-blue)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ======================================================== */}
        {/* ANIMATED MINIONS & CATS THEATER STAGE */}
        {/* ======================================================== */}
        <div style={{
          position: 'relative',
          height: '130px',
          background: isCelebrating 
            ? 'linear-gradient(180deg, rgba(234, 179, 8, 0.25) 0%, rgba(245, 158, 11, 0.05) 100%)'
            : isSad 
            ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.2) 0%, rgba(30, 58, 138, 0.05) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
          borderRadius: '16px',
          marginBottom: '1.25rem',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: '12px',
          paddingBottom: '6px',
          border: '1px solid var(--border-subtle)',
          transition: 'all 0.3s ease'
        }}>

          {/* Celebratory Confetti Sparkles */}
          {isCelebrating && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <span style={{ position: 'absolute', top: '10px', left: '20%', fontSize: '18px', animation: 'confettiFall 1.2s infinite' }}>🎉</span>
              <span style={{ position: 'absolute', top: '15px', left: '48%', fontSize: '16px', animation: 'confettiFall 0.9s 0.2s infinite' }}>⭐</span>
              <span style={{ position: 'absolute', top: '8px', left: '75%', fontSize: '18px', animation: 'confettiFall 1.1s 0.4s infinite' }}>🎊</span>
              <span style={{ position: 'absolute', top: '25px', left: '88%', fontSize: '14px', animation: 'confettiFall 1.4s 0.1s infinite' }}>✨</span>
              <span style={{ position: 'absolute', top: '18px', left: '10%', fontSize: '14px', animation: 'confettiFall 1.3s 0.3s infinite' }}>🎈</span>
            </div>
          )}

          {/* Sad Rain Clouds */}
          {isSad && (
            <div style={{ position: 'absolute', top: '6px', width: '100%', textAlign: 'center', pointerEvents: 'none' }}>
              <span style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 600 }}>🌧️ Aw, wrong password... Try again!</span>
            </div>
          )}

          {/* State Badge Top Right */}
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '10px',
            fontSize: '0.68rem',
            padding: '2px 8px',
            borderRadius: '12px',
            background: isCelebrating ? '#10b981' : isSad ? '#ef4444' : isCovering ? '#f59e0b' : 'rgba(255,255,255,0.1)',
            color: '#fff',
            fontWeight: 700,
            letterSpacing: '0.02em',
            transition: 'all 0.3s'
          }}>
            {isCelebrating ? '🥳 CELEBRATING' : isSad ? '😢 CRYING' : isCovering ? '🙈 COVERING EYES' : '👀 WATCHING'}
          </div>

          {/* ──────────────────────────────────────────────────────── */}
          {/* CHARACTER 1: CUTE BLACK & WHITE CAT (Left) */}
          {/* ──────────────────────────────────────────────────────── */}
          <div className={isCelebrating ? 'anim-cheer' : isSad ? 'anim-sad' : ''} style={{
            position: 'relative',
            width: '64px',
            height: '82px',
            transition: 'transform 0.3s ease',
            transform: isCovering ? 'rotate(-6deg)' : 'none'
          }}>
            {/* Cat Ears */}
            <div style={{
              position: 'absolute',
              top: '4px',
              left: '6px',
              width: 0,
              height: 0,
              borderLeft: '9px solid transparent',
              borderRight: '9px solid transparent',
              borderBottom: '16px solid #1e293b',
              transform: isSad ? 'rotate(-20deg)' : 'none'
            }}>
              <div style={{
                position: 'absolute',
                top: '5px',
                left: '-5px',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderBottom: '9px solid #f472b6'
              }} />
            </div>
            <div style={{
              position: 'absolute',
              top: '4px',
              right: '6px',
              width: 0,
              height: 0,
              borderLeft: '9px solid transparent',
              borderRight: '9px solid transparent',
              borderBottom: '16px solid #1e293b',
              transform: isSad ? 'rotate(20deg)' : 'none'
            }}>
              <div style={{
                position: 'absolute',
                top: '5px',
                left: '-5px',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderBottom: '9px solid #f472b6'
              }} />
            </div>

            {/* Cat Body & Head */}
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '4px',
              right: '4px',
              height: '66px',
              background: '#334155',
              borderRadius: '26px 26px 14px 14px',
              boxShadow: 'inset 0 -4px 6px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}>
              {/* White Chest Patch */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: '12px',
                right: '12px',
                height: '32px',
                background: '#f8fafc',
                borderRadius: '16px 16px 6px 6px'
              }} />

              {/* Eyes */}
              {!isCovering ? (
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: '10px',
                  right: '10px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  {/* Left Eye */}
                  <div style={{
                    width: '12px',
                    height: isSad ? '4px' : isCelebrating ? '11px' : '10px',
                    background: isSad ? '#0f172a' : '#10b981',
                    borderRadius: isSad ? '2px' : '50%',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {!isSad && (
                      <div style={{
                        width: '6px',
                        height: '6px',
                        background: '#0f172a',
                        borderRadius: '50%',
                        transform: `translateX(${lookAngle}px)`
                      }} />
                    )}
                  </div>
                  {/* Right Eye */}
                  <div style={{
                    width: '12px',
                    height: isSad ? '4px' : isCelebrating ? '11px' : '10px',
                    background: isSad ? '#0f172a' : '#10b981',
                    borderRadius: isSad ? '2px' : '50%',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {!isSad && (
                      <div style={{
                        width: '6px',
                        height: '6px',
                        background: '#0f172a',
                        borderRadius: '50%',
                        transform: `translateX(${lookAngle}px)`
                      }} />
                    )}
                  </div>
                </div>
              ) : null}

              {/* Cat Nose & Mouth */}
              <div style={{
                position: 'absolute',
                top: '29px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '6px',
                height: '4px',
                background: '#f472b6',
                borderRadius: '50%'
              }} />

              {/* Mouth expression */}
              <div style={{
                position: 'absolute',
                top: '34px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '9px',
                lineHeight: 1,
                color: '#f8fafc',
                fontWeight: 800
              }}>
                {isCelebrating ? '3' : isSad ? '∧' : 'ω'}
              </div>

              {/* Tears when sad */}
              {isSad && (
                <>
                  <div className="tear" style={{
                    position: 'absolute',
                    top: '22px',
                    left: '12px',
                    width: '3px',
                    height: '6px',
                    background: '#60a5fa',
                    borderRadius: '50%'
                  }} />
                  <div className="tear" style={{
                    position: 'absolute',
                    top: '22px',
                    right: '12px',
                    width: '3px',
                    height: '6px',
                    background: '#60a5fa',
                    borderRadius: '50%'
                  }} />
                </>
              )}
            </div>

            {/* Cat Paws (covering eyes if isCovering, cheering up if isCelebrating) */}
            <div style={{
              position: 'absolute',
              top: isCovering ? '20px' : isCelebrating ? '12px' : '56px',
              left: '9px',
              width: '14px',
              height: '14px',
              background: '#f8fafc',
              borderRadius: '50%',
              border: '2px solid #334155',
              transition: 'all 0.25s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              transform: isCovering ? 'scale(1.15) rotate(10deg)' : 'none',
              zIndex: 5
            }} />
            <div style={{
              position: 'absolute',
              top: isCovering ? '20px' : isCelebrating ? '12px' : '56px',
              right: '9px',
              width: '14px',
              height: '14px',
              background: '#f8fafc',
              borderRadius: '50%',
              border: '2px solid #334155',
              transition: 'all 0.25s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              transform: isCovering ? 'scale(1.15) rotate(-10deg)' : 'none',
              zIndex: 5
            }} />

            {/* Cat Tail */}
            <div className="cat-tail" style={{
              position: 'absolute',
              bottom: '4px',
              left: '-6px',
              width: '8px',
              height: '24px',
              background: '#1e293b',
              borderRadius: '6px',
              transform: isSad ? 'rotate(-40deg)' : 'rotate(-10deg)'
            }} />
          </div>

          {/* ──────────────────────────────────────────────────────── */}
          {/* CHARACTER 2: TALL TWO-EYED MINION (Kevin / Center-Left) */}
          {/* ──────────────────────────────────────────────────────── */}
          <div className={isCelebrating ? 'anim-cheer' : isSad ? 'anim-sad' : ''} style={{
            position: 'relative',
            width: '66px',
            height: '105px',
            transition: 'transform 0.3s ease',
            zIndex: 2
          }}>
            {/* Minion Hair Sprouts */}
            <div style={{
              position: 'absolute',
              top: '0px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '3px'
            }}>
              <div style={{ width: '2px', height: '8px', background: '#1e293b', transform: 'rotate(-12deg)' }} />
              <div style={{ width: '2px', height: '10px', background: '#1e293b' }} />
              <div style={{ width: '2px', height: '8px', background: '#1e293b', transform: 'rotate(12deg)' }} />
            </div>

            {/* Yellow Body Pill */}
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '4px',
              right: '4px',
              bottom: '0px',
              background: '#facc15',
              borderRadius: '28px 28px 12px 12px',
              boxShadow: 'inset -3px -3px 6px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}>
              {/* Goggles Strap */}
              <div style={{
                position: 'absolute',
                top: '20px',
                left: 0,
                right: 0,
                height: '7px',
                background: '#1e293b'
              }} />

              {/* Goggles Frames & Eyes */}
              <div style={{
                position: 'absolute',
                top: '11px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '2px'
              }}>
                {/* Eye 1 */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  background: '#94a3b8',
                  borderRadius: '50%',
                  border: '3px solid #64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Eyeball */}
                  <div style={{
                    width: '14px',
                    height: '14px',
                    background: '#fff',
                    borderRadius: '50%',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '7px',
                      height: '7px',
                      background: '#78350f',
                      borderRadius: '50%',
                      transform: isSad ? 'translateY(2px)' : `translateX(${lookAngle}px)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{ width: '3px', height: '3px', background: '#000', borderRadius: '50%' }} />
                    </div>
                  </div>
                </div>

                {/* Eye 2 */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  background: '#94a3b8',
                  borderRadius: '50%',
                  border: '3px solid #64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    background: '#fff',
                    borderRadius: '50%',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '7px',
                      height: '7px',
                      background: '#78350f',
                      borderRadius: '50%',
                      transform: isSad ? 'translateY(2px)' : `translateX(${lookAngle}px)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{ width: '3px', height: '3px', background: '#000', borderRadius: '50%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mouth */}
              <div style={{
                position: 'absolute',
                top: '40px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: isCelebrating ? '18px' : isSad ? '14px' : '12px',
                height: isCelebrating ? '10px' : isSad ? '4px' : '6px',
                background: isCelebrating ? '#7f1d1d' : 'transparent',
                borderBottom: isCelebrating ? 'none' : isSad ? 'none' : '3px solid #78350f',
                borderTop: isSad ? '3px solid #78350f' : 'none',
                borderRadius: isCelebrating ? '0 0 12px 12px' : '50%',
                transition: 'all 0.2s',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center'
              }}>
                {isCelebrating && (
                  <div style={{ width: '10px', height: '3px', background: '#fff', borderRadius: '1px' }} />
                )}
              </div>

              {/* Blue Overalls / Dungarees */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '42px',
                background: '#2563eb',
                borderRadius: '8px 8px 10px 10px'
              }}>
                {/* Suspenders */}
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '2px',
                  width: '8px',
                  height: '18px',
                  background: '#1d4ed8',
                  transform: 'rotate(-20deg)'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '2px',
                  width: '8px',
                  height: '18px',
                  background: '#1d4ed8',
                  transform: 'rotate(20deg)'
                }} />

                {/* Gru 'G' Logo Pocket */}
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '18px',
                  height: '16px',
                  background: '#1e40af',
                  borderRadius: '2px 2px 6px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  color: '#fff',
                  fontWeight: 900
                }}>
                  G
                </div>
              </div>

              {/* Tears when sad */}
              {isSad && (
                <>
                  <div className="tear" style={{
                    position: 'absolute',
                    top: '32px',
                    left: '18px',
                    width: '4px',
                    height: '8px',
                    background: '#60a5fa',
                    borderRadius: '50%'
                  }} />
                  <div className="tear" style={{
                    position: 'absolute',
                    top: '32px',
                    right: '18px',
                    width: '4px',
                    height: '8px',
                    background: '#60a5fa',
                    borderRadius: '50%'
                  }} />
                </>
              )}
            </div>

            {/* Minion Arms & Hands (Hands cover goggles when typing password) */}
            <div style={{
              position: 'absolute',
              top: isCovering ? '24px' : isCelebrating ? '6px' : '54px',
              left: isCovering ? '16px' : '-2px',
              width: '16px',
              height: '16px',
              background: '#0f172a', // Black gloves
              borderRadius: '50%',
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              transition: 'all 0.25s ease',
              transform: isCovering ? 'scale(1.2) rotate(15deg)' : isCelebrating ? 'translateY(-6px)' : 'none'
            }} />
            <div style={{
              position: 'absolute',
              top: isCovering ? '24px' : isCelebrating ? '6px' : '54px',
              right: isCovering ? '16px' : '-2px',
              width: '16px',
              height: '16px',
              background: '#0f172a',
              borderRadius: '50%',
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              transition: 'all 0.25s ease',
              transform: isCovering ? 'scale(1.2) rotate(-15deg)' : isCelebrating ? 'translateY(-6px)' : 'none'
            }} />
          </div>

          {/* ──────────────────────────────────────────────────────── */}
          {/* CHARACTER 3: ONE-EYED ROUND MINION (Stuart / Center-Right) */}
          {/* ──────────────────────────────────────────────────────── */}
          <div className={isCelebrating ? 'anim-cheer' : isSad ? 'anim-sad' : ''} style={{
            position: 'relative',
            width: '62px',
            height: '92px',
            transition: 'transform 0.3s ease',
            zIndex: 1
          }}>
            {/* Combed Center Hair */}
            <div style={{
              position: 'absolute',
              top: '0px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '16px',
              height: '5px',
              borderTop: '2px solid #1e293b',
              borderRadius: '50%'
            }} />

            {/* Yellow Body Pill */}
            <div style={{
              position: 'absolute',
              top: '6px',
              left: '4px',
              right: '4px',
              bottom: '0px',
              background: '#facc15',
              borderRadius: '26px 26px 10px 10px',
              boxShadow: 'inset -3px -3px 6px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}>
              {/* Goggles Strap */}
              <div style={{
                position: 'absolute',
                top: '20px',
                left: 0,
                right: 0,
                height: '7px',
                background: '#1e293b'
              }} />

              {/* Single Large Cyclops Goggle & Eye */}
              <div style={{
                position: 'absolute',
                top: '11px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '30px',
                height: '30px',
                background: '#94a3b8',
                borderRadius: '50%',
                border: '3px solid #64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: '18px',
                  height: '18px',
                  background: '#fff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '9px',
                    height: '9px',
                    background: '#78350f',
                    borderRadius: '50%',
                    transform: isSad ? 'translateY(2px)' : `translateX(${lookAngle}px)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{ width: '4px', height: '4px', background: '#000', borderRadius: '50%' }} />
                  </div>
                </div>
              </div>

              {/* Mouth */}
              <div style={{
                position: 'absolute',
                top: '46px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: isCelebrating ? '16px' : isSad ? '12px' : '10px',
                height: isCelebrating ? '8px' : isSad ? '3px' : '5px',
                background: isCelebrating ? '#7f1d1d' : 'transparent',
                borderBottom: isCelebrating ? 'none' : isSad ? 'none' : '3px solid #78350f',
                borderTop: isSad ? '3px solid #78350f' : 'none',
                borderRadius: isCelebrating ? '0 0 10px 10px' : '50%'
              }} />

              {/* Dungarees */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '36px',
                background: '#2563eb'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '2px',
                  width: '7px',
                  height: '16px',
                  background: '#1d4ed8',
                  transform: 'rotate(-20deg)'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '2px',
                  width: '7px',
                  height: '16px',
                  background: '#1d4ed8',
                  transform: 'rotate(20deg)'
                }} />
              </div>

              {/* Tears when sad */}
              {isSad && (
                <div className="tear" style={{
                  position: 'absolute',
                  top: '38px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '5px',
                  height: '9px',
                  background: '#60a5fa',
                  borderRadius: '50%'
                }} />
              )}
            </div>

            {/* Cyclops Hands Covering Eye */}
            <div style={{
              position: 'absolute',
              top: isCovering ? '22px' : isCelebrating ? '4px' : '48px',
              left: isCovering ? '18px' : '-2px',
              width: '16px',
              height: '16px',
              background: '#0f172a',
              borderRadius: '50%',
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              transition: 'all 0.25s ease',
              transform: isCovering ? 'scale(1.3)' : 'none'
            }} />
            <div style={{
              position: 'absolute',
              top: isCovering ? '22px' : isCelebrating ? '4px' : '48px',
              right: isCovering ? '18px' : '-2px',
              width: '16px',
              height: '16px',
              background: '#0f172a',
              borderRadius: '50%',
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              transition: 'all 0.25s ease',
              transform: isCovering ? 'scale(1.3)' : 'none'
            }} />
          </div>

          {/* ──────────────────────────────────────────────────────── */}
          {/* CHARACTER 4: PLAYFUL ORANGE TABBY CAT (Right) */}
          {/* ──────────────────────────────────────────────────────── */}
          <div className={isCelebrating ? 'anim-cheer' : isSad ? 'anim-sad' : ''} style={{
            position: 'relative',
            width: '60px',
            height: '76px',
            transition: 'transform 0.3s ease',
            transform: isCovering ? 'rotate(6deg)' : 'none'
          }}>
            {/* Orange Cat Ears */}
            <div style={{
              position: 'absolute',
              top: '2px',
              left: '6px',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: '15px solid #ea580c',
              transform: isSad ? 'rotate(-18deg)' : 'none'
            }}>
              <div style={{
                position: 'absolute',
                top: '5px',
                left: '-4px',
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderBottom: '8px solid #fecdd3'
              }} />
            </div>
            <div style={{
              position: 'absolute',
              top: '2px',
              right: '6px',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: '15px solid #ea580c',
              transform: isSad ? 'rotate(18deg)' : 'none'
            }}>
              <div style={{
                position: 'absolute',
                top: '5px',
                left: '-4px',
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderBottom: '8px solid #fecdd3'
              }} />
            </div>

            {/* Orange Body */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '4px',
              right: '4px',
              height: '62px',
              background: '#f97316',
              borderRadius: '24px 24px 12px 12px',
              boxShadow: 'inset 0 -3px 5px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}>
              {/* Tabby Stripes */}
              <div style={{ position: 'absolute', top: '4px', left: '50%', transform: 'translateX(-50%)', width: '12px', height: '3px', background: '#c2410c', borderRadius: '2px' }} />
              <div style={{ position: 'absolute', top: '9px', left: '50%', transform: 'translateX(-50%)', width: '16px', height: '3px', background: '#c2410c', borderRadius: '2px' }} />

              {/* White Belly */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: '10px',
                right: '10px',
                height: '28px',
                background: '#ffedd5',
                borderRadius: '14px 14px 4px 4px'
              }} />

              {/* Eyes */}
              {!isCovering && (
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  left: '8px',
                  right: '8px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <div style={{
                    width: '11px',
                    height: isSad ? '3px' : isCelebrating ? '10px' : '9px',
                    background: isSad ? '#0f172a' : '#0284c7',
                    borderRadius: isSad ? '2px' : '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {!isSad && (
                      <div style={{ width: '5px', height: '5px', background: '#0f172a', borderRadius: '50%', transform: `translateX(${lookAngle}px)` }} />
                    )}
                  </div>
                  <div style={{
                    width: '11px',
                    height: isSad ? '3px' : isCelebrating ? '10px' : '9px',
                    background: isSad ? '#0f172a' : '#0284c7',
                    borderRadius: isSad ? '2px' : '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {!isSad && (
                      <div style={{ width: '5px', height: '5px', background: '#0f172a', borderRadius: '50%', transform: `translateX(${lookAngle}px)` }} />
                    )}
                  </div>
                </div>
              )}

              {/* Nose & Mouth */}
              <div style={{
                position: 'absolute',
                top: '27px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '5px',
                height: '3px',
                background: '#f43f5e',
                borderRadius: '50%'
              }} />
              <div style={{
                position: 'absolute',
                top: '31px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '8px',
                color: '#7c2d12',
                fontWeight: 900
              }}>
                {isCelebrating ? '∇' : isSad ? '﹏' : '3'}
              </div>

              {/* Tears when sad */}
              {isSad && (
                <div className="tear" style={{
                  position: 'absolute',
                  top: '20px',
                  right: '10px',
                  width: '3px',
                  height: '7px',
                  background: '#60a5fa',
                  borderRadius: '50%'
                }} />
              )}
            </div>

            {/* Paws */}
            <div style={{
              position: 'absolute',
              top: isCovering ? '18px' : isCelebrating ? '10px' : '52px',
              left: '8px',
              width: '13px',
              height: '13px',
              background: '#ffedd5',
              borderRadius: '50%',
              border: '2px solid #ea580c',
              transition: 'all 0.25s ease',
              transform: isCovering ? 'scale(1.2) rotate(15deg)' : 'none',
              zIndex: 5
            }} />
            <div style={{
              position: 'absolute',
              top: isCovering ? '18px' : isCelebrating ? '10px' : '52px',
              right: '8px',
              width: '13px',
              height: '13px',
              background: '#ffedd5',
              borderRadius: '50%',
              border: '2px solid #ea580c',
              transition: 'all 0.25s ease',
              transform: isCovering ? 'scale(1.2) rotate(-15deg)' : 'none',
              zIndex: 5
            }} />

            {/* Cat Tail */}
            <div className="cat-tail" style={{
              position: 'absolute',
              bottom: '4px',
              right: '-6px',
              width: '7px',
              height: '22px',
              background: '#ea580c',
              borderRadius: '5px',
              transform: isSad ? 'rotate(35deg)' : 'rotate(15deg)'
            }} />
          </div>

        </div>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {isSignUp ? 'Create FinRAG Account' : 'Sign in to FinRAG'}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {isCovering 
              ? '🙈 Shh! Characters are hiding their eyes while you enter your secret code!'
              : isCelebrating 
              ? '🎉 Welcome back! Login authenticated successfully!'
              : isSad
              ? '😿 Incorrect password! The characters are crying!'
              : 'Enter credentials or test the minion and cat password animations'}
          </p>
        </div>

        {/* Error / Success Alerts */}
        {loginError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 0.85rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            borderRadius: '10px',
            color: '#fca5a5',
            fontSize: '0.8rem',
            marginBottom: '1rem',
            animation: 'minionSadShake 0.4s ease'
          }}>
            <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>{loginError}</span>
          </div>
        )}

        {loginSuccess && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 0.85rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            borderRadius: '10px',
            color: '#6ee7b7',
            fontSize: '0.8rem',
            marginBottom: '1rem'
          }}>
            <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
            <span>Success! The minions and cats are celebrating your login!</span>
          </div>
        )}

        {/* 1-Click Quick Demo Login Button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          className="btn"
          style={{
            width: '100%',
            marginBottom: '1.25rem',
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid var(--accent-blue)',
            color: 'var(--accent-blue)',
            padding: '0.6rem',
            fontSize: '0.825rem',
            fontWeight: 600
          }}
        >
          <Sparkles size={16} /> Instant Demo Login (Dr. Michael Chen)
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          margin: '0.75rem 0 1.25rem',
          color: 'var(--text-muted)',
          fontSize: '0.75rem'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span>or enter credentials</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {isSignUp && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="e.g. Dr. Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '2.4rem' }}
                />
              </div>
            </div>
          )}

          {/* Email field (Characters watch and eyes follow typing) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Work Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                placeholder="investor@apex-capital.com"
                value={email}
                onChange={handleEmailChange}
                className="input-field"
                style={{ paddingLeft: '2.4rem' }}
                required
              />
            </div>
          </div>

          {/* Password field (Characters cover eyes or look away) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                Password
              </label>
              <span style={{ fontSize: '0.7rem', color: isCovering ? '#f59e0b' : 'var(--text-muted)', fontWeight: isCovering ? 700 : 400 }}>
                {isCovering ? '🙈 Characters are covering eyes!' : 'Demo: "admin123" (wrong pass triggers crying 😿)'}
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color={isCovering ? 'var(--accent-blue)' : 'var(--text-muted)'} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onFocus={handlePasswordFocus}
                onBlur={handlePasswordBlur}
                onChange={handlePasswordChange}
                className="input-field"
                style={{
                  paddingLeft: '2.4rem',
                  borderColor: isCovering ? 'var(--accent-blue)' : undefined,
                  boxShadow: isCovering ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : undefined
                }}
                required
              />
            </div>
          </div>

          {isSignUp && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Asset Management Firm
              </label>
              <input
                type="text"
                placeholder="e.g. Apex Global Capital"
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
              marginTop: '0.35rem',
              padding: '0.7rem',
              fontWeight: 700,
              fontSize: '0.875rem'
            }}
          >
            {isSubmitting ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In to Portal'}
          </button>
        </form>

        {/* Toggle between Sign In & Sign Up */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {isSignUp ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setLoginError('');
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontWeight: 600, cursor: 'pointer' }}
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              New to FinRAG?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setLoginError('');
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', fontWeight: 600, cursor: 'pointer' }}
              >
                Create Account
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
