'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, KeyRound, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff, RefreshCw, ShieldCheck } from 'lucide-react';

type Step = 'email' | 'otp' | 'new_password' | 'success';

export default function ForgotPasswordClient() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('ashifur.badhon@gmail.com');
  const [otp, setOtp] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  // Resend cooldown timer
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setMsg({ type: 'error', text: 'Please enter a valid registered email address.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setChallengeId(data.challengeId || '');
        setCooldown(data.resendCooldownSeconds || 60);
        setStep('otp');
        setOtp('');
        setMsg({ type: 'success', text: data.message });
      } else {
        setMsg({ type: 'error', text: data.message || 'Failed to dispatch verification code.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Network connection error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || loading || !challengeId) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/auth/forgot-password/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCooldown(data.resendCooldownSeconds || 60);
        setOtp('');
        setAttemptsRemaining(null);
        setMsg({ type: 'success', text: data.message });
      } else {
        setMsg({ type: 'error', text: data.message || 'Failed to resend code.' });
        if (data.resendCooldownSeconds) {
          setCooldown(data.resendCooldownSeconds);
        }
      }
    } catch {
      setMsg({ type: 'error', text: 'Network error requesting new code.' });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP (Obtains single-use bearer resetToken)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setMsg({ type: 'error', text: 'Please enter the 6-digit numeric verification code.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          otp: cleanOtp,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.resetToken) {
        setResetToken(data.resetToken);
        setStep('new_password');
        setMsg({ type: 'success', text: 'Code verified successfully! Please enter your new password.' });
      } else {
        setMsg({ type: 'error', text: data.message || 'Invalid or expired code.' });
        if (typeof data.attemptsRemaining === 'number') {
          setAttemptsRemaining(data.attemptsRemaining);
        }
      }
    } catch {
      setMsg({ type: 'error', text: 'Network error verifying code.' });
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Complete Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!newPassword || newPassword.length < 8) {
      setMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'Passwords do not match. Please verify and try again.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          resetToken,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStep('success');
        setMsg(null);
      } else {
        setMsg({ type: 'error', text: data.message || 'Failed to update password.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Network error resetting password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'linear-gradient(135deg, #070a12 0%, #0c1222 50%, #070a12 100%)',
        color: '#f8fafc',
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(19, 24, 36, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '36px 32px',
          boxShadow: '0 30px 70px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(16, 185, 129, 0.2)',
          position: 'relative',
        }}
      >
        {/* Header Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
            }}
          >
            {step === 'success' ? <CheckCircle2 size={28} /> : <KeyRound size={28} />}
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px', color: '#f8fafc', letterSpacing: '-0.3px' }}>
            {step === 'email' && 'Forgot Password'}
            {step === 'otp' && 'Verify Email Code'}
            {step === 'new_password' && 'Create New Password'}
            {step === 'success' && 'Password Reset Completed'}
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
            {step === 'email' && 'Enter your registered email address to receive a secure 6-digit verification code.'}
            {step === 'otp' && `Enter the 6-digit verification code sent to ${email.replace(/^(.{2})(.*)(@.*)$/, '$1***$3')}.`}
            {step === 'new_password' && 'Please create a strong new password for your account (minimum 8 characters).'}
            {step === 'success' && 'Your password has been securely updated. You can now log in.'}
          </p>
        </div>

        {/* Step Progress Indicators */}
        {step !== 'success' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '22px',
            }}
          >
            <div
              style={{
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 700,
                background: step === 'email' ? '#10b981' : 'rgba(16, 185, 129, 0.2)',
                color: step === 'email' ? '#ffffff' : '#34d399',
              }}
            >
              1. Email
            </div>
            <div style={{ width: '12px', height: '1px', background: '#334155' }} />
            <div
              style={{
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 700,
                background: step === 'otp' ? '#10b981' : step === 'new_password' ? 'rgba(16, 185, 129, 0.2)' : '#1e293b',
                color: step === 'otp' ? '#ffffff' : step === 'new_password' ? '#34d399' : '#94a3b8',
              }}
            >
              2. Verify OTP
            </div>
            <div style={{ width: '12px', height: '1px', background: '#334155' }} />
            <div
              style={{
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 700,
                background: step === 'new_password' ? '#10b981' : '#1e293b',
                color: step === 'new_password' ? '#ffffff' : '#94a3b8',
              }}
            >
              3. Set Password
            </div>
          </div>
        )}

        {/* Status Message */}
        {msg && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              marginBottom: '20px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: msg.type === 'success' ? '#34d399' : '#f87171',
              border: `1px solid ${msg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            }}
          >
            {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span style={{ flex: 1 }}>{msg.text}</span>
          </div>
        )}

        {/* STEP 1: DIRECT EMAIL DISPATCH TO ashifur.badhon@gmail.com */}
        {step === 'email' && (
          <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div
              style={{
                padding: '16px',
                borderRadius: '14px',
                background: '#0b0f19',
                border: '1.5px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Mail size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px' }}>
                  Registered Admin Email
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                  ashifur.badhon@gmail.com
                </div>
              </div>
            </div>

            <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0, textAlign: 'center' }}>
              Click below to receive a secure 6-digit verification code. Code expires in 5 minutes.
            </p>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: loading ? '#1e293b' : '#10b981',
                color: loading ? '#94a3b8' : '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading && <RefreshCw size={16} className="animate-spin" />}
              {loading ? 'Sending Code...' : 'Send Verification Code to ashifur.badhon@gmail.com'}
            </button>
          </form>
        )}

        {/* STEP 2: OTP ENTRY (Password fields are completely hidden) */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div
              style={{
                background: '#0b0f19',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                padding: '12px 14px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px' }}>
                Verification code sent to registered Gmail:
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#10b981' }}>
                {email.replace(/^(.{2})(.*)(@.*)$/, '$1***$3')}
              </div>
            </div>

            <div>
              <label
                htmlFor="forgot-otp"
                style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#e2e8f0', textAlign: 'center' }}
              >
                Enter 6-Digit Code
              </label>
              <input
                id="forgot-otp"
                type="text"
                inputMode="numeric"
                autoFocus
                maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  background: '#0b0f19',
                  border: '1.5px solid #10b981',
                  color: '#f8fafc',
                  fontSize: '26px',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '12px' }}>
                <span style={{ color: '#94a3b8' }}>
                  Expires in <strong>5 minutes</strong>
                </span>
                {attemptsRemaining !== null && (
                  <span style={{ color: attemptsRemaining <= 2 ? '#f87171' : '#fbbf24', fontWeight: 700 }}>
                    {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setMsg(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#1f2937',
                  color: '#e2e8f0',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || otp.trim().length !== 6}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '12px',
                  background: otp.trim().length === 6 && !loading ? '#10b981' : '#334155',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  border: 'none',
                  cursor: otp.trim().length === 6 && !loading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {loading && <RefreshCw size={15} className="animate-spin" />}
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>

            {/* Resend Countdown */}
            <div style={{ textAlign: 'center', marginTop: '2px' }}>
              {cooldown > 0 ? (
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Resend code in <strong>{cooldown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Didn&apos;t receive code? Resend
                </button>
              )}
            </div>
          </form>
        )}

        {/* STEP 3: NEW PASSWORD & CONFIRM PASSWORD (REVEALED ONLY AFTER SUCCESSFUL SERVER-SIDE OTP VERIFICATION) */}
        {step === 'new_password' && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '12.5px',
                color: '#34d399',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ShieldCheck size={16} />
              <span>Email verified! You can now set a new password.</span>
            </div>

            <div>
              <label
                htmlFor="new-pass"
                style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}
              >
                New Password (minimum 8 characters)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="new-pass"
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  required
                  placeholder="Enter new password..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 14px',
                    borderRadius: '10px',
                    background: '#0b0f19',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-pass"
                style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}
              >
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirm-pass"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter new password..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 14px',
                    borderRadius: '10px',
                    background: '#0b0f19',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
              style={{
                marginTop: '6px',
                width: '100%',
                padding: '13px',
                borderRadius: '12px',
                background:
                  newPassword.length >= 8 && newPassword === confirmPassword && !loading ? '#10b981' : '#334155',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                border: 'none',
                cursor:
                  newPassword.length >= 8 && newPassword === confirmPassword && !loading
                    ? 'pointer'
                    : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading && <RefreshCw size={16} className="animate-spin" />}
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* STEP 4: SUCCESS CONFIRMATION */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '14px',
                padding: '16px',
                color: '#34d399',
                fontSize: '14px',
                fontWeight: 600,
                lineHeight: '1.5',
              }}
            >
              ✓ Your password has been successfully reset using cryptographic verification.
            </div>

            <Link
              href="/admin"
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '12px',
                background: '#10b981',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                textDecoration: 'none',
                display: 'inline-block',
                textAlign: 'center',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              }}
            >
              Proceed to Admin Login
            </Link>
          </div>
        )}

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: '22px' }}>
          <Link
            href="/admin"
            style={{
              fontSize: '13px',
              color: '#94a3b8',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.2s',
            }}
          >
            <ArrowLeft size={14} /> Back to Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}
