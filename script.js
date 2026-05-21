// 1. DATABASE DEFAULT INITIALIZATION
const defaultRooms = [
    { id: 1, nama: "Masjid Utama Al-Ikhlas", status: "Tersedia", peminjam: "-", petugas: "-", log: "Sistem siap digunakan", otorisasi: "Belum" },
    { id: 2, nama: "Asrama Kampus Barat Lantai 1", status: "Tersedia", peminjam: "-", petugas: "-", log: "Sistem siap digunakan", otorisasi: "Belum" },
    { id: 3, nama: "Laboratorium Komputer & Multimedia", status: "Tersedia", peminjam: "-", petugas: "-", log: "Sistem siap digunakan", otorisasi: "Belum" }
];

const daftarSODTersedia = ["Ahmad SOD", "Zainal SOD", "Rizky SOD"];

let keys = JSON.parse(localStorage.getItem('kus_keys')) || defaultRooms;
let kas = parseFloat(localStorage.getItem('kus_kas')) || 0;
let userAktif = JSON.parse(localStorage.getItem('current_user')) || null;

function simpanDatabase() {
    localStorage.setItem('kus_keys', JSON.stringify(keys));
    localStorage.setItem('kus_kas', kas.toString());
}

function prosesLogout() {
    localStorage.removeItem('current_user');
    window.location.href = 'login.html';
}

window.addEventListener('DOMContentLoaded', () => {
    if (!userAktif && !window.location.href.includes('login.html') && !window.location.href.includes('index.html')) {
        window.location.href = 'login.html';
        return;
    }

    if (document.getElementById('user-logged-in')) {
        document.getElementById('user-logged-in').innerText = userAktif.username;
        updateMembershipUI();
        renderSantriGrid();
    }

    if (document.getElementById('user-logged-in-sod')) {
        document.getElementById('user-logged-in-sod').innerText = userAktif.username;
        renderSODTable();
    }

    if (document.getElementById('user-logged-in-guru')) {
        document.getElementById('user-logged-in-guru').innerText = userAktif.username;
        renderGuruTable();
    }
});

// ================= LOGIKA: SANTRI (TAMPILAN BERBEDA ANTAR-USER) =================
function updateMembershipUI() {
    const statusText = document.getElementById('member-status');
    const payBtn = document.getElementById('btn-buy');
    if (statusText) {
        if (userAktif && userAktif.isMember) {
            statusText.innerHTML = `🌟 AKTIF (Metode: <span style="color:#10b981; font-weight:800;">${userAktif.memberMethod}</span>)`;
            if (payBtn) payBtn.style.display = 'none';
        } else {
            statusText.innerText = "❌ Non-Member (Layanan Standar)";
            if (payBtn) payBtn.style.display = 'block';
        }
    }
}

function bukaModalBayar() { document.getElementById('payment-modal').style.display = 'flex'; }
function tutupModalBayar() { document.getElementById('payment-modal').style.display = 'none'; }

function eksekusiBayar(metode) {
    let users = JSON.parse(localStorage.getItem('pesantren_users')) || [];
    const idx = users.findIndex(u => u.username === userAktif.username);
    if (idx !== -1) {
        users[idx].isMember = true;
        users[idx].memberMethod = metode;
        localStorage.setItem('pesantren_users', JSON.stringify(users));
    }
    userAktif.isMember = true;
    userAktif.memberMethod = metode;
    localStorage.setItem('current_user', JSON.stringify(userAktif));
    kas += 10000;
    simpanDatabase();
    alert(`Pembayaran Rp 10.000 via [${metode}] Berhasil!`);
    tutupModalBayar();
    updateMembershipUI();
}

