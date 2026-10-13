"use client";

import {
  EnvelopeSimple,
  LockSimple,
  ShieldCheck,
  UserGear,
  WarningCircle,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { adminLogin, setAccessToken } from "@/lib/api";
import { useSeliStore } from "@/lib/store";

export default function AdminLoginPage() {
  const router = useRouter();
  const setUser = useSeliStore((state) => state.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminLogin(email, password);
      setAccessToken(res.accessToken);
      setUser(res.user);
      router.push("/admin/orders");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login admin gagal. Periksa kembali email dan password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--admin-bg, #faf6f8)",
        padding: "24px 16px",
      }}
    >
      <div
        className="atelier-panel"
        style={{
          width: "min(420px, 100%)",
          padding: "36px 32px",
          borderRadius: "18px",
          boxShadow: "0 12px 32px rgba(43, 29, 35, 0.06)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <Image
            src="/logo.jpeg"
            alt="Logo Seli Florist"
            width={56}
            height={56}
            className="brand-logo-img"
            style={{ margin: "0 auto 12px" }}
            priority
          />
          <h1
            style={{
              margin: "0 0 6px",
              fontFamily: "var(--font-playfair), Georgia, serif",
              color: "var(--admin-rose, #701a35)",
              fontSize: "22px",
              fontWeight: 700,
            }}
          >
            Portal Manajemen Staf
          </h1>
          <p
            style={{
              margin: 0,
              color: "var(--admin-muted, #736269)",
              fontSize: "12.5px",
              lineHeight: 1.5,
            }}
          >
            Masuk dengan akun terverifikasi Seli Florist untuk mengelola pesanan dan operasional toko.
          </p>
        </div>

        {error && (
          <div
            className="inline-error"
            role="alert"
            style={{ marginBottom: "18px" }}
          >
            <WarningCircle size={18} weight="fill" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={(e) => void handleLogin(e)}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div className="atelier-form-group">
            <label className="atelier-form-label">Email Admin</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <EnvelopeSimple
                size={16}
                weight="regular"
                style={{
                  position: "absolute",
                  left: "12px",
                  color: "var(--admin-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="email"
                required
                className="atelier-form-input"
                style={{ paddingLeft: "36px" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@seliflorist.com"
              />
            </div>
          </div>

          <div className="atelier-form-group">
            <label className="atelier-form-label">Password</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <LockSimple
                size={16}
                weight="regular"
                style={{
                  position: "absolute",
                  left: "12px",
                  color: "var(--admin-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="password"
                required
                className="atelier-form-input"
                style={{ paddingLeft: "36px" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="atelier-btn-primary"
            style={{ width: "100%", padding: "10px", marginTop: "4px" }}
            disabled={loading}
          >
            <ShieldCheck size={16} weight="bold" />
            <span>{loading ? "Memverifikasi Kredensial…" : "Masuk ke Panel Operasional"}</span>
          </button>
        </form>

        {/* Demo Credentials Quick-Fill */}
        <div
          style={{
            marginTop: "24px",
            padding: "14px",
            background: "var(--admin-surface-muted, #f6eff3)",
            borderRadius: "10px",
            border: "1px solid var(--admin-border, #ebdbe2)",
            fontSize: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--admin-rose, #701a35)",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            <UserGear size={15} weight="bold" />
            <span>Kredensial Cepat (Demo):</span>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="atelier-btn-secondary compact"
              onClick={() => {
                setEmail("owner@seliflorist.com");
                setPassword("PasswordKuat123!");
              }}
            >
              Pemilik (owner)
            </button>
            <button
              type="button"
              className="atelier-btn-secondary compact"
              onClick={() => {
                setEmail("staff@seliflorist.com");
                setPassword("PasswordKuat123!");
              }}
            >
              Staf Verifikasi
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
