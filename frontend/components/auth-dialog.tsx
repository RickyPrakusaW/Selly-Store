'use client';

import { AlertCircle, CheckCircle2, Eye, EyeOff, LogIn, Mail, X, Sparkles } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiRequest, googleLoginApi, register as registerApi, setAccessToken } from '@/lib/api';
import { useSeliStore } from '@/lib/store';
import type { User } from '@/lib/types';

type Mode = 'login' | 'register';

export function AuthDialog() {
  const open = useSeliStore((state) => state.authOpen);
  const setOpen = useSeliStore((state) => state.setAuthOpen);
  const setUser = useSeliStore((state) => state.setUser);
  const showToast = useSeliStore((state) => state.showToast);
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
    () => form.password.length >= 6,
    [form.password],
  );

  if (!open) return null;

  async function handleGoogleLogin() {
    setError('');
    setLoading(true);
    try {
      // Prompt customer name and email or connect directly with Google profile
      const promptEmail = window.prompt('Masukkan email Google Anda:', form.email || 'customer@gmail.com');
      if (!promptEmail) {
        setLoading(false);
        return;
      }
      const promptName = promptEmail.split('@')[0]?.replace(/[._]/g, ' ') || 'Pelanggan Google';

      const result = await googleLoginApi({
        email: promptEmail.trim().toLowerCase(),
        name: promptName.charAt(0).toUpperCase() + promptName.slice(1),
      });

      if (result.accessToken) {
        setAccessToken(result.accessToken);
        setUser(result.user);
        setOpen(false);
        void useSeliStore.getState().syncGuestCart();
        void useSeliStore.getState().loadCart();
        showToast(`Selamat datang, ${result.user.fullName}! Akun Google terhubung.`);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Gagal menghubungkan akun Google. Silakan coba kembali.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (mode === 'register' && (!passwordsMatch || !passwordValid)) {
      setError('Password minimal 6 karakter dan konfirmasi harus cocok.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'register') {
        const result = await registerApi({
          fullName: form.fullName,
          email: form.email,
          phoneNumber: form.phoneNumber || undefined,
          password: form.password,
        });

        if (result.accessToken) {
          setAccessToken(result.accessToken);
          setUser(result.user);
          setOpen(false);
          void useSeliStore.getState().syncGuestCart();
          void useSeliStore.getState().loadCart();
          showToast('Selamat datang! Akun Anda aktif dan dapat langsung bertransaksi.');
          return;
        }

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
        void useSeliStore.getState().syncGuestCart();
        void useSeliStore.getState().loadCart();
        showToast(`Selamat datang kembali, ${result.user.fullName}!`);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Gagal memproses permintaan. Silakan coba kembali.',
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

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '6289517880077';
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
            <p className="eyebrow">Atelier Seli Florist</p>
            <h2 id="auth-title">{mode === 'login' ? 'Masuk ke Akun' : 'Buat Akun Baru'}</h2>
            <p className="auth-lead">Akses riwayat pesanan, jadwal sewa papan bunga, dan transaksi Anda.</p>

            <button
              type="button"
              className="google-auth-button"
              disabled={loading}
              onClick={() => void handleGoogleLogin()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{mode === 'login' ? 'Masuk Cepat dengan Google' : 'Daftar Cepat dengan Google'}</span>
            </button>

            <div className="auth-divider">atau menggunakan email</div>

            <div className="auth-tabs">
              <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>Masuk</button>
              <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>Daftar</button>
            </div>
            <form onSubmit={(event) => void submit(event)}>
              {error && <InlineError message={error} />}
              {mode === 'register' && (
                <label>Nama Lengkap<input required minLength={2} autoComplete="name" placeholder="Nama Anda" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
              )}
              <label>Email<input required type="email" autoComplete="email" placeholder="nama@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              {mode === 'register' && (
                <label>Nomor WhatsApp (Opsional)<input inputMode="tel" autoComplete="tel" placeholder="0812…" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} /></label>
              )}
              <label>Password
                <span className="password-field">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    minLength={6}
                    placeholder="Min. 6 karakter"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Tampilkan password">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </span>
              </label>
              {mode === 'register' && (
                <>
                  <p className={`validation-hint ${passwordValid ? 'valid' : ''}`}><CheckCircle2 size={14} /> Password minimal 6 karakter</p>
                  <label>Konfirmasi Password<input required type="password" autoComplete="new-password" placeholder="Ulangi password" aria-invalid={!passwordsMatch} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />{!passwordsMatch && <small className="field-error">Password belum sama.</small>}</label>
                </>
              )}
              <button className="primary-button" disabled={loading}>{loading ? 'Memproses…' : mode === 'login' ? 'Masuk ke Akun' : 'Daftar & Langsung Aktif'}</button>
            </form>

            <div className="guest-checkout-tip">
              <Sparkles size={14} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle', color: '#c58a9e' }} />
              <strong>Belanja Cepat:</strong> Anda juga bisa langsung checkout pesanan tanpa akun. Akun otomatis disinkronkan saat pembayaran.
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function InlineError({ message }: Readonly<{ message: string }>) {
  const isAdminMsg = message.toLowerCase().includes('admin');
  return (
    <div className="inline-error" role="alert" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertCircle size={18} />
        <span>{message}</span>
      </div>
      {isAdminMsg && (
        <a
          href="/admin/login"
          style={{
            color: '#a94065',
            fontWeight: 600,
            textDecoration: 'underline',
            fontSize: '12px',
            marginLeft: '26px',
          }}
        >
          <LogIn size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
          Klik di sini untuk Masuk ke Portal Admin
        </a>
      )}
    </div>
  );
}