function renderSantriGrid() {
    const container = document.getElementById('santri-grid');
    if (!container) return;
    container.innerHTML = "";
    
    keys.forEach(k => {
        const card = document.createElement('div');
        card.className = "card";
        
        let statusBadge = `<span class="badge available">Tersedia</span>`;
        let btnAksi = `<button class="btn-card-action" style="background:#064e3b" onclick="requestPinjam(${k.id})">Ajukan Pinjam Kunci 🔑</button>`;
        
        // Pengecekan: Apakah user yang sedang login adalah si peminjam asli ruangan ini?
        const apakahSayaPeminjamnya = (k.peminjam === userAktif.username);

        if (k.status === 'Pending_Guru') {
            if (apakahSayaPeminjamnya) {
                statusBadge = `<span class="badge pending" style="background:#f59e0b; color:white;">⏳ Menunggu Konfirmasi Guru</span>`;
                btnAksi = `<button class="btn-card-action" style="background:#64748b; cursor:not-allowed" disabled>Menunggu Guru Menunjuk SOD...</button>`;
            } else {
                // Tampilan untuk Santri B (Orang lain)
                statusBadge = `<span class="badge pending" style="background:#475569; color:white;">🔒 Sedang Dalam Proses Peminjaman</span>`;
                btnAksi = `<button class="btn-card-action" style="background:#cbd5e1; color:#94a3b8; cursor:not-allowed" disabled>Ruangan Terkunci (Booking)</button>`;
            }
        } 
        else if (k.status === 'Pending_Buka') {
            if (apakahSayaPeminjamnya) {
                statusBadge = `<span class="badge pending" style="background:#3b82f6; color:white;">🧑‍✈️ Diteruskan ke SOD (${k.petugas})</span>`;
                btnAksi = `<button class="btn-card-action" style="background:#64748b; cursor:not-allowed" disabled>SOD Sedang Menuju Lokasi...</button>`;
            } else {
                statusBadge = `<span class="badge pending" style="background:#475569; color:white;">🔒 Sedang Dalam Proses Peminjaman</span>`;
                btnAksi = `<button class="btn-card-action" style="background:#cbd5e1; color:#94a3b8; cursor:not-allowed" disabled>Ruangan Terkunci (Booking)</button>`;
            }
        } 
        else if (k.status === 'Dipinjam') {
            if (apakahSayaPeminjamnya) {
                statusBadge = `<span class="badge borrowed">🔴 Sedang Kamu Gunakan</span>`;
                btnAksi = `<button class="btn-card-action" style="background:#dc2626" onclick="requestKembalikan(${k.id})">Kembalikan Kunci ↩</button>`;
            } else {
                statusBadge = `<span class="badge borrowed" style="background:#991b1b;">❌ Sedang Dipakai (${k.peminjam})</span>`;
                btnAksi = `<button class="btn-card-action" style="background:#cbd5e1; color:#94a3b8; cursor:not-allowed" disabled>Tidak Tersedia</button>`;
            }
        } 
        else if (k.status === 'Pending_Kunci') {
            if (apakahSayaPeminjamnya) {
                statusBadge = `<span class="badge pending">⌛ Menunggu SOD Mengunci</span>`;
                btnAksi = `<button class="btn-card-action" style="background:#64748b; cursor:not-allowed" disabled>Proses Pengembalian...</button>`;
            } else {
                statusBadge = `<span class="badge pending" style="background:#475569; color:white;">🔒 Sedang Dalam Proses Peminjaman</span>`;
                btnAksi = `<button class="btn-card-action" style="background:#cbd5e1; color:#94a3b8; cursor:not-allowed" disabled>Ruangan Terkunci (Booking)</button>`;
            }
        }
        
        card.innerHTML = `
            <h4>${k.nama}</h4>
            <div style="margin: 8px 0;">Status: ${statusBadge}</div>
            <p style="font-size:11px; margin-bottom: 12px;">Histori: <i>${k.log}</i></p>
            ${btnAksi}
        `;
        container.appendChild(card);
    });
}

function requestPinjam(id) {
    const k = keys.find(item => item.id === id);
    k.status = "Pending_Guru";
    k.peminjam = userAktif.username;
    k.log = `Santri (${userAktif.username}) memohon izin. Menunggu Guru menunjuk SOD.`;
    simpanDatabase();
    renderSantriGrid();
    alert("Permintaan berhasil dikirim! Sekarang status di akunmu 'Menunggu Konfirmasi Guru', dan ruangan dikunci untuk santri lain.");
}

function requestKembalikan(id) {
    const k = keys.find(item => item.id === id);
    k.status = "Pending_Kunci";
    k.log = `Santri (${userAktif.username}) selesai pakai. Menunggu SOD mengunci ruangan.`;
    simpanDatabase();
    renderSantriGrid();
    alert("Laporan selesai pakai berhasil dikirim!");
}

