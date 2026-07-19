'use client';

import { AlertCircle, CheckCircle2, Eye, EyeOff, Mail, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ApiError, apiRequest, setAccessToken } from '@/lib/api';
import { useSeliStore } from '@/lib/store';
import type { User } from '@/lib/types';

type Mode = 'login' | 'register';

export function AuthDialog() {
  const open = useSeliStore((state) => state.authOpen);
  const setOpen = useSeliStore((state) => state.setAuthOpen);
  const setUser = useSeliStore((state) => state.setUser);
  const [mode, setMode] = useState<Mode>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [seconds, setSeconds] = useState(60);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!verificationEmail || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [verificationEmail, seconds]);

  const passwordsMatch =
    !form.confirmPassword || form.password === form.confirmPassword;
  const passwordValid = useMemo(
    () => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/.test(form.password),
    [form.password],
  );

  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (mode === 'register' && (!passwordsMatch || !passwordValid)) {
      setError('Periksa kembali persyaratan dan konfirmasi password.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'register') {
        await apiRequest<{ id: string }>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            fullName: form.fullName,
            email: form.email,
            phoneNumber: form.phoneNumber,
            password: form.password,
          }),
        });
        setVerificationEmail(form.email);
        setSeconds(60);
      } else {
        const result = await apiRequest<{
          user: User;
          accessToken: string;
          expiresIn: number;
        }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        setAccessToken(result.accessToken);
        setUser(result.user);
        setOpen(false);
      }
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Koneksi bermasalah. Silakan coba kembali.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (seconds > 0) return;
    setLoading(true);
    try {
      await apiRequest('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: verificationEmail }),
      });
      setSeconds(60);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal mengirim ulang email.');
    } finally {
      setLoading(false);
    }
  }

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '6281234567890';
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo Admin Seli Florist, tolong bantu verifikasi akun saya ${verificationEmail}`)}`;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
      <section
        className="auth-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="icon-button close-button" onClick={() => setOpen(false)} aria-label="Tutup">
          <X size={20} />
        </button>

        {verificationEmail ? (
          <div className="verification-panel">
            <div className="mail-orbit"><Mail size={30} /></div>
            <p className="eyebrow">Satu langkah lagi</p>
            <h2 id="auth-title">Cek Inbox Email Anda</h2>
            <p>Kami mengirim tautan verifikasi ke <strong>{verificationEmail}</strong>.</p>
            {error && <InlineError message={error} />}
            <button className="primary-button countdown-button" disabled={seconds > 0 || loading} onClick={() => void resend()}>
              {seconds > 0 ? `Kirim ulang dalam ${String(seconds).padStart(2, '0')} dtk` : 'Kirim ulang email'}
            </button>
            <a className="wa-button" href={waLink} target="_blank" rel="noreferrer">Verifikasi via WA</a>
          </div>
        ) : (
          <>
            <p className="eyebrow">Selamat datang</p>
            <h2 id="auth-title">{mode === 'login' ? 'Masuk ke Seli Florist' : 'Buat akun baru'}</h2>
            <p className="auth-lead">Simpan pesanan dan rayakan momen istimewa dengan lebih mudah.</p>
            <div className="auth-tabs">
              <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>Masuk</button>
              <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>Daftar</button>
            </div>
            <form onSubmit={(event) => void submit(event)}>
              {error && <InlineError message={error} />}
              {mode === 'register' && (
                <label>Nama Lengkap<input required minLength={2} autoComplete="name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
              )}
              <label>Email<input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              {mode === 'register' && (
                <label>Nomor WhatsApp<input required inputMode="tel" autoComplete="tel" placeholder="62812…" pattern="\+?[1-9][0-9]{7,14}" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} /></label>
              )}
              <label>Password
                <span className="password-field"><input required type={showPassword ? 'text' : 'password'} minLength={mode === 'register' ? 10 : undefined} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Tampilkan password">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>
              </label>
              {mode === 'register' && (
                <>
                  <p className={`validation-hint ${form.password && passwordValid ? 'valid' : ''}`}><CheckCircle2 size={14} /> Min. 10 karakter, huruf besar, kecil, dan angka</p>
                  <label>Konfirmasi Password<input required type="password" autoComplete="new-password" aria-invalid={!passwordsMatch} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />{!passwordsMatch && <small className="field-error">Password belum sama.</small>}</label>
                </>
              )}
              <button className="primary-button" disabled={loading}>{loading ? 'Memproses…' : mode === 'login' ? 'Masuk' : 'Daftar Sekarang'}</button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

function InlineError({ message }: Readonly<{ message: string }>) {
  return <div className="inline-error" role="alert"><AlertCircle size={18} /><span>{message}</span></div>;
}
