'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import {
  createBoard,
  deleteBoard,
  fetchBoards,
  fetchCalendar,
  updateBoard,
} from '@/lib/api';
import { useSeliStore } from '@/lib/store';
import type { BoardInventory, CalendarDay } from '@/lib/types';

export default function AdminBoardsPage() {
  const showToast = useSeliStore((state) => state.showToast);
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM

  const [month, setMonth] = useState(currentMonthStr);
  const [boardName, setBoardName] = useState('');
  const [boardType, setBoardType] = useState('Papan Ucapan');
  const [loading, setLoading] = useState(false);

  const { data: boards = [], refetch: refetchBoards } = useQuery<BoardInventory[]>({
    queryKey: ['admin-boards-inventory'],
    queryFn: fetchBoards,
    refetchInterval: 3000,
  });

  const { data: calendar = [] } = useQuery<CalendarDay[]>({
    queryKey: ['admin-booking-calendar', month],
    queryFn: () => fetchCalendar(month),
    refetchInterval: 3000,
  });

  const handleCreateBoard = async (e: FormEvent) => {
    e.preventDefault();
    if (!boardName) return;
    setLoading(true);
    try {
      await createBoard({ boardName, boardType });
      showToast('Unit papan ucapan baru berhasil ditambahkan');
      setBoardName('');
      refetchBoards();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menambahkan unit board', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBoardStatus = async (board: BoardInventory) => {
    try {
      await updateBoard(board.id, { isActive: !board.isActive });
      showToast(`Status unit ${board.boardName} diperbarui`);
      refetchBoards();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal mengubah status', 'error');
    }
  };

  const handleDeleteBoard = async (id: string) => {
    if (!confirm('Hapus unit papan ucapan ini?')) return;
    try {
      await deleteBoard(id);
      showToast('Unit board dihapus');
      refetchBoards();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menghapus unit board', 'error');
    }
  };

  return (
    <div className="admin-boards-page">
      <header className="admin-page-header">
        <div>
          <h1>Unit Papan Ucapan &amp; Kalender Sewa</h1>
          <p>Kelola inventaris fisik papan ucapan dan pantau ketersediaan sewa per tanggal.</p>
        </div>
      </header>

      <div className="admin-two-cols">
        {/* Board Creation Form & List */}
        <div className="left-col">
          <form className="admin-card-form" onSubmit={(e) => void handleCreateBoard(e)}>
            <h3>Tambah Unit Papan Ucapan (Board)</h3>
            <label>
              Nama Kode Unit *
              <input
                required
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="Board Unit #01 (Ukuran 2x1.5m)"
              />
            </label>

            <label>
              Tipe / Kategori Board
              <input
                value={boardType}
                onChange={(e) => setBoardType(e.target.value)}
                placeholder="Papan Standar Pernikahan / Duka Cita"
              />
            </label>

            <button type="submit" className="primary-button" disabled={loading}>
              <Plus size={16} /> {loading ? 'Menambahkan…' : 'Tambah Unit Board'}
            </button>
          </form>

          <div className="admin-table-card" style={{ marginTop: '20px' }}>
            <h3>Daftar Unit Fisik Papan ({boards.length})</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Kode Unit</th>
                  <th>Tipe</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {boards.map((b) => (
                  <tr key={b.id}>
                    <td><strong>{b.boardName}</strong></td>
                    <td>{b.boardType ?? '-'}</td>
                    <td>
                      <button
                        className={`badge-chip ${b.isActive ? 'active' : 'inactive'}`}
                        onClick={() => void handleToggleBoardStatus(b)}
                      >
                        {b.isActive ? 'Aktif' : 'Non-Aktif'}
                      </button>
                    </td>
                    <td>
                      <button
                        className="table-action-btn danger"
                        onClick={() => void handleDeleteBoard(b.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calendar View */}
        <div className="right-col">
          <div className="admin-table-card">
            <div className="calendar-header">
              <h3><CalendarIcon size={18} /> Kalender Sewa Papan</h3>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="admin-month-picker"
              />
            </div>

            <div className="calendar-days-grid">
              {calendar.map((day, idx) => (
                <div
                  key={day.date ?? idx}
                  className={`calendar-day-cell ${day.available === 0 ? 'full' : 'available'}`}
                >
                  <strong className="day-date">{day.date ? String(day.date).slice(8) : ''}</strong>
                  <span className="day-info">Tersewa: {day.bookedBoards ?? 0} / {day.totalBoards ?? 0}</span>
                  <span className="day-avail">Sisa: <strong>{day.available ?? 0}</strong></span>
                </div>
              ))}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