// ================= LOGIKA: GURU (EDIT & HAPUS RUANGAN AKTIF) =================
function renderGuruTable() {
    const tbody = document.getElementById('guru-table-body');
    const kasUI = document.getElementById('guru-kas');
    if (kasUI) kasUI.innerText = `Rp ${kas.toLocaleString('id-ID')}`;
    if (!tbody) return;
    tbody.innerHTML = "";
    
    keys.forEach((k, index) => {
        const tr = document.createElement('tr');
        
        let statusText = k.status;
        if(k.status === 'Pending_Guru') statusText = "⏳ Butuh SOD Lapangan";
        if(k.status === 'Pending_Buka') statusText = "🧑‍✈️ SOD Sedang OTW";
        
        // Pembuatan Tombol Aksi & Kontrol Manajemen Ruang (Edit + Hapus)
        let kolomTindakanAksi = `<div style="display:flex; flex-direction:column; gap:4px;">`;
        
        if (k.status === 'Pending_Guru') {
            kolomTindakanAksi += `<span style="font-size:11px; font-weight:bold; color:#475569;">Tugaskan SOD:</span>`;
            daftarSODTersedia.forEach(namaSOD => {
                kolomTindakanAksi += `<button class="btn-action-modern" style="background:#3b82f6; color:white; padding:3px 6px; font-size:10px;" onclick="guruTunjukSOD(${k.id}, '${namaSOD}')">➔ ${namaSOD}</button>`;
            });
        } else if (k.otorisasi === 'Pending') {
            kolomTindakanAksi += `<button class="btn-action-modern" style="background:#064e3b; color:white;" onclick="sahkanGuru(${k.id})">Sahkan Laporan 📑</button>`;
        } else {
            // Jika status ruangan sedang santai/tersedia, Guru bisa Edit atau Hapus Kelas ini
            kolomTindakanAksi += `
                <button class="btn-action-modern" style="background:#f59e0b; color:white; padding:4px 8px;" onclick="editRuanganOlehGuru(${k.id})">✏️ Edit Nama</button>
                <button class="btn-action-modern" style="background:#ef4444; color:white; padding:4px 8px;" onclick="hapusRuanganOlehGuru(${k.id})">🗑️ Hapus</button>
            `;
        }
        kolomTindakanAksi += `</div>`;

        let otoBadge = k.otorisasi === 'Selesai' ? `<span style="color:#10b981; font-weight:700;">✓ Sah</span>` : (k.otorisasi === 'Pending' ? `<span style="color:#ef4444; font-weight:700;">⚠ Butuh Sah</span>` : `<span style="color:#94a3b8">-</span>`);
        
        tr.innerHTML = `
            <td><strong>${k.nama}</strong></td>
            <td><span class="badge" style="background:#e2e8f0; color:#1e293b;">${statusText}</span></td>
            <td><strong>${k.peminjam}</strong></td>
            <td><strong>${k.petugas}</strong></td>
            <td><span style="font-size:11px; color:#64748b">${k.log}</span></td>
            <td>${otoBadge}</td>
            <td>${kolomTindakanAksi}</td>
        `;
        tbody.appendChild(tr);
    });
}

function guruTunjukSOD(id, namaSOD) {
    const k = keys.find(item => item.id === id);
    k.status = "Pending_Buka";
    k.petugas = namaSOD;
    k.log = `Guru menugaskan [${namaSOD}] ke lokasi untuk buka pintu.`;
    simpanDatabase();
    renderGuruTable();
    alert(`Tugas berhasil diteruskan ke ${namaSOD}!`);
}

function sahkanGuru(id) {
    const k = keys.find(item => item.id === id);
    k.otorisasi = "Selesai";
    k.peminjam = "-";
    k.petugas = "-";
    k.log = `Disahkan & diarsipkan oleh Guru.`;
    simpanDatabase();
    renderGuruTable();
    alert("Berkas disahkan!");
}

