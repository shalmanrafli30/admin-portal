"use client";

import {useState, useEffect, useCallback} from "react";
import axios from "axios";
import {useRouter} from "next/navigation";
import {Calendar, User, Clock, Plus, Trash2, RefreshCw, Filter, Loader2} from "lucide-react";

interface Schedule {
	id: number;
	day: string;
	startTime: string;
	endTime: string;
	Class?: {name: string};
	Subject?: {name: string};
	Teacher?: {name: string};
}

interface ClassItem {
	id: number;
	name: string;
}

interface TeacherItem {
	id: number;
	name: string;
}

interface SubjectItem {
	id: number;
	name: string;
    code: string;
}

export default function SchedulesPage() {
	const router = useRouter();

	// Data State
	const [schedules, setSchedules] = useState<Schedule[]>([]);
	const [classes, setClasses] = useState<ClassItem[]>([]);
	const [teachers, setTeachers] = useState<TeacherItem[]>([]);
	const [subjects, setSubjects] = useState<SubjectItem[]>([]);

	const [loading, setLoading] = useState(true);
	const [generating, setGenerating] = useState(false);

	// Filter State
	const [filterClass, setFilterClass] = useState("");
	const [filterTeacher, setFilterTeacher] = useState("");

	// Modal Create
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [newSchedule, setNewSchedule] = useState({
		day: "Monday",
		startTime: "",
		endTime: "",
		classId: "",
		subjectId: "",
		teacherId: ""
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

	// 2. Fetch Schedules
	const fetchSchedules = useCallback(async () => {
		setLoading(true);
		try {
			const api = createApi();
			// Kirim filter ke backend jika API mendukung, atau filter di client
			const res = await api.get("/schedules");
			const data = Array.isArray(res.data) ? res.data : res.data.data || [];
			setSchedules(data);
		} catch (error) {
			console.error("Gagal load jadwal", error);
		} finally {
			setLoading(false);
		}
	}, [createApi]);

	// 1. Fetch Data Master (Kelas, Guru, Mapel)
	useEffect(() => {
		const fetchMasterData = async () => {
			try {
				const api = createApi();
				const [resClasses, resTeachers, resSubjects] = await Promise.all([api.get("/classes?limit=100"), api.get("/teachers?limit=100"), api.get("/subjects?limit=100")]);

				// Handle structure variations
				// Helper to safely extract data array
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const extractData = (res: {data: unknown}): any[] => {
					const data = res.data;
					if (Array.isArray(data)) return data;

					if (typeof data === "object" && data !== null) {
						const d = data as Record<string, unknown>;
						if (Array.isArray(d.data)) return d.data;
						// Add specific keys if needed based on API response structure like res.data.classes
						if (Array.isArray(d.classes)) return d.classes;
						if (Array.isArray(d.teachers)) return d.teachers;
						if (Array.isArray(d.subjects)) return d.subjects;
					}
					return [];
				};

				setClasses(extractData(resClasses));
				setTeachers(extractData(resTeachers));
				setSubjects(extractData(resSubjects));

				// Load schedules after master data
				fetchSchedules();
			} catch (error) {
				console.error("Gagal load data master", error);
			}
		};
		fetchMasterData();
	}, [createApi, fetchSchedules]);

	// 3. Generate Auto
	const handleAutoGenerate = async () => {
		if (!confirm("PERINGATAN: Ini akan membuat jadwal otomatis berdasarkan data guru & kelas. Lanjutkan?")) return;

		setGenerating(true);
		try {
			const api = createApi();
			const res = await api.post("/schedules/auto-generate");
			alert(res.data.message || "Jadwal berhasil digenerate!");
			fetchSchedules();
		} catch (error: unknown) {
			let errorMessage = "Terjadi kesalahan saat generate jadwal.";
			if (axios.isAxiosError(error)) {
				errorMessage = error.response?.data?.message || error.message;
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}
			alert(`Gagal generate: ${errorMessage}`);
		} finally {
			setGenerating(false);
		}
	};

	// 4. Reset All Schedules
	const handleReset = async () => {
		if (!confirm("BAHAYA: Semua data jadwal akan DIHAPUS. Yakin?")) return;

		try {
			const api = createApi();
			await api.delete("/schedules"); // Pastikan endpoint delete all ada
			alert("Semua jadwal berhasil dihapus.");
			fetchSchedules();
		} catch (error) {
			console.error(error);
			alert("Gagal reset jadwal");
		}
	};

	// 5. Create Manual
	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const api = createApi();
			await api.post("/schedules", newSchedule);
			alert("Jadwal berhasil ditambahkan!");
			setIsModalOpen(false);
			fetchSchedules();
		} catch (error: unknown) {
			let errorMessage = "Terjadi kesalahan.";
			if (axios.isAxiosError(error)) {
				errorMessage = error.response?.data?.message || error.message;
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}
			alert(`Gagal: ${errorMessage}`);
		}
	};

	// Filter Logic (Client Side)
	const filteredSchedules = schedules.filter((s) => {
		if (filterClass && s.Class?.name !== filterClass) return false;
		if (filterTeacher && s.Teacher?.name !== filterTeacher) return false;
		return true;
	});

	return (
		<div className="p-6 lg:p-8">
			{/* Header */}
			<div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-800">Jadwal Pelajaran</h1>
					<p className="text-gray-500 text-sm">Atur jadwal KBM secara manual atau otomatis.</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<button onClick={handleReset} className="bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-50 flex items-center">
						<Trash2 className="w-4 h-4 mr-2" /> Reset Semua
					</button>
					<button onClick={handleAutoGenerate} disabled={generating} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:bg-emerald-300 flex items-center">
						{generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
						Generate Otomatis
					</button>
					<button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center">
						<Plus className="w-4 h-4 mr-2" /> Tambah Manual
					</button>
				</div>
			</div>

			{/* Filter Bar */}
			<div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center">
				<div className="flex items-center text-gray-500 text-sm font-medium">
					<Filter className="w-4 h-4 mr-2" /> Filter:
				</div>
				<select className="border p-2 rounded-lg text-sm w-full md:w-48 outline-none focus:ring-2 focus:ring-indigo-500" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
					<option value="">Semua Kelas</option>
					{classes.map((c) => (
						<option key={c.id} value={c.name}>
							{c.name}
						</option>
					))}
				</select>
				<select className="border p-2 rounded-lg text-sm w-full md:w-48 outline-none focus:ring-2 focus:ring-indigo-500" value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)}>
					<option value="">Semua Guru</option>
					{teachers.map((t) => (
						<option key={t.id} value={t.name}>
							{t.name}
						</option>
					))}
				</select>
			</div>

			{/* Schedule Grid/Table */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
				{loading ? (
					<div className="p-10 text-center text-gray-500 flex flex-col items-center">
						<Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-500" />
						Memuat jadwal...
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left">
							<thead className="bg-gray-50 border-b border-gray-200">
								<tr>
									<th className="px-6 py-4 font-semibold text-gray-600 text-sm">Hari & Jam</th>
									<th className="px-6 py-4 font-semibold text-gray-600 text-sm">Kelas</th>
									<th className="px-6 py-4 font-semibold text-gray-600 text-sm">Mata Pelajaran</th>
									<th className="px-6 py-4 font-semibold text-gray-600 text-sm">Guru Pengampu</th>
									<th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Aksi</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100">
								{filteredSchedules.length === 0 ? (
									<tr>
										<td colSpan={5} className="px-6 py-8 text-center text-gray-500">
											Jadwal tidak ditemukan.
										</td>
									</tr>
								) : (
									filteredSchedules.map((s) => (
										<tr key={s.id} className="hover:bg-gray-50 transition">
											<td className="px-6 py-4">
												<div className="flex items-center gap-2">
													<Calendar className="w-4 h-4 text-indigo-500" />
													<span className="font-medium text-gray-800">{s.day}</span>
												</div>
												<div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
													<Clock className="w-3 h-3" />
													{s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}
												</div>
											</td>
											<td className="px-6 py-4">
												<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{s.Class?.name}</span>
											</td>
											<td className="px-6 py-4 font-medium text-gray-700">{s.Subject?.name}</td>
											<td className="px-6 py-4">
												<div className="flex items-center gap-2">
													<User className="w-4 h-4 text-gray-400" />
													<span className="text-gray-600 text-sm">{s.Teacher?.name}</span>
												</div>
											</td>
											<td className="px-6 py-4 text-right">
												<button
													onClick={async () => {
														if (confirm("Hapus jadwal ini?")) {
															const api = createApi();
															await api.delete(`/schedules/${s.id}`);
															fetchSchedules();
														}
													}}
													className="text-gray-400 hover:text-red-600 transition"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Modal Form */}
			{isModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
					<div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
						<h2 className="text-xl font-bold text-gray-800 mb-4">Tambah Jadwal Manual</h2>
						<form onSubmit={handleCreate} className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium mb-1">Hari</label>
									<select className="w-full border p-2 rounded" value={newSchedule.day} onChange={(e) => setNewSchedule({...newSchedule, day: e.target.value})}>
										{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => (
											<option key={d} value={d}>
												{d}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Kelas</label>
									<select className="w-full border p-2 rounded" required value={newSchedule.classId} onChange={(e) => setNewSchedule({...newSchedule, classId: e.target.value})}>
										<option value="">Pilih Kelas</option>
										{classes.map((c) => (
											<option key={c.id} value={c.id.toString()}>
												{c.name}
											</option>
										))}
									</select>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium mb-1">Jam Mulai</label>
									<input type="time" className="w-full border p-2 rounded" required value={newSchedule.startTime} onChange={(e) => setNewSchedule({...newSchedule, startTime: e.target.value})} />
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Jam Selesai</label>
									<input type="time" className="w-full border p-2 rounded" required value={newSchedule.endTime} onChange={(e) => setNewSchedule({...newSchedule, endTime: e.target.value})} />
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1">Mata Pelajaran</label>
								<select className="w-full border p-2 rounded" required value={newSchedule.subjectId} onChange={(e) => setNewSchedule({...newSchedule, subjectId: e.target.value})}>
									<option value="">Pilih Mapel</option>
									{subjects.map((s) => (
										<option key={s.id} value={s.id.toString()}>
											{s.name} ({s.code})
										</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium mb-1">Guru Pengampu</label>
								<select className="w-full border p-2 rounded" required value={newSchedule.teacherId} onChange={(e) => setNewSchedule({...newSchedule, teacherId: e.target.value})}>
									<option value="">Pilih Guru</option>
									{teachers.map((t) => (
										<option key={t.id} value={t.id.toString()}>
											{t.name}
										</option>
									))}
								</select>
							</div>

							<div className="flex justify-end gap-2 mt-4">
								<button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">
									Batal
								</button>
								<button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700">
									Simpan
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
