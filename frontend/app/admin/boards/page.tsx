"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowsClockwise,
  CalendarBlank,
  Chalkboard,
  Info,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import { FormEvent, useState } from "react";
import {
  createBoard,
  deleteBoard,
  fetchBoards,
  fetchCalendar,
  updateBoard,
} from "@/lib/api";
import { useSeliStore } from "@/lib/store";
import type { BoardInventory, CalendarDay } from "@/lib/types";

export default function AdminBoardsPage() {
  const showToast = useSeliStore((state) => state.showToast);
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const [month, setMonth] = useState(currentMonthStr);
  const [boardName, setBoardName] = useState("");
  const [boardType, setBoardType] = useState("Papan Ucapan");
  const [loading, setLoading] = useState(false);

  const { data: boards = [], refetch: refetchBoards } = useQuery<BoardInventory[]>({
    queryKey: ["admin-boards-inventory"],
    queryFn: fetchBoards,
    refetchInterval: 5000,
  });

  const { data: calendar = [], isLoading: loadingCalendar } = useQuery<CalendarDay[]>({
    queryKey: ["admin-booking-calendar", month],
    queryFn: () => fetchCalendar(month),
    refetchInterval: 10000,
  });

  const handleCreateBoard = async (e: FormEvent) => {
    e.preventDefault();
    if (!boardName) return;
    setLoading(true);
    try {
      await createBoard({ boardName, boardType });
      showToast("Unit papan ucapan baru berhasil ditambahkan");
      setBoardName("");
      refetchBoards();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Gagal menambahkan unit board", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBoardStatus = async (board: BoardInventory) => {
    try {
      await updateBoard(board.id, { isActive: !board.isActive });
      showToast(`Status unit "${board.boardName}" diperbarui`);
      refetchBoards();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Gagal mengubah status", "error");
    }
  };

  const handleDeleteBoard = async (id: string, name: string) => {
    if (!confirm(`Hapus unit papan ucapan "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await deleteBoard(id);
      showToast("Unit board dihapus");
      refetchBoards();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Gagal menghapus unit board", "error");
    }
  };

  const activeBoards = boards.filter((b) => b.isActive).length;
  const inactiveBoards = boards.filter((b) => !b.isActive).length;
  const fullDays = calendar.filter((d) => (d.available ?? 0) === 0).length;
  const availableDays = calendar.filter((d) => (d.available ?? 0) > 0).length;

  return (
    <div className="admin-page-wrap">
      {/* ─── Header ─── */}
      <header className="admin-page-header">
        <div>
          <h1>Unit Papan Ucapan &amp; Kalender Sewa</h1>
          <p>
            Kelola unit fisik papan ucapan toko, status kesiapan pakai, serta pantau matriks ketersediaan sewa per tanggal.
          </p>
        </div>
        <div className="admin-header-actions">
          <button
            type="button"
            className="atelier-btn-secondary"
            onClick={() => refetchBoards()}
            title="Muat ulang unit papan"
          >
            <ArrowsClockwise size={15} weight="bold" />
            <span>Segarkan</span>
          </button>
        </div>
      </header>

      {/* ─── Atelier Operations Bar (Clean non-AI slop metrics) ─── */}
      <section className="atelier-operations-bar">
        <div className="atelier-metric-cell">
          <div className="metric-cell-label">
            <span>Total Inventaris Papan</span>
            <Chalkboard size={16} weight="regular" />
          </div>
          <div className="metric-cell-value-wrap">
            <span className="metric-cell-value">{boards.length}</span>
            <span className="metric-cell-sub">Unit Fisik</span>
          </div>
          <div>
            <span className="metric-cell-tag neutral">Terdaftar di Toko</span>
          </div>
        </div>

        <div className="atelier-metric-cell">
          <div className="metric-cell-label">
            <span>Unit Aktif Siap Sewa</span>
            <span style={{ color: "#166437", fontWeight: 700 }}>●</span>
          </div>
          <div className="metric-cell-value-wrap">
            <span className="metric-cell-value">{activeBoards}</span>
            <span className="metric-cell-sub">Unit</span>
          </div>
          <div>
            <span className="metric-cell-tag good">Siap Disewakan</span>
          </div>
        </div>

        <div className="atelier-metric-cell">
          <div className="metric-cell-label">
            <span>Unit Perbaikan / Nonaktif</span>
            <span style={{ color: "var(--admin-muted)" }}>○</span>
          </div>
          <div className="metric-cell-value-wrap">
            <span className="metric-cell-value">{inactiveBoards}</span>
            <span className="metric-cell-sub">Unit</span>
          </div>
          <div>
            <span className="metric-cell-tag warning">{inactiveBoards > 0 ? "Dalam Perawatan" : "Nihil"}</span>
          </div>
        </div>

        <div className="atelier-metric-cell">
          <div className="metric-cell-label">
            <span>Hari Tersedia ({month})</span>
            <CalendarBlank size={16} weight="regular" />
          </div>
          <div className="metric-cell-value-wrap">
            <span className="metric-cell-value">{availableDays}</span>
            <span className="metric-cell-sub">Hari Buka</span>
          </div>
          <div>
            <span className="metric-cell-tag neutral">{fullDays} Hari Penuh</span>
          </div>
        </div>
      </section>

      {/* ─── Two-Column Workstation ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.4fr", gap: "24px", alignItems: "start" }}>
        {/* Left: Add Form & Unit List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Add Board Unit */}
          <section className="atelier-panel">
            <div className="atelier-panel-header">
              <h2 className="atelier-panel-title">Tambah Unit Papan Baru</h2>
            </div>
            <form onSubmit={(e) => void handleCreateBoard(e)} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "var(--admin-surface-muted)", borderRadius: "8px", fontSize: "12px", color: "var(--admin-muted)" }}>
                <Info size={16} weight="regular" style={{ flexShrink: 0, color: "var(--admin-rose)" }} />
                <span>Unit yang aktif secara otomatis dihitung ke kapasitas sewa kalender harian.</span>
              </div>

              <div className="atelier-form-group">
                <label className="atelier-form-label">Nama / Kode Unit *</label>
                <input
                  type="text"
                  required
                  className="atelier-form-input"
                  placeholder="Contoh: Board Unit #01 (Ukuran 2×1.5m)"
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                />
              </div>

              <div className="atelier-form-group">
                <label className="atelier-form-label">Tipe / Kategori Papan</label>
                <input
                  type="text"
                  className="atelier-form-input"
                  placeholder="Standar, Pernikahan, Duka Cita, Wisuda..."
                  value={boardType}
                  onChange={(e) => setBoardType(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="atelier-btn-primary"
                disabled={loading}
                style={{ alignSelf: "flex-start", marginTop: "4px" }}
              >
                <Plus size={16} weight="bold" />
                <span>{loading ? "Menambahkan…" : "Tambah Unit Papan"}</span>
              </button>
            </form>
          </section>

          {/* Unit Inventory Table */}
          <section className="atelier-panel">
            <div className="atelier-panel-header">
              <h2 className="atelier-panel-title">Daftar Inventaris Unit ({boards.length})</h2>
            </div>
            <div className="atelier-table-wrap" style={{ border: "none", borderRadius: 0 }}>
              {boards.length === 0 ? (
                <div style={{ padding: "36px", textAlign: "center", color: "var(--admin-muted)", fontSize: "13px" }}>
                  Belum ada unit papan ucapan terdaftar.
                </div>
              ) : (
                <table className="atelier-table">
                  <thead>
                    <tr>
                      <th>Nama Unit</th>
                      <th>Kategori</th>
                      <th>Status Operasional</th>
                      <th style={{ textAlign: "right" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boards.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <strong>{b.boardName}</strong>
                        </td>
                        <td>
                          <span style={{ fontSize: "12px", color: "var(--admin-muted)" }}>
                            {b.boardType ?? "Standar"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`status-badge-pill ${b.isActive ? "badge-green" : "badge-gray"}`}
                            style={{ cursor: "pointer", border: "none" }}
                            onClick={() => void handleToggleBoardStatus(b)}
                            title={b.isActive ? "Klik untuk non-aktifkan" : "Klik untuk aktifkan"}
                          >
                            {b.isActive ? "● Siap Sewa" : "○ Non-Aktif"}
                          </button>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="atelier-btn-danger compact"
                            onClick={() => void handleDeleteBoard(b.id, b.boardName)}
                            title="Hapus unit"
                          >
                            <Trash size={13} weight="bold" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>

        {/* Right: Rental Matrix Calendar */}
        <section className="atelier-panel">
          <div className="atelier-panel-header">
            <div>
              <h2 className="atelier-panel-title">Kalender Ketersediaan Sewa</h2>
              <small style={{ color: "var(--admin-muted)", fontSize: "12px" }}>
                Kapasitas maksimum harian: {activeBoards} unit
              </small>
            </div>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="atelier-form-input"
              style={{ width: "auto", padding: "6px 12px", fontSize: "12.5px" }}
            />
          </div>

          <div style={{ padding: "20px" }}>
            {/* Legend */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "16px", fontSize: "12px", color: "var(--admin-muted)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: "#edf7f0", border: "1px solid #c6ebd2" }} />
                Tersedia Sewa
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: "#fdf2f2", border: "1px solid #facbcf" }} />
                Penuh Tersewa ({fullDays} hari)
              </span>
            </div>

            {/* Day Names */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", marginBottom: "8px", textAlign: "center", fontSize: "11px", fontWeight: 700, color: "var(--admin-muted)", textTransform: "uppercase" }}>
              {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {loadingCalendar ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--admin-muted)", fontSize: "13px" }}>
                Memuat matriks kalender…
              </div>
            ) : calendar.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--admin-muted)", fontSize: "13px" }}>
                Tidak ada data kalender untuk bulan {month}.
              </div>
            ) : (
              <div className="calendar-days-grid">
                {calendar.map((day, idx) => {
                  const isFull = (day.available ?? 0) === 0;

                  return (
                    <div
                      key={day.date ?? idx}
                      className={`calendar-day-card ${isFull ? "full" : "available"}`}
                      title={`Tanggal ${day.date}: ${day.bookedBoards ?? 0} tersewa. Sisa: ${day.available ?? 0}`}
                    >
                      <strong className="calendar-day-date">
                        {day.date ? String(day.date).slice(8) : ""}
                      </strong>
                      <span style={{ fontSize: "10.5px", color: "var(--admin-muted)" }}>
                        {day.bookedBoards ?? 0}/{day.totalBoards ?? 0}
                      </span>
                      <span className="calendar-day-status">
                        {isFull ? "Penuh" : `Sisa ${day.available ?? 0}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