// FUNGSI EDIT KELAS OLEH GURU
function editRuanganOlehGuru(id) {
    const k = keys.find(item => item.id === id);
    const namaBaru = prompt("Masukkan nama baru untuk ruangan/kelas ini:", k.nama);
    if (namaBaru === null) return; // Batal
    
    if (namaBaru.trim() === "") {
        alert("Nama ruangan tidak boleh kosong!");
        return;
    }
    
    k.nama = namaBaru.trim();
    k.log = `Nama ruangan diubah menjadi "${k.nama}" oleh Guru.`;
    simpanDatabase();
    renderGuruTable();
    alert("Nama kelas berhasil diperbarui!");
}

// FUNGSI HAPUS KELAS OLEH GURU
function hapusRuanganOlehGuru(id) {
    const k = keys.find(item => item.id === id);
    if (confirm(`Apakah Anda yakin ingin menghapus kelas "${k.nama}" dari sistem?`)) {
        keys = keys.filter(item => item.id !== id);
        simpanDatabase();
        renderGuruTable();
        alert("Kelas berhasil dihapus dari sistem!");
    }
}

function tambahKunciOlehGuru() {
    const input = document.getElementById('input-kunci-baru');
    const nama = input.value.trim();
    if (!nama) return alert("Ketik nama ruangan baru!");
    const newId = keys.length > 0 ? keys[keys.length - 1].id + 1 : 1;
    keys.push({ id: newId, nama: nama, status: "Tersedia", peminjam: "-", petugas: "-", log: "Kelas terdaftar baru", otorisasi: "Belum" });
    simpanDatabase();
    input.value = "";
    renderGuruTable();
    alert(`Kelas "${nama}" Berhasil Ditambahkan!`);
}

function resetSistem() {
    if (confirm("Reset sistem?")) {
        localStorage.removeItem('kus_keys');
        localStorage.removeItem('kus_kas');
        location.reload();
    }
}

// ================= LOGIKA: PETUGAS SOD =================
function renderSODTable() {
    const tbody = document.getElementById('sod-table-body');
    if (!tbody) return;
    tbody.innerHTML = "";
    
    keys.forEach(k => {
        if (k.petugas !== userAktif.username) return; 
        if (k.status === 'Tersedia' || k.status === 'Dipinjam') return;
        
        const tr = document.createElement('tr');
        let aksiBtn = "";
        
        let usersList = JSON.parse(localStorage.getItem('pesantren_users')) || [];
        let dataPemohon = usersList.find(u => u.username === k.peminjam) || {};
        let tagPrioritas = dataPemohon.isMember ? `<mark style="background:#fef3c7; color:#d97706; padding:3px 6px; border-radius:4px; font-weight:700;">⚡ PRIORITAS</mark>` : "Normal";

        if (k.status === 'Pending_Buka') {
            aksiBtn = `<button class="btn-action-modern" style="background:#10b981; color:white;" onclick="eksekusiSOD(${k.id}, 'Buka')">Buka Pintu Terverifikasi ✅</button>`;
        } else if (k.status === 'Pending_Kunci') {
            aksiBtn = `<button class="btn-action-modern" style="background:#3b82f6; color:white;" onclick="eksekusiSOD(${k.id}, 'Kunci')">Kunci Ruangan Kembali 🔒</button>`;
        }
        
        tr.innerHTML = `
            <td><strong>${k.nama}</strong></td>
            <td><span class="badge pending">${k.status === 'Pending_Buka' ? 'Instruksi Guru: Buka' : 'Santri Selesai: Kunci'}</span></td>
            <td><strong>${k.peminjam}</strong><br><span style="font-size:11px;">Status: ${tagPrioritas}</span></td>
            <td>${aksiBtn}</td>
        `;
        tbody.appendChild(tr);
    });
    
    if (tbody.innerHTML === "") {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:40px;">☕ Tidak ada penugasan dari Guru.</td></tr>`;
    }
}

function eksekusiSOD(id, tipe) {
    const k = keys.find(item => item.id === id);
    if (tipe === 'Buka') {
        k.status = "Dipinjam";
        k.log = `Akses dibuka di lokasi oleh SOD (${userAktif.username}).`;
    } else {
        k.status = "Tersedia";
        k.log = `Ruangan dikunci kembali oleh SOD (${userAktif.username}). Menunggu validasi Guru.`;
        k.otorisasi = "Pending";
    }
    simpanDatabase();
    renderSODTable();
    alert("Data sirkulasi lapangan berhasil dikirim!");
}