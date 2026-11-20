"use client";

import {
  CheckCircle,
  Eye,
  EyeSlash,
  FloppyDisk,
  LockKey,
  ShieldCheck,
  UserCircle,
} from "@phosphor-icons/react";
import { FormEvent, useState } from "react";
import { updateProfile } from "@/lib/api";
import {
  isValidWhatsAppNumber,
  normalizeWhatsAppNumber,
} from "@/lib/phone-number";
import { useSeliStore } from "@/lib/store";
import type { User } from "@/lib/types";
import {
  isStrongPassword,
  PasswordRequirements,
} from "@/components/password-requirements";
import { PhoneNumberField } from "@/components/phone-number-field";

const roleLabels: Record<User["role"], string> = {
  OWNER: "Owner",
  FINANCE: "Staf Keuangan",
  STAFF_VERIFICATION: "Staf Verifikasi",
  CUSTOMER: "Pelanggan",
};

function AdminSettingsForm({ user }: Readonly<{ user: User }>) {
  const setUser = useSeliStore((state) => state.setUser);
  const showToast = useSeliStore((state) => state.showToast);
  const [fullName, setFullName] = useState(user.fullName);
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanName = fullName.trim();
    const cleanPhone = normalizeWhatsAppNumber(phoneNumber);
    if (cleanName.length < 2) {
      showToast("Nama minimal 2 karakter", "error");
      return;
    }
    if (!isValidWhatsAppNumber(cleanPhone)) {
      showToast("Nomor WhatsApp tidak valid", "error");
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await updateProfile({
        fullName: cleanName,
        phoneNumber: cleanPhone,
      });
      setUser(updated);
      setFullName(updated.fullName);
      setPhoneNumber(updated.phoneNumber ?? "");
      showToast("Profil berhasil diperbarui");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Gagal memperbarui profil",
        "error",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isStrongPassword(newPassword)) {
      showToast("Lengkapi seluruh syarat password baru", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Konfirmasi password baru tidak sama", "error");
      return;
    }
    if (currentPassword === newPassword) {
      showToast("Password baru harus berbeda dari password saat ini", "error");
      return;
    }

    setSavingPassword(true);
    try {
      await updateProfile({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswords(false);
      showToast("Password berhasil diganti");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Gagal mengganti password",
        "error",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="admin-page-wrap">
      <header className="admin-page-header">
        <div>
          <h1>Profil &amp; Keamanan</h1>
          <p>Kelola identitas dan perbarui password akun admin secara aman.</p>
        </div>
        <span className="status-badge-pill badge-green">
          <ShieldCheck size={14} weight="bold" /> {roleLabels[user.role]}
        </span>
      </header>

      <div className="admin-settings-grid">
        <aside className="admin-settings-stack">
          <section className="atelier-panel admin-settings-identity">
            <div className="admin-settings-avatar">
              <UserCircle size={29} weight="duotone" />
            </div>
            <div>
              <h2>{user.fullName}</h2>
              <p>{user.email}</p>
            </div>
          </section>

          <section className="atelier-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <CheckCircle size={20} weight="fill" color="#166437" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ display: "block", fontSize: "14px" }}>Email akun tetap</strong>
                <p style={{ margin: "5px 0 0", color: "var(--admin-muted)", fontSize: "12.5px", lineHeight: 1.55 }}>
                  Email digunakan sebagai identitas login dan tidak dapat diubah dari panel ini.
                </p>
              </div>
            </div>
          </section>
        </aside>

        <div className="admin-settings-stack">
          <section className="atelier-panel">
            <div className="atelier-panel-header">
              <div>
                <h2 className="atelier-panel-title">Informasi Profil</h2>
                <small style={{ color: "var(--admin-muted)" }}>Data yang tampil pada identitas panel admin.</small>
              </div>
            </div>
            <form className="admin-settings-form" onSubmit={(event) => void handleProfileSubmit(event)}>
              <div className="atelier-form-group">
                <label className="atelier-form-label" htmlFor="owner-email">Email login</label>
                <input id="owner-email" className="atelier-form-input" value={user.email} disabled />
              </div>
              <div className="admin-settings-form-row">
                <div className="atelier-form-group">
                  <label className="atelier-form-label" htmlFor="owner-name">Nama lengkap</label>
                  <input
                    id="owner-name"
                    className="atelier-form-input"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    minLength={2}
                    maxLength={150}
                    required
                  />
                </div>
                <div className="atelier-form-group">
                  <label className="atelier-form-label" htmlFor="owner-phone">Nomor WhatsApp</label>
                  <PhoneNumberField
                    id="owner-phone"
                    inputClassName="atelier-form-input"
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="atelier-btn-primary" disabled={savingProfile} style={{ justifySelf: "start" }}>
                <FloppyDisk size={16} weight="bold" />
                {savingProfile ? "Menyimpan…" : "Simpan Profil"}
              </button>
            </form>
          </section>

          <section className="atelier-panel">
            <div className="atelier-panel-header">
              <div>
                <h2 className="atelier-panel-title">Ganti Password</h2>
                <small style={{ color: "var(--admin-muted)" }}>Password lama wajib dikonfirmasi sebelum perubahan disimpan.</small>
              </div>
              <LockKey size={19} weight="duotone" color="var(--admin-rose)" />
            </div>
            <form className="admin-settings-form" onSubmit={(event) => void handlePasswordSubmit(event)}>
              <div className="atelier-form-group">
                <label className="atelier-form-label" htmlFor="current-password">Password saat ini</label>
                <div className="admin-password-field">
                  <input
                    id="current-password"
                    className="atelier-form-input"
                    type={showPasswords ? "text" : "password"}
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    maxLength={72}
                    required
                  />
                  <button
                    type="button"
                    className="admin-password-toggle"
                    onClick={() => setShowPasswords((visible) => !visible)}
                    aria-label={showPasswords ? "Sembunyikan password" : "Tampilkan password"}
                    title={showPasswords ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPasswords ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="admin-settings-form-row">
                <div className="atelier-form-group">
                  <label className="atelier-form-label" htmlFor="new-password">Password baru</label>
                  <input
                    id="new-password"
                    className="atelier-form-input"
                    type={showPasswords ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    minLength={10}
                    maxLength={72}
                    required
                  />
                </div>
                <div className="atelier-form-group">
                  <label className="atelier-form-label" htmlFor="confirm-password">Ulangi password baru</label>
                  <input
                    id="confirm-password"
                    className="atelier-form-input"
                    type={showPasswords ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    minLength={10}
                    maxLength={72}
                    required
                  />
                </div>
              </div>
              <PasswordRequirements
                password={newPassword}
                confirmPassword={confirmPassword}
              />
              <button type="submit" className="atelier-btn-primary" disabled={savingPassword} style={{ justifySelf: "start" }}>
                <LockKey size={16} weight="bold" />
                {savingPassword ? "Memperbarui…" : "Ganti Password"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const user = useSeliStore((state) => state.user);

  if (!user) {
    return (
      <div className="admin-page-wrap">
        <section className="atelier-panel" style={{ padding: "28px" }}>
          Memuat profil owner…
        </section>
      </div>
    );
  }

  return <AdminSettingsForm key={user.id} user={user} />;
}
