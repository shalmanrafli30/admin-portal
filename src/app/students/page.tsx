"use client";

import {useState, useEffect} from "react";
import axios from "axios";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Plus, Search, Trash2, Loader2, ChevronLeft, ChevronRight, Edit, TrendingUp} from "lucide-react";

// Define the Student interface
interface Student {
	id: number;
	nis: string;
	name: string;
	parentName: string;
	isActive: boolean;
	Class?: {
		name: string;
	};
}

export default function StudentsPage() {
	const router = useRouter();
	// Use the Student interface instead of any
	const [students, setStudents] = useState<Student[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);

	const fetchStudents = async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				router.push("/login");
				return;
			}

			const res = await axios.get("https://api.meccaschool.online/api/admin/students", {
				headers: {Authorization: `Bearer ${token}`},
				params: {page, limit: 10, search}
			});

			const data = res.data;
			// Handle format response yang mungkin beda (langsung array atau object pagination)
			setStudents(data.students || data.data || []);
			setTotalPages(data.totalPages || 1);
		} catch (error) {
			console.error("Gagal load siswa:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		const timer = setTimeout(() => {
			fetchStudents();
		}, 500); // Debounce search
		return () => clearTimeout(timer);
	}, [search, page]);

	const handleDelete = async (id: number) => {
		if (!confirm("Yakin ingin menghapus siswa ini? Akun dan data nilai akan terhapus permanen dari semua service.")) return;

		try {
			const token = localStorage.getItem("token");
			await axios.delete(`https://api.meccaschool.online/api/admin/students/${id}`, {
				headers: {Authorization: `Bearer ${token}`}
			});
			alert("Siswa berhasil dihapus dan disinkronisasi.");
			fetchStudents();
		} catch (error) {
			alert("Gagal menghapus siswa");
			console.error(error);
		}
	};

	// [BARU] Fungsi Naik Kelas
	const handlePromote = async (id: number, name: string) => {
		if (!confirm(`Naikkan kelas untuk siswa ${name}? Pastikan kelas tingkat selanjutnya sudah tersedia.`)) return;

		try {
			const token = localStorage.getItem("token");
			await axios.post(
				`https://api.meccaschool.online/api/admin/students/${id}/promote`,
				{},
				{
					headers: {Authorization: `Bearer ${token}`}
				}
			);
			alert(`Berhasil! Siswa ${name} telah dinaikkan ke tingkat selanjutnya.`);
			fetchStudents(); // Refresh list
		} catch (error: unknown) {
			console.error(error);
			let errorMessage = "Terjadi kesalahan.";
			if (axios.isAxiosError(error)) {
				errorMessage = error.response?.data?.message || error.message;
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}
			alert(`Gagal menaikkan kelas: ${errorMessage}`);
		}
	};

	return (
		<div className="p-6 lg:p-8">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-800">Data Siswa</h1>
					<p className="text-gray-500 text-sm">Kelola data siswa, akun, dan status aktif.</p>
				</div>
				<Link href="/students/add" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center shadow-sm">
					<Plus className="w-5 h-5 mr-2" /> Tambah Siswa
				</Link>
			</div>

			{/* Filter & Search */}
			<div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
					<input type="text" placeholder="Cari nama atau NIS..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-gray-700" value={search} onChange={(e) => setSearch(e.target.value)} />
				</div>
			</div>

			{/* Table */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left">
						<thead className="bg-gray-50 border-b border-gray-200">
							<tr>
								<th className="px-6 py-4 font-semibold text-gray-600 text-sm">Siswa</th>
								<th className="px-6 py-4 font-semibold text-gray-600 text-sm">NIS</th>
								<th className="px-6 py-4 font-semibold text-gray-600 text-sm">Kelas</th>
								<th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
								<th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Aksi</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{loading ? (
								<tr>
									<td colSpan={5} className="px-6 py-8 text-center text-gray-500">
										<Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
										Memuat data...
									</td>
								</tr>
							) : students.length === 0 ? (
								<tr>
									<td colSpan={5} className="px-6 py-8 text-center text-gray-500">
										Data tidak ditemukan.
									</td>
								</tr>
							) : (
								students.map((student) => (
									<tr key={student.id} className="hover:bg-gray-50 transition">
										<td className="px-6 py-4">
											<div className="flex items-center gap-3">
												<div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">{student.name.charAt(0)}</div>
												<div>
													<p className="font-medium text-gray-800">{student.name}</p>
													<p className="text-xs text-gray-500">{student.parentName || "Wali tidak ada"}</p>
												</div>
											</div>
										</td>
										<td className="px-6 py-4 text-gray-600 font-mono text-sm">{student.nis}</td>
										<td className="px-6 py-4">{student.Class ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{student.Class.name}</span> : <span className="text-gray-400 text-sm italic">Belum masuk kelas</span>}</td>
										<td className="px-6 py-4">
											<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{student.isActive ? "Aktif" : "Non-Aktif"}</span>
										</td>
										<td className="px-6 py-4 text-right">
											<div className="flex items-center justify-end gap-2">
												{/* Tombol Naik Kelas */}
												<button onClick={() => handlePromote(student.id, student.name)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition" title="Naik Kelas">
													<TrendingUp className="w-4 h-4" />
												</button>

												{/* Tombol Edit */}
												<Link href={`/students/${student.id}/edit`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit Siswa">
													<Edit className="w-4 h-4" />
												</Link>

												{/* Tombol Hapus */}
												<button onClick={() => handleDelete(student.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Hapus Siswa">
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{!loading && students.length > 0 && (
					<div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
						<p className="text-sm text-gray-500">
							Halaman {page} dari {totalPages}
						</p>
						<div className="flex gap-2">
							<button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
								<ChevronLeft className="w-4 h-4 text-gray-600" />
							</button>
							<button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
								<ChevronRight className="w-4 h-4 text-gray-600" />
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
