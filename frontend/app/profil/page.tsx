"use client";

import {
  AlertCircle,
  CheckCircle2,
  LogOut,
  Save,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { updateProfile } from "@/lib/api";
import { useSeliStore } from "@/lib/store";

export default function ProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const user = useSeliStore((state) => state.user);
  const setUser = useSeliStore((state) => state.setUser);
  const logoutUser = useSeliStore((state) => state.logoutUser);
  const setAuthOpen = useSeliStore((state) => state.setAuthOpen);
  const showToast = useSeliStore((state) => state.showToast);

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- synchronize editable form when the authenticated user loads */
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setPhoneNumber(user.phoneNumber || "");
    }
  }, [user]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!mounted) {
    return (
      <main className="simple-page shell">
        <div className="empty-state">
          <p>Memuat profil...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="simple-page shell">
        <div className="empty-state">
          <UserRound size={50} />
          <h2>Silakan Masuk Terlebih Dahulu</h2>
          <p>Anda belum masuk ke akun Seli Florist.</p>
          <button className="primary-button" onClick={() => setAuthOpen(true)}>
            Masuk / Daftar
          </button>
        </div>
      </main>
    );
  }

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const updated = await updateProfile({ fullName, phoneNumber });
      setUser(updated);
      showToast("Profil berhasil diperbarui!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memperbarui profil.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="simple-page shell">
      <header className="section-heading">
        <div>
          <p className="eyebrow">Pengaturan Akun</p>
          <h1>Profil Saya</h1>
        </div>
      </header>

      {error && (
        <div className="inline-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div
        className="admin-two-cols"
        style={{ gridTemplateColumns: "360px 1fr" }}
      >
        <div className="admin-card-form">
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <div className="mail-orbit" style={{ margin: "0 auto 12px" }}>
              <UserRound size={32} />
            </div>
            <h2>{user.fullName}</h2>
            <p className="text-muted">{user.email}</p>
            <div style={{ marginTop: "8px" }}>
              {user.isVerified ? (
                <span
                  className="badge-chip active"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <CheckCircle2 size={12} /> Akun Terverifikasi
                </span>
              ) : (
                <span className="badge-chip inactive">
                  Belum Verifikasi Email
                </span>
              )}
            </div>
          </div>

          <div className="summary-divider" />

          <button
            className="secondary-button danger"
            onClick={() => {
              void logoutUser();
              router.push("/");
            }}
          >
            <LogOut size={16} /> Keluar Dari Akun
          </button>
        </div>

        <form
          className="admin-card-form"
          onSubmit={(e) => void handleUpdate(e)}
        >
          <h3>Ubah Informasi Profil</h3>

          <label>
            Email Akun (Tidak dapat diubah)
            <input
              type="email"
              value={user.email}
              disabled
              style={{ opacity: 0.7 }}
            />
          </label>

          <label>
            Nama Lengkap *
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>

          <label>
            Nomor WhatsApp *
            <input
              required
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="6281234567890"
            />
          </label>

          <button type="submit" className="primary-button" disabled={saving}>
            <Save size={16} />{" "}
            {saving ? "Menyimpan…" : "Simpan Perubahan Profil"}
          </button>
        </form>
      </div>
    </main>
  );
}
