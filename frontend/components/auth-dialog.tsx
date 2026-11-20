"use client";

import {
  AlertCircle,
  Eye,
  EyeOff,
  LogIn,
  Mail,
  X,
} from "lucide-react";
import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  apiRequest,
  googleLoginApi,
  register as registerApi,
  setAccessToken,
} from "@/lib/api";
import { useSeliStore } from "@/lib/store";
import type { User } from "@/lib/types";
import {
  isValidWhatsAppNumber,
  normalizeWhatsAppNumber,
} from "@/lib/phone-number";
import {
  isStrongPassword,
  PasswordRequirements,
} from "@/components/password-requirements";
import { PhoneNumberField } from "@/components/phone-number-field";

interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            itp_support?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: number | string;
            },
          ) => void;
        };
      };
    };
  }
}

type Mode = "login" | "register";

export function AuthDialog() {
  const open = useSeliStore((state) => state.authOpen);
  const setOpen = useSeliStore((state) => state.setAuthOpen);
  const setUser = useSeliStore((state) => state.setUser);
  const showToast = useSeliStore((state) => state.showToast);
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [seconds, setSeconds] = useState(60);

  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!verificationEmail || seconds <= 0) return;
    const timer = window.setInterval(
      () => setSeconds((value) => value - 1),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [verificationEmail, seconds]);

  const handleGoogleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      setError("");
      setLoading(true);
      try {
        const result = await googleLoginApi({
          credential: response.credential,
        });
        setAccessToken(result.accessToken);
        setUser(result.user);

        const store = useSeliStore.getState();
        await store.syncGuestCart();
        await store.loadCart();

        setOpen(false);
        showToast(
          `Selamat datang, ${result.user.fullName}! Akun Google terhubung.`,
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Gagal menghubungkan akun Google. Silakan coba kembali.",
        );
      } finally {
        setLoading(false);
      }
    },
    [setOpen, setUser, showToast],
  );

  useEffect(() => {
    if (!open) return;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    const checkPopupBlocked = (...args: unknown[]) => {
      try {
        const msg = args
          .map((a) => (typeof a === "string" ? a : String(a)))
          .join(" ");
        if (
          msg.includes("Failed to open popup window") ||
          msg.includes("Maybe blocked by the browser")
        ) {
          setError(
            "Jendela pop-up login Google diblokir oleh browser. Silakan klik ikon pop-up di bilah alamat (address bar) browser Anda lalu pilih 'Selalu izinkan pop-up' (Always allow pop-ups).",
          );
        }
      } catch {
        /* ignore parsing error */
      }
    };

    console.error = (...args: unknown[]) => {
      originalConsoleError(...args);
      checkPopupBlocked(...args);
    };

    console.warn = (...args: unknown[]) => {
      originalConsoleWarn(...args);
      checkPopupBlocked(...args);
    };

    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !googleClientId) return;

    const initGsi = () => {
      const g = window.google;
      if (!g?.accounts?.id || !googleBtnContainerRef.current) return;

      g.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => void handleGoogleCredential(response),
        cancel_on_tap_outside: true,
        itp_support: true,
      });

      const measured = googleBtnContainerRef.current.clientWidth;
      const fallback = Math.min(Math.max(window.innerWidth - 80, 200), 320);
      const btnWidth = Math.min(
        Math.max(Math.floor(measured || fallback), 200),
        340,
      );

      googleBtnContainerRef.current.innerHTML = "";
      g.accounts.id.renderButton(googleBtnContainerRef.current, {
        theme: "outline",
        size: "large",
        width: btnWidth,
        shape: "pill",
        logo_alignment: "center",
      });
    };

    let script = document.getElementById(
      "google-gsi-client",
    ) as HTMLScriptElement | null;
    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      if (!script) {
        script = document.createElement("script");
        script.id = "google-gsi-client";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
      script.addEventListener("load", initGsi);
    }

    return () => script?.removeEventListener("load", initGsi);
  }, [googleClientId, handleGoogleCredential, open]);

  const passwordsMatch =
    !form.confirmPassword || form.password === form.confirmPassword;
  const passwordValid = isStrongPassword(form.password);

  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (mode === "register" && (!passwordsMatch || !passwordValid)) {
      setError("Lengkapi seluruh syarat password dan pastikan konfirmasi sama.");
      return;
    }
    if (
      mode === "register" &&
      form.phoneNumber &&
      !isValidWhatsAppNumber(form.phoneNumber)
    ) {
      setError("Nomor WhatsApp belum lengkap atau tidak valid.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "register") {
        const normalizedPhone = normalizeWhatsAppNumber(form.phoneNumber);
        setForm((current) => ({
          ...current,
          phoneNumber: normalizedPhone,
        }));
        const result = await registerApi({
          fullName: form.fullName,
          email: form.email,
          phoneNumber: normalizedPhone || undefined,
          password: form.password,
        });

        if (result.accessToken) {
          setAccessToken(result.accessToken);
          setUser(result.user);
          setOpen(false);
          void useSeliStore.getState().syncGuestCart();
          void useSeliStore.getState().loadCart();
          showToast(
            "Selamat datang! Akun Anda aktif dan dapat langsung bertransaksi.",
          );
          return;
        }

        setVerificationEmail(form.email);
        setSeconds(60);
      } else {
        const result = await apiRequest<{
          user: User;
          accessToken: string;
          expiresIn: number;
        }>("/auth/login", {
          method: "POST",
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
          : "Gagal memproses permintaan. Silakan coba kembali.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (seconds > 0) return;
    setLoading(true);
    try {
      await apiRequest("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: verificationEmail }),
      });
      setSeconds(60);
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Gagal mengirim ulang email.",
      );
    } finally {
      setLoading(false);
    }
  }

  const waNumber = normalizeWhatsAppNumber(
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6289517880077",
  );
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo Admin LICHARY Florist, tolong bantu verifikasi akun saya ${verificationEmail}`)}`;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={() => setOpen(false)}
    >
      <section
        className="auth-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="icon-button close-button"
          onClick={() => setOpen(false)}
          aria-label="Tutup"
        >
          <X size={20} />
        </button>

        {verificationEmail ? (
          <div className="verification-panel">
            <div className="mail-orbit">
              <Mail size={30} />
            </div>
            <p className="eyebrow">Satu langkah lagi</p>
            <h2 id="auth-title">Cek Inbox Email Anda</h2>
            <p>
              Kami mengirim tautan verifikasi ke{" "}
              <strong>{verificationEmail}</strong>.
            </p>
            {error && <InlineError message={error} />}
            <button
              className="primary-button countdown-button"
              disabled={seconds > 0 || loading}
              onClick={() => void resend()}
            >
              {seconds > 0
                ? `Kirim ulang dalam ${String(seconds).padStart(2, "0")} dtk`
                : "Kirim ulang email"}
            </button>
            <a
              className="wa-button"
              href={waLink}
              target="_blank"
              rel="noreferrer"
            >
              Verifikasi via WA
            </a>
          </div>
        ) : (
          <>
            <p className="eyebrow">Atelier LICHARY Florist</p>
            <h2 id="auth-title">
              {mode === "login" ? "Masuk ke Akun" : "Buat Akun Baru"}
            </h2>
            <p className="auth-lead">
              Akses riwayat pesanan, jadwal sewa papan bunga, dan transaksi
              Anda.
            </p>

            {/* Official Google Identity Services SDK Render Target */}
            {googleClientId ? (
              <>
                <div
                  ref={googleBtnContainerRef}
                  className="auth-google-box"
                />
                <div className="auth-divider">atau menggunakan email</div>
              </>
            ) : null}

            <div className="auth-tabs">
              <button
                className={mode === "login" ? "active" : ""}
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Masuk
              </button>
              <button
                className={mode === "register" ? "active" : ""}
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
              >
                Daftar
              </button>
            </div>
            <form onSubmit={(event) => void submit(event)}>
              {error && <InlineError message={error} />}
              {mode === "register" && (
                <label>
                  Nama Lengkap
                  <input
                    required
                    minLength={2}
                    autoComplete="name"
                    placeholder="Nama Anda"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                  />
                </label>
              )}
              <label>
                Email
                <input
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              {mode === "register" && (
                <label>
                  Nomor WhatsApp (Opsional)
                  <PhoneNumberField
                    autoComplete="tel"
                    value={form.phoneNumber}
                    onChange={(phoneNumber) =>
                      setForm((current) => ({
                        ...current,
                        phoneNumber,
                      }))
                    }
                  />
                </label>
              )}
              <label>
                Password
                <span className="password-field">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    minLength={mode === "register" ? 10 : undefined}
                    placeholder={mode === "register" ? "Buat password yang kuat" : "Masukkan password"}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Tampilkan password"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>
              {mode === "register" && (
                <>
                  <PasswordRequirements
                    password={form.password}
                    confirmPassword={form.confirmPassword}
                  />
                  <label>
                    Konfirmasi Password
                    <input
                      required
                      type="password"
                      autoComplete="new-password"
                      placeholder="Ulangi password"
                      aria-invalid={!passwordsMatch}
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm({ ...form, confirmPassword: e.target.value })
                      }
                    />
                    {!passwordsMatch && (
                      <small className="field-error">
                        Password belum sama.
                      </small>
                    )}
                  </label>
                </>
              )}
              <button className="primary-button" disabled={loading}>
                {loading
                  ? "Memproses…"
                  : mode === "login"
                    ? "Masuk ke Akun"
                    : "Buat Akun"}
              </button>
            </form>

            <p className="guest-checkout-tip">
              Checkout tanpa akun tersedia. Detail penerima dan kontak tetap
              diisi pada langkah pemesanan.
            </p>
          </>
        )}
      </section>
    </div>
  );
}

function InlineError({ message }: Readonly<{ message: string }>) {
  const isAdminMsg = message.toLowerCase().includes("admin");
  return (
    <div
      className="inline-error"
      role="alert"
      style={{ flexDirection: "column", alignItems: "flex-start", gap: "8px" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <AlertCircle size={18} />
        <span>{message}</span>
      </div>
      {isAdminMsg && (
        <a
          href="/admin/login"
          style={{
            color: "#a94065",
            fontWeight: 600,
            textDecoration: "underline",
            fontSize: "12px",
            marginLeft: "26px",
          }}
        >
          <LogIn
            size={14}
            style={{ verticalAlign: "middle", marginRight: "5px" }}
          />
          Klik di sini untuk Masuk ke Portal Admin
        </a>
      )}
    </div>
  );
}
