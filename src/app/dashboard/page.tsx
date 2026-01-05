export default function AdminDashboard() {
	return (
		<div className="p-8">
			<h1 className="text-2xl font-bold text-gray-800 mb-4">Dashboard Overview</h1>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
					<h3 className="text-gray-500 text-sm font-medium">Total Siswa</h3>
					<p className="text-3xl font-bold text-indigo-600 mt-2">...</p>
				</div>
				<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
					<h3 className="text-gray-500 text-sm font-medium">Total Guru</h3>
					<p className="text-3xl font-bold text-indigo-600 mt-2">...</p>
				</div>
				<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
					<h3 className="text-gray-500 text-sm font-medium">Tagihan Pending</h3>
					<p className="text-3xl font-bold text-red-600 mt-2">...</p>
				</div>
			</div>

			<div className="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-100">
				<h2 className="font-bold text-blue-800">Selamat Datang, Admin!</h2>
				<p className="text-sm text-blue-600 mt-1">Gunakan menu di samping untuk mengelola Data Siswa, Guru, Jadwal, dan Verifikasi Pembayaran.</p>
			</div>
		</div>
	);
}
