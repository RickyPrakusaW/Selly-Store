'use client';

import { AlertCircle, ClipboardList, Crown, Lightbulb, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { adminLogin, setAccessToken } from '@/lib/api';
import { useSeliStore } from '@/lib/store';

export default function AdminLoginPage() {
  const router = useRouter();
  const setUser = useSeliStore((state) => state.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminLogin(email, password);
      setAccessToken(res.accessToken);
      setUser(res.user);
      router.push('/admin/orders');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login admin gagal. Periksa kembali email dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <div className="brand-mark large">S</div>
        <h2>Portal Staf &amp; Management</h2>
        <p>Silakan masuk menggunakan kredensial akun admin Seli Florist.</p>

        {error && (
          <div className="inline-error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={(e) => void handleLogin(e)}>
          <label>
            Email Admin
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@seliflorist.com"
              />
            </div>
          </label>

          <label>
            Password
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </label>

          <button type="submit" className="primary-button full-width" disabled={loading}>
            <ShieldCheck size={18} />
            {loading ? 'Memverifikasi…' : 'Masuk Portal Admin'}
          </button>
        </form>

        <div style={{ marginTop: '20px', padding: '14px', background: 'var(--surface-color, #fff5f8)', border: '1px dashed #e8b4c5', borderRadius: '12px', fontSize: '13px', textAlign: 'left', lineHeight: '1.6' }}>
          <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#701a35' }}><Lightbulb size={16} /> Akun Demo Admin:</strong>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
            <button
              type="button"
              className="ghost-button compact"
              style={{ fontSize: '12px', padding: '4px 10px' }}
              onClick={() => { setEmail('owner@seliflorist.com'); setPassword('PasswordKuat123!'); }}
            >
              <Crown size={14} /> Isi Owner (owner@seliflorist.com)
            </button>
            <button
              type="button"
              className="ghost-button compact"
              style={{ fontSize: '12px', padding: '4px 10px' }}
              onClick={() => { setEmail('staff@seliflorist.com'); setPassword('PasswordKuat123!'); }}
            >
              <ClipboardList size={14} /> Isi Staff (staff@seliflorist.com)
            </button>
          </div>
        </div>
      </div>
    </main>

  );
}
