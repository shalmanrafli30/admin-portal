"use client";

import {useState, useEffect, useCallback} from "react";
import axios from "axios";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Plus, Search, Trash2, Edit, Loader2, ChevronLeft, ChevronRight, User, Briefcase} from "lucide-react";

interface Teacher {
	id: number;
	nip: string;
	name: string;
	subjectSpecialization: string;
}

export default function TeachersPage() {
	const router = useRouter();
	const [teachers, setTeachers] = useState<Teacher[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);

	const fetchTeachers = useCallback(async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				router.push("/login");
				return;
			}

			const res = await axios.get("https://api.meccaschool.online/api/admin/teachers", {
				headers: {Authorization: `Bearer ${token}`},
				params: {page, limit: 10, search}
			});

			const data = res.data;
			setTeachers(data.teachers || data.data || []);
			setTotalPages(data.totalPages || 1);
		} catch (error) {
			console.error("Gagal load guru:", error);
		} finally {
			setLoading(false);
		}
	}, [router, page, search]);

	useEffect(() => {
		const timer = setTimeout(() => {
			fetchTeachers();
		}, 500);
		return () => clearTimeout(timer);
	}, [search, page, fetchTeachers]);

	const handleDelete = async (id: number) => {
		if (!confirm("Yakin ingin menghapus guru ini? Akun login juga akan terhapus.")) return;
		try {
			const token = localStorage.getItem("token");
			await axios.delete(`https://api.meccaschool.online/api/admin/teachers/${id}`, {
				headers: {Authorization: `Bearer ${token}`}
			});
			alert("Guru berhasil dihapus.");
			fetchTeachers();
		} catch (error) {
			console.error(error);
			alert("Gagal menghapus guru");
		}
	};

	return (
		<div className="p-6 lg:p-8">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-800">Data Guru</h1>
					<p className="text-gray-500 text-sm">Kelola data pengajar dan akun login.</p>
				</div>
				<Link href="/teachers/add" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center shadow-sm">
					<Plus className="w-5 h-5 mr-2" /> Tambah Guru
				</Link>
			</div>

			<div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
					<input type="text" placeholder="Cari NIP atau Nama Guru..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition text-gray-700" value={search} onChange={(e) => setSearch(e.target.value)} />
				</div>
			</div>

			<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left">
						<thead className="bg-gray-50 border-b border-gray-200">
							<tr>
								<th className="px-6 py-4 font-semibold text-gray-600 text-sm w-16">No</th>
								<th className="px-6 py-4 font-semibold text-gray-600 text-sm">NIP</th>
								<th className="px-6 py-4 font-semibold text-gray-600 text-sm">Nama Lengkap</th>
								<th className="px-6 py-4 font-semibold text-gray-600 text-sm">Spesialisasi</th>
								<th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Aksi</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{loading ? (
								<tr>
									<td colSpan={5} className="px-6 py-8 text-center text-gray-500">
										<Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
										Loading...
									</td>
								</tr>
							) : teachers.length === 0 ? (
								<tr>
									<td colSpan={5} className="px-6 py-8 text-center text-gray-500">
										Data tidak ditemukan.
									</td>
								</tr>
							) : (
								teachers.map((teacher, idx) => (
									<tr key={teacher.id} className="hover:bg-gray-50 transition">
										<td className="px-6 py-4 text-gray-500">{(page - 1) * 10 + idx + 1}</td>
										<td className="px-6 py-4 font-mono text-gray-600">
											<span className="bg-gray-100 px-2 py-1 rounded text-xs">{teacher.nip}</span>
										</td>
										<td className="px-6 py-4">
											<div className="flex items-center gap-3">
												<div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
													<User className="w-4 h-4" />
												</div>
												<span className="font-medium text-gray-800">{teacher.name}</span>
											</div>
										</td>
										<td className="px-6 py-4">
											<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
												<Briefcase className="w-3 h-3 mr-1" />
												{teacher.subjectSpecialization}
											</span>
										</td>
										<td className="px-6 py-4 text-right">
											<div className="flex items-center justify-end gap-2">
												<Link href={`/teachers/${teacher.id}/edit`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
													<Edit className="w-4 h-4" />
												</Link>
												<button onClick={() => handleDelete(teacher.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
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
			</div>

			{!loading && teachers.length > 0 && (
				<div className="px-6 py-4 flex items-center justify-between mt-4 border-t border-gray-200">
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
	);
}
