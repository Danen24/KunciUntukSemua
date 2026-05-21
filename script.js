// 1. DATABASE DEFAULT INITIALIZATION
const defaultRooms = [
    { id: 1, nama: "Masjid Utama Al-Ikhlas", status: "Tersedia", peminjam: "-", petugas: "-", log: "Sistem siap digunakan", otorisasi: "Belum" },
    { id: 2, nama: "Asrama Kampus Barat Lantai 1", status: "Tersedia", peminjam: "-", petugas: "-", log: "Sistem siap digunakan", otorisasi: "Belum" },
    { id: 3, nama: "Laboratorium Komputer & Multimedia", status: "Tersedia", peminjam: "-", petugas: "-", log: "Sistem siap digunakan", otorisasi: "Belum" }
];

// Ambil data ruangan dan kas
let keys = JSON.parse(localStorage.getItem('kus_keys')) || defaultRooms;
let kas = parseFloat(localStorage.getItem('kus_kas')) || 0;

// Ambil sesi user yang sedang login saat ini
let userAktif = JSON.parse(localStorage.getItem('current_user')) || null;

function simpanDatabase() {
    localStorage.setItem('kus_keys', JSON.stringify(keys));
    localStorage.setItem('kus_kas', kas.toString());
}

// 2. FUNGSI LOGOUT (Sistem Keluar)
function prosesLogout() {
    localStorage.removeItem('current_user');
    window.location.href = 'login.html';
}

// 3. PROSES SINKRONISASI SAAT HALAMAN SELESAI DI-LOAD
window.addEventListener('DOMContentLoaded', () => {
    // Proteksi halaman: Jika tidak ada user login, tendang balik ke login.html
    if (!userAktif && !window.location.href.includes('login.html') && !window.location.href.includes('index.html')) {
        window.location.href = 'login.html';
        return;
    }

    // A. JIKA DI DASHBOARD SANTRI
    if (document.getElementById('user-logged-in')) {
        document.getElementById('user-logged-in').innerText = userAktif.username;
        updateMembershipUI();
        renderSantriGrid();
    }

    // B. JIKA DI DASHBOARD SOD
    if (document.getElementById('user-logged-in-sod')) {
        document.getElementById('user-logged-in-sod').innerText = userAktif.username;
        renderSODTable();
    }

    // C. JIKA DI DASHBOARD GURU
    if (document.getElementById('user-logged-in-guru')) {
        document.getElementById('user-logged-in-guru').innerText = userAktif.username;
        renderGuruTable();
    }
});

// ================= LOGIKA UTAMA: SANTRI =================
function updateMembershipUI() {
    const statusText = document.getElementById('member-status');
    const payBtn = document.getElementById('btn-buy');
    
    if (userAktif && userAktif.isMember) {
        statusText.innerHTML = `🌟 AKTIF (Metode: <span style="color:#10b981; font-weight:800;">${userAktif.memberMethod}</span>)`;
        if (payBtn) payBtn.style.display = 'none';
    } else {
        if (statusText) statusText.innerText = "❌ Non-Member (Layanan Standar)";
        if (payBtn) payBtn.style.display = 'block';
    }
}

function bukaModalBayar() {
    document.getElementById('payment-modal').style.display = 'flex';
}

function tutupModalBayar() {
    document.getElementById('payment-modal').style.display = 'none';
}

