/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {useState, useEffect, useCallback} from "react";
import axios from "axios";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Plus, Search, Trash2, Edit, Loader2, ChevronLeft, ChevronRight, CheckCircle, XCircle, TrendingUp, X} from "lucide-react";

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

	// Data State
	const [students, setStudents] = useState<Student[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);

	// Modal Approve State
	const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
	const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
	const [selectedLevel, setSelectedLevel] = useState(7); // Default level 7 (SMP)
	const [processing, setProcessing] = useState(false);

	const createApi = useCallback(() => {
		const token = localStorage.getItem("token");
		if (!token) {
			router.push("/login");
			throw new Error("No token");
		}
		return axios.create({
			baseURL: "https://api.meccaschool.online/api/admin",
			headers: {Authorization: `Bearer ${token}`}
		});
	}, [router]);

	// Fetch Data
	const fetchStudents = useCallback(async () => {
		setLoading(true);
		try {
			const api = createApi();
			const res = await api.get("/students", {
				params: {page, limit: 10, search}
			});
			const data = res.data;
			setStudents(data.students || data.data || []);
			setTotalPages(data.totalPages || 1);
		} catch (error) {
			console.error("Gagal load siswa:", error);
		} finally {
			setLoading(false);
		}
	}, [page, search, createApi]);

	useEffect(() => {
		const timer = setTimeout(() => {
			fetchStudents();
		}, 500);
		return () => clearTimeout(timer);
	}, [search, page, fetchStudents]);

	// Handle Delete
	const handleDelete = async (id: number) => {
		if (!confirm("Yakin ingin menghapus siswa ini? Data akan hilang permanen.")) return;
		try {
			const api = createApi();
			await api.delete(`/students/${id}`);
			alert("Siswa berhasil dihapus.");
			fetchStudents();
		} catch (error) {
			if (error) {
				alert("Gagal menghapus siswa");
			}
		}
	};

	// --- LOGIC APPROVE ---

	// 1. Buka Modal
	const openApproveModal = (student: Student) => {
		setSelectedStudent(student);
		setSelectedLevel(7); // Reset ke default
		setIsApproveModalOpen(true);
	};

	// 2. Submit Approval
	const handleApproveSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedStudent) return;

		setProcessing(true);
		try {
			const api = createApi();
			// Panggil endpoint approveStudent
			await api.post(`/students/${selectedStudent.id}/approve`, {
				level: Number(selectedLevel)
			});

			alert(`Sukses! ${selectedStudent.name} telah diaktifkan dan masuk ke kelas.`);
			setIsApproveModalOpen(false);
			fetchStudents(); // Refresh data agar status berubah jadi Aktif
		} catch (error: any) {
			console.error(error);
			alert(`Gagal approve: ${error.response?.data?.message || error.message}`);
		} finally {
			setProcessing(false);
		}
	};

	// 3. Logic Promote (Naik Kelas Manual - jika perlu)
	const handlePromote = async (id: number, name: string) => {
		if (!confirm(`Naikkan kelas untuk siswa ${name}?`)) return;
		try {
			const api = createApi();
			await api.post(`/students/${id}/promote`);
			alert("Siswa berhasil naik kelas.");
			fetchStudents();
		} catch (error: any) {
			alert(`Gagal: ${error.response?.data?.message}`);
		}
	};

	return (
		<div className="p-6 lg:p-8">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-800">Data Siswa</h1>
					<p className="text-gray-500 text-sm">Kelola data siswa, aktivasi akun, dan kenaikan kelas.</p>
				</div>
				<Link href="/students/add" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center shadow-sm">
					<Plus className="w-5 h-5 mr-2" /> Tambah Siswa
				</Link>
			</div>

			{/* Search */}
			<div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
					<input type="text" placeholder="Cari nama atau NIS..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition text-gray-700" value={search} onChange={(e) => setSearch(e.target.value)} />
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
											{student.isActive ? (
												<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
													<CheckCircle className="w-3 h-3 mr-1" /> Aktif
												</span>
											) : (
												<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
													<XCircle className="w-3 h-3 mr-1" /> Non-Aktif
												</span>
											)}
										</td>
										<td className="px-6 py-4 text-right">
											<div className="flex items-center justify-end gap-2">
												{/* TOMBOL APPROVE (Hanya muncul jika Non-Aktif) */}
												{!student.isActive && (
													<button onClick={() => openApproveModal(student)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 shadow-sm flex items-center" title="Approve & Aktivasi Siswa">
														<CheckCircle className="w-3 h-3 mr-1" /> Aktivasi
													</button>
												)}

												{/* TOMBOL NAIK KELAS (Hanya muncul jika Aktif) */}
												{student.isActive && (
													<button onClick={() => handlePromote(student.id, student.name)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition" title="Naik Kelas">
														<TrendingUp className="w-4 h-4" />
													</button>
												)}

												<Link href={`/students/${student.id}/edit`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
													<Edit className="w-4 h-4" />
												</Link>
												<button onClick={() => handleDelete(student.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
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
							<button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
								<ChevronLeft className="w-4 h-4 text-gray-600" />
							</button>
							<button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
								<ChevronRight className="w-4 h-4 text-gray-600" />
							</button>
						</div>
					</div>
				)}
			</div>

			{/* --- MODAL APPROVE STUDENT --- */}
			{isApproveModalOpen && selectedStudent && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
					<div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
						<button onClick={() => setIsApproveModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
							<X className="w-5 h-5" />
						</button>

						<h2 className="text-xl font-bold text-gray-800 mb-2">Aktivasi Siswa</h2>
						<p className="text-sm text-gray-500 mb-4">
							Pilih jenjang kelas untuk menempatkan <strong>{selectedStudent.name}</strong>. Sistem akan mencarikan kelas yang tersedia.
						</p>

						<form onSubmit={handleApproveSubmit} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Pilih Jenjang (Level)</label>
								<select className="w-full border p-2.5 rounded-lg text-gray-700 bg-white focus:ring-2 focus:ring-indigo-500 outline-none" value={selectedLevel} onChange={(e) => setSelectedLevel(Number(e.target.value))}>
									<option value="7">Kelas 7</option>
									<option value="8">Kelas 8</option>
									<option value="9">Kelas 9</option>
									<option value="10">Kelas 10 (SMA)</option>
									<option value="11">Kelas 11 (SMA)</option>
									<option value="12">Kelas 12 (SMA)</option>
								</select>
								<p className="text-xs text-gray-400 mt-1">*Tagihan awal siswa ini akan otomatis ditandai Lunas setelah aktivasi.</p>
							</div>

							<button type="submit" disabled={processing} className="w-full bg-green-600 text-white font-bold py-2.5 rounded-lg hover:bg-green-700 disabled:bg-green-300 mt-2 flex justify-center items-center shadow-md">
								{processing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Proses Aktivasi"}
							</button>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
