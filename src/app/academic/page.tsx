"use client";

import {useState, useEffect, useCallback} from "react";
import axios from "axios";
import {useRouter} from "next/navigation";
import {BookOpen, Layers, Plus, Edit, Trash2, X, Loader2, ChevronLeft, ChevronRight} from "lucide-react";

interface ClassItem {
	id: number;
	name: string;
	level: number;
	capacity: number;
}

interface SubjectItem {
	id: number;
	name: string;
	code: string;
	level: number;
}

// Define a union type for the item being edited
type AcademicItem = ClassItem | SubjectItem;

export default function AcademicPage() {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<"classes" | "subjects">("classes");

	// Data State
	const [classes, setClasses] = useState<ClassItem[]>([]);
	const [subjects, setSubjects] = useState<SubjectItem[]>([]);
	const [loading, setLoading] = useState(true);

	// Pagination State
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	// Modal State
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<"create" | "edit">("create");
	const [currentItem, setCurrentItem] = useState<AcademicItem | null>(null); // Data yang sedang diedit
	const [saving, setSaving] = useState(false);

	// Form State
	const [formData, setFormData] = useState({
		name: "",
		level: "" as string | number,
		code: "", // Khusus Subject
		capacity: "" as string | number // Khusus Class
	});

	// Helper API
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
	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const api = createApi();
			// [UPDATE] Tambahkan limit=1000 agar semua data terambil untuk client-side pagination
			if (activeTab === "classes") {
				const res = await api.get("/classes", {params: {limit: 1000}});
				console.log("Classes API Response:", res.data); // Debug Log

				let data: ClassItem[] = [];
				// Cek berbagai kemungkinan struktur response
				if (res.data && Array.isArray(res.data.classes)) {
					data = res.data.classes;
				} else if (res.data && Array.isArray(res.data.data)) {
					data = res.data.data;
				} else if (Array.isArray(res.data)) {
					data = res.data;
				}
				setClasses(data);
			} else {
				const res = await api.get("/subjects", {params: {limit: 1000}});
				console.log("Subjects API Response:", res.data); // Debug Log

				let data: SubjectItem[] = [];
				// Cek berbagai kemungkinan struktur response
				if (res.data && Array.isArray(res.data.subjects)) {
					data = res.data.subjects;
				} else if (res.data && Array.isArray(res.data.data)) {
					data = res.data.data;
				} else if (Array.isArray(res.data)) {
					data = res.data;
				}
				setSubjects(data);
			}
		} catch (error) {
			console.error("Gagal load data", error);
		} finally {
			setLoading(false);
		}
	}, [activeTab, createApi]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Reset pagination when tab changes
	useEffect(() => {
		setCurrentPage(1);
	}, [activeTab]);

	// Handle Modal Open
	const openModal = (mode: "create" | "edit", item?: AcademicItem) => {
		setModalMode(mode);
		setCurrentItem(item || null);

		if (mode === "edit" && item) {
			setFormData({
				name: item.name,
				level: item.level,
				code: "code" in item ? item.code : "",
				capacity: "capacity" in item ? item.capacity : ""
			});
		} else {
			setFormData({name: "", level: "", code: "", capacity: ""});
		}
		setIsModalOpen(true);
	};

	// Handle Submit (Create/Update)
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			const api = createApi();
			const endpoint = activeTab === "classes" ? "/classes" : "/subjects";

			if (modalMode === "create") {
				await api.post(endpoint, formData);
				alert(`Berhasil menambah ${activeTab === "classes" ? "Kelas" : "Mapel"}`);
			} else {
				if (currentItem) {
					await api.put(`${endpoint}/${currentItem.id}`, formData);
					alert(`Berhasil update ${activeTab === "classes" ? "Kelas" : "Mapel"}`);
				}
			}

			setIsModalOpen(false);
			fetchData(); // Refresh data
		} catch (error: unknown) {
			let errorMessage = "Terjadi kesalahan.";
			if (axios.isAxiosError(error)) {
				errorMessage = error.response?.data?.message || error.message;
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}
			alert(`Gagal: ${errorMessage}`);
		} finally {
			setSaving(false);
		}
	};

	// Handle Delete
	const handleDelete = async (id: number) => {
		if (!confirm("Yakin ingin menghapus data ini?")) return;
		try {
			const api = createApi();
			const endpoint = activeTab === "classes" ? "/classes" : "/subjects";
			await api.delete(`${endpoint}/${id}`);
			fetchData();
		} catch (error) {
			console.error(error);
			alert("Gagal menghapus data");
		}
	};

	// --- Pagination Logic ---
	const currentDataList = activeTab === "classes" ? classes : subjects;
	const totalPages = Math.ceil(currentDataList.length / itemsPerPage);

	const displayedClasses = activeTab === "classes" ? classes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : [];

	const displayedSubjects = activeTab === "subjects" ? subjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : [];

	return (
		<div className="p-6 lg:p-8">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-800">Manajemen Akademik</h1>
					<p className="text-gray-500 text-sm">Kelola data kelas dan mata pelajaran.</p>
				</div>
				<button onClick={() => openModal("create")} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center shadow-sm">
					<Plus className="w-5 h-5 mr-2" />
					Tambah {activeTab === "classes" ? "Kelas" : "Mapel"}
				</button>
			</div>

			{/* Tabs */}
			<div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 mb-6 w-fit">
				<button onClick={() => setActiveTab("classes")} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "classes" ? "bg-indigo-100 text-indigo-700 shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}>
					<Layers className="w-4 h-4 mr-2" /> Data Kelas
				</button>
				<button onClick={() => setActiveTab("subjects")} className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "subjects" ? "bg-indigo-100 text-indigo-700 shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}>
					<BookOpen className="w-4 h-4 mr-2" /> Mata Pelajaran
				</button>
			</div>

			{/* Content Table */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
				{loading ? (
					<div className="p-8 text-center text-gray-500 flex flex-col items-center">
						<Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-500" />
						Memuat data...
					</div>
				) : (
					<>
						<div className="overflow-x-auto">
							<table className="w-full text-left">
								<thead className="bg-gray-50 border-b border-gray-200">
									<tr>
										<th className="px-6 py-4 font-semibold text-gray-600 text-sm w-16">No</th>
										<th className="px-6 py-4 font-semibold text-gray-600 text-sm">{activeTab === "classes" ? "Nama Kelas" : "Nama Mapel"}</th>
										<th className="px-6 py-4 font-semibold text-gray-600 text-sm">{activeTab === "classes" ? "Kapasitas" : "Kode Mapel"}</th>
										<th className="px-6 py-4 font-semibold text-gray-600 text-sm">Tingkat (Level)</th>
										<th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Aksi</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-100">
									{activeTab === "classes" ? (
										// Render Kelas (Paginated)
										displayedClasses.length > 0 ? (
											displayedClasses.map((cls, idx) => (
												<tr key={cls.id} className="hover:bg-gray-50 transition">
													<td className="px-6 py-4 text-gray-500">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
													<td className="px-6 py-4 font-medium text-gray-800">{cls.name}</td>
													<td className="px-6 py-4 text-gray-600">{cls.capacity} Siswa</td>
													<td className="px-6 py-4 text-gray-600">Tingkat {cls.level}</td>
													<td className="px-6 py-4 text-right">
														<div className="flex justify-end gap-2">
															<button onClick={() => openModal("edit", cls)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
																<Edit className="w-4 h-4" />
															</button>
															<button onClick={() => handleDelete(cls.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
																<Trash2 className="w-4 h-4" />
															</button>
														</div>
													</td>
												</tr>
											))
										) : (
											<tr>
												<td colSpan={5} className="px-6 py-8 text-center text-gray-500">
													Belum ada data kelas.
												</td>
											</tr>
										)
									) : // Render Mapel (Paginated)
									displayedSubjects.length > 0 ? (
										displayedSubjects.map((sub, idx) => (
											<tr key={sub.id} className="hover:bg-gray-50 transition">
												<td className="px-6 py-4 text-gray-500">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
												<td className="px-6 py-4 font-medium text-gray-800">{sub.name}</td>
												<td className="px-6 py-4">
													<span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded border">{sub.code}</span>
												</td>
												<td className="px-6 py-4 text-gray-600">Tingkat {sub.level}</td>
												<td className="px-6 py-4 text-right">
													<div className="flex justify-end gap-2">
														<button onClick={() => openModal("edit", sub)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
															<Edit className="w-4 h-4" />
														</button>
														<button onClick={() => handleDelete(sub.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
															<Trash2 className="w-4 h-4" />
														</button>
													</div>
												</td>
											</tr>
										))
									) : (
										<tr>
											<td colSpan={5} className="px-6 py-8 text-center text-gray-500">
												Belum ada data mata pelajaran.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>

						{/* Pagination Controls */}
						{currentDataList.length > 0 && (
							<div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
								<p className="text-sm text-gray-500">
									Halaman {currentPage} dari {totalPages || 1}
								</p>
								<div className="flex gap-2">
									<button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
										<ChevronLeft className="w-4 h-4 text-gray-600" />
									</button>
									<button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
										<ChevronRight className="w-4 h-4 text-gray-600" />
									</button>
								</div>
							</div>
						)}
					</>
				)}
			</div>

			{/* --- MODAL FORM --- */}
			{isModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
					<div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
						<button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
							<X className="w-5 h-5" />
						</button>

						<h2 className="text-xl font-bold text-gray-800 mb-4">
							{modalMode === "create" ? "Tambah" : "Edit"} {activeTab === "classes" ? "Kelas" : "Mata Pelajaran"}
						</h2>

						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Nama {activeTab === "classes" ? "Kelas" : "Mapel"}</label>
								<input type="text" required className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={activeTab === "classes" ? "Contoh: VII-A" : "Contoh: Matematika"} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Tingkat (Level)</label>
								<input type="number" required className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Contoh: 7" value={formData.level} onChange={(e) => setFormData({...formData, level: e.target.value})} />
							</div>

							{activeTab === "classes" ? (
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Kapasitas Siswa</label>
									<input type="number" required className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Default: 30" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: e.target.value})} />
								</div>
							) : (
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Kode Mapel</label>
									<input type="text" required className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono" placeholder="Contoh: MTK07" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} />
								</div>
							)}

							<button type="submit" disabled={saving} className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 mt-4 flex justify-center items-center shadow-md">
								{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Data"}
							</button>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