function eksekusiBayar(metode) {
    // Update data di daftar user lokal browser
    let users = JSON.parse(localStorage.getItem('pesantren_users')) || [];
    const idx = users.findIndex(u => u.username === userAktif.username);
    
    if (idx !== -1) {
        users[idx].isMember = true;
        users[idx].memberMethod = metode;
        localStorage.setItem('pesantren_users', JSON.stringify(users));
    }
    
    // Update data session aktif
    userAktif.isMember = true;
    userAktif.memberMethod = metode;
    localStorage.setItem('current_user', JSON.stringify(userAktif));
    
    // Tambah kas pesantren
    kas += 10000;
    simpanDatabase();
    
    alert(`Pembayaran Rp 10.000 via [${metode}] Berhasil! Status Prioritas Anda Aktif.`);
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
        
        if (k.status === 'Dipinjam') {
            statusBadge = `<span class="badge borrowed">Dipinjam (${k.peminjam})</span>`;
            btnAksi = `<button class="btn-card-action" style="background:#dc2626" onclick="requestKembalikan(${k.id})">Kembalikan Kunci ↩</button>`;
        } else if (k.status === 'Pending_Buka' || k.status === 'Pending_Kunci') {
            statusBadge = `<span class="badge pending">Menunggu SOD Lapangan</span>`;
            btnAksi = `<button class="btn-card-action" style="background:#64748b; cursor:not-allowed" disabled>Sedang Diproses SOD...</button>`;
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
    k.status = "Pending_Buka";
    k.peminjam = userAktif.username;
    k.log = `Santri (${userAktif.username}) meminta ruangan dibuka.`;
    simpanDatabase();
    renderSantriGrid();
    alert("Permintaan berhasil dikirim ke Petugas SOD!");
}

function requestKembalikan(id) {
    const k = keys.find(item => item.id === id);
    k.status = "Pending_Kunci";
    k.log = `Santri (${userAktif.username}) selesai memakai ruangan. Menunggu dikunci.`;
    simpanDatabase();
    renderSantriGrid();
    alert("Laporan selesai pakai terkirim! Petugas SOD akan segera mengunci ruangan.");
}

// ================= LOGIKA UTAMA: PETUGAS SOD =================
function renderSODTable() {
    const tbody = document.getElementById('sod-table-body');
    if (!tbody) return;
    tbody.innerHTML = "";
    
    keys.forEach(k => {
        if (k.status === 'Tersedia' || k.status === 'Dipinjam') return;
        
        const tr = document.createElement('tr');
        let aksiBtn = "";
        
        let usersList = JSON.parse(localStorage.getItem('pesantren_users')) || [];
        let dataPemohon = usersList.find(u => u.username === k.peminjam) || {};
        let tagPrioritas = dataPemohon.isMember ? `<mark style="background:#fef3c7; color:#d97706; padding:3px 6px; border-radius:4px; font-weight:700;">⚡ PRIORITAS (${dataPemohon.memberMethod})</mark>` : "<span style='color:#94a3b8'>Normal</span>";

        if (k.status === 'Pending_Buka') {
            aksiBtn = `<button class="btn-action-modern" style="background:#10b981; color:white;" onclick="eksekusiSOD(${k.id}, 'Buka')">Konfirmasi Buka Pintu ✅</button>`;
        } else if (k.status === 'Pending_Kunci') {
            aksiBtn = `<button class="btn-action-modern" style="background:#3b82f6; color:white;" onclick="eksekusiSOD(${k.id}, 'Kunci')">Konfirmasi Kunci Ruang 🔒</button>`;
        }
        
        tr.innerHTML = `
            <td><strong>${k.nama}</strong></td>
            <td><span class="badge pending">${k.status === 'Pending_Buka' ? 'Butuh Akses Masuk' : 'Butuh Penguncian'}</span></td>
            <td><strong>${k.peminjam}</strong><br><span style="font-size:11px;">Status: ${tagPrioritas}</span></td>
            <td>${aksiBtn}</td>
        `;
        tbody.appendChild(tr);
    });
    
    if (tbody.innerHTML === "") {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:40px;">☕ Semua tugas lapangan selesai. Tidak ada antrean!</td></tr>`;
    }
}

function eksekusiSOD(id, tipe) {
    const k = keys.find(item => item.id === id);
    k.petugas = userAktif.username;
    
    if (tipe === 'Buka') {
        k.status = "Dipinjam";
        k.log = `Akses diberikan. Pintu dibuka oleh SOD (${userAktif.username}).`;
    } else {
        k.status = "Tersedia";
        k.log = `Ruangan selesai divalidasi & dikunci kembali oleh SOD (${userAktif.username}).`;
        k.otorisasi = "Pending";
    }
    simpanDatabase();
    renderSODTable();
    alert("Validasi lapangan sukses diperbarui!");
}

// ================= LOGIKA UTAMA: GURU =================
function renderGuruTable() {
    const tbody = document.getElementById('guru-table-body');
    const kasUI = document.getElementById('guru-kas');
    if (kasUI) kasUI.innerText = `Rp ${kas.toLocaleString('id-ID')}`;
    if (!tbody) return;
    tbody.innerHTML = "";
    
    keys.forEach(k => {
        const tr = document.createElement('tr');
        let statusBadge = `<span class="badge available">Kosong</span>`;
        if (k.status === 'Dipinjam') statusBadge = `<span class="badge borrowed">Digunakan</span>`;
        if (k.status.startsWith('Pending')) statusBadge = `<span class="badge pending">Menunggu SOD</span>`;
        
        let otoBadge = k.otorisasi === 'Selesai' ? `<span style="color:#10b981; font-weight:700;">✓ Sah & Aman</span>` : `<span style="color:#94a3b8">-</span>`;
        let aksiBtn = `<span style="color:#cbd5e1">-</span>`;
        
        if (k.otorisasi === 'Pending') {
            otoBadge = `<span style="color:#ef4444; font-weight:700;">⚠ Butuh Validasi</span>`;
            aksiBtn = `<button class="btn-action-modern" style="background:#064e3b; color:white; padding:6px 12px;" onclick="sahkanGuru(${k.id})">Sahkan 📑</button>`;
        }
        
        tr.innerHTML = `
            <td><strong>${k.nama}</strong></td>
            <td>${statusBadge}</td>
            <td>${k.peminjam}</td>
            <td>${k.petugas}</td>
            <td><span style="font-size:12px; color:#64748b">${k.log}</span></td>
            <td>${otoBadge}</td>
            <td>${aksiBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

function sahkanGuru(id) {
    const k = keys.find(item => item.id === id);
    k.otorisasi = "Selesai";
    k.peminjam = "-";
    k.petugas = "-";
    k.log = `Laporan resmi ditutup dan disahkan oleh Guru (${userAktif.username}).`;
    simpanDatabase();
    renderGuruTable();
    alert("Laporan kerja sirkulasi kunci resmi diarsipkan & disahkan!");
}

function tambahKunciOlehGuru() {
    const input = document.getElementById('input-kunci-baru');
    const nama = input.value.trim();
    if (!nama) return alert("Silakan tulis nama ruangan terlebih dahulu!");
    
    const newId = keys.length > 0 ? keys[keys.length - 1].id + 1 : 1;
    keys.push({ id: newId, nama: nama, status: "Tersedia", peminjam: "-", petugas: "-", log: "Kunci ruang terdaftar baru", otorisasi: "Belum" });
    simpanDatabase();
    input.value = "";
    renderGuruTable();
    alert(`Ruangan "${nama}" berhasil didaftarkan ke sistem!`);
}

function resetSistem() {
    if (confirm("Peringatan! Ini akan menghapus seluruh rekapan kas, log, dan riwayat sistem. Lanjutkan?")) {
        localStorage.removeItem('kus_keys');
        localStorage.removeItem('kus_kas');
        location.reload();
    }
}