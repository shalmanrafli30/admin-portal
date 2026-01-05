"use client";

import {useState, useEffect, useCallback} from "react";
import axios from "axios";
import {useRouter} from "next/navigation";
import Image from "next/image";
import {CheckCircle, Clock, AlertCircle, Search, ExternalLink, Loader2, Eye, Plus, X} from "lucide-react";

interface Bill {
	id: number;
	billNumber: string;
	amount: string;
	status: "Pending" | "Paid" | "Verifying" | "Overdue";
	dueDate: string;
	paymentProof?: string;
	Student?: {
		name: string;
		nis: string;
	};
	Fee?: {
		name: string;
	};
}

interface Student {
	id: number;
	name: string;
	nis: string;
}

interface Fee {
	id: number;
	name: string;
	amount: string;
}

export default function FinancePage() {
	const router = useRouter();

	// Data State
	const [bills, setBills] = useState<Bill[]>([]);
	const [loading, setLoading] = useState(true);
	const [filterStatus, setFilterStatus] = useState("ALL");
	const [search, setSearch] = useState("");

	// Modal State
	const [previewImage, setPreviewImage] = useState<string | null>(null);
	const [verifyingId, setVerifyingId] = useState<number | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [creating, setCreating] = useState(false);

	// Data untuk Dropdown Create Bill
	const [studentsList, setStudentsList] = useState<Student[]>([]);
	const [feesList, setFeesList] = useState<Fee[]>([]);

	// [BARU] State untuk Search Siswa di Modal
	const [studentSearch, setStudentSearch] = useState("");

	// Form Create Bill
	const [newBill, setNewBill] = useState({
		studentId: "",
		feeId: "",
		dueDate: "",
		customAmount: "",
		month: new Date().getMonth() + 1,
		year: new Date().getFullYear()
	});

	const fetchBills = useCallback(async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				router.push("/login");
				return;
			}

			const res = await axios.get("https://api.meccaschool.online/api/admin/bills", {
				headers: {Authorization: `Bearer ${token}`},
				params: {limit: 100, search}
			});

			const data = res.data.bills || res.data.data || [];
			setBills(data);
		} catch (error) {
			console.error("Gagal load tagihan:", error);
		} finally {
			setLoading(false);
		}
	}, [router, search]);

	// Load Dependencies (Students & Fees) saat Modal dibuka
	useEffect(() => {
		if (showCreateModal) {
			// Reset search saat modal dibuka
			setStudentSearch("");

			const fetchDeps = async () => {
				try {
					const token = localStorage.getItem("token");
					const [resStudents, resFees] = await Promise.all([axios.get("https://api.meccaschool.online/api/admin/students?limit=1000", {headers: {Authorization: `Bearer ${token}`}}), axios.get("https://api.meccaschool.online/api/admin/fees", {headers: {Authorization: `Bearer ${token}`}})]);

					// Robust Data Extraction for Students
					let sList: Student[] = [];
					if (resStudents.data && Array.isArray(resStudents.data.students)) {
						sList = resStudents.data.students;
					} else if (Array.isArray(resStudents.data)) {
						sList = resStudents.data;
					} else if (resStudents.data && Array.isArray(resStudents.data.data)) {
						sList = resStudents.data.data;
					}

					// Robust Data Extraction for Fees
					let fList: Fee[] = [];
					if (Array.isArray(resFees.data)) {
						fList = resFees.data;
					} else if (resFees.data && Array.isArray(resFees.data.data)) {
						fList = resFees.data.data;
					}

					setStudentsList(sList);
					setFeesList(fList);
				} catch (e) {
					console.error("Gagal load data untuk form", e);
				}
			};
			fetchDeps();
		}
	}, [showCreateModal]);

	useEffect(() => {
		const timer = setTimeout(() => {
			fetchBills();
		}, 500);
		return () => clearTimeout(timer);
	}, [search, fetchBills]);

	// Filter Data Tabel Utama
	const filteredBills = bills.filter((bill) => {
		if (filterStatus !== "ALL" && bill.status !== filterStatus) return false;
		return true;
	});

	// [BARU] Filter Siswa di Modal berdasarkan Search
	const filteredStudentsList = studentsList.filter((s) => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.nis.includes(studentSearch));

	const handleVerify = async (id: number) => {
		if (!confirm("Verifikasi pembayaran ini menjadi LUNAS?")) return;

		setVerifyingId(id);
		try {
			const token = localStorage.getItem("token");
			await axios.put(
				`https://api.meccaschool.online/api/admin/bills/${id}/pay`,
				{},
				{
					headers: {Authorization: `Bearer ${token}`}
				}
			);
			alert("Pembayaran berhasil diverifikasi!");
			setPreviewImage(null);
			fetchBills();
		} catch (error: unknown) {
			let errorMessage = "Gagal verifikasi.";
			if (axios.isAxiosError(error)) {
				errorMessage = error.response?.data?.message || error.message;
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}
			alert(errorMessage);
		} finally {
			setVerifyingId(null);
		}
	};

	// Handle Create Bill
	const handleCreateSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setCreating(true);
		try {
			const token = localStorage.getItem("token");
			await axios.post("https://api.meccaschool.online/api/admin/bills", newBill, {
				headers: {Authorization: `Bearer ${token}`}
			});
			alert("Tagihan berhasil dibuat!");
			setShowCreateModal(false);
			setNewBill({studentId: "", feeId: "", dueDate: "", customAmount: "", month: new Date().getMonth() + 1, year: new Date().getFullYear()});
			fetchBills();
		} catch (error: unknown) {
			let errorMessage = "Gagal buat tagihan.";
			if (axios.isAxiosError(error)) {
				errorMessage = error.response?.data?.message || error.message;
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}
			alert(errorMessage);
		} finally {
			setCreating(false);
		}
	};

	// Auto-fill amount saat fee dipilih
	const handleFeeChange = (feeId: string) => {
		setNewBill((prev) => ({...prev, feeId}));
		const selectedFee = feesList.find((f) => f.id.toString() === feeId);
		if (selectedFee) {
			setNewBill((prev) => ({...prev, customAmount: selectedFee.amount}));
		}
	};

	return (
		<div className="p-6 lg:p-8 relative">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
				<div>
					<h1 className="text-2xl font-bold text-gray-800">Keuangan & Verifikasi</h1>
					<p className="text-gray-500 text-sm">Kelola tagihan masuk dan verifikasi bukti bayar.</p>
				</div>

				<div className="flex gap-3">
					{/* Filter Tab */}
					<div className="flex bg-white p-1 rounded-lg border shadow-sm">
						{["ALL", "Verifying", "Pending", "Paid"].map((status) => (
							<button key={status} onClick={() => setFilterStatus(status)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${filterStatus === status ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-50"}`}>
								{status === "ALL" ? "Semua" : status === "Verifying" ? "Perlu Cek" : status}
							</button>
						))}
					</div>

					{/* Tombol Buat Tagihan */}
					<button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center shadow-sm">
						<Plus className="w-4 h-4 mr-2" /> Buat Tagihan
					</button>
				</div>
			</div>

			{/* Search Bar Utama */}
			<div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
					<input type="text" placeholder="Cari No Tagihan atau NIS..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition text-gray-700" value={search} onChange={(e) => setSearch(e.target.value)} />
				</div>
			</div>

			{/* Table Utama */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left">
						<thead className="bg-gray-50 border-b border-gray-200">
							<tr>
								<th className="px-6 py-4 font-semibold text-gray-600 text-sm">Info Tagihan</th>
								<th className="px-6 py-4 font-semibold text-gray-600 text-sm">Siswa</th>
								<th className="px-6 py-4 font-semibold text-gray-600 text-sm">Jumlah</th>
								<th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
								<th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Aksi</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{loading ? (
								<tr>
									<td colSpan={5} className="px-6 py-8 text-center text-gray-500">
										Loading...
									</td>
								</tr>
							) : filteredBills.length === 0 ? (
								<tr>
									<td colSpan={5} className="px-6 py-8 text-center text-gray-500">
										Tidak ada data.
									</td>
								</tr>
							) : (
								filteredBills.map((bill) => (
									<tr key={bill.id} className="hover:bg-gray-50 transition">
										<td className="px-6 py-4">
											<p className="font-bold text-gray-800">{bill.Fee?.name || "Tagihan"}</p>
											<p className="text-xs font-mono text-gray-500">{bill.billNumber}</p>
											<p className="text-xs text-gray-400 mt-1">Due: {new Date(bill.dueDate).toLocaleDateString()}</p>
										</td>
										<td className="px-6 py-4">
											<p className="font-medium text-gray-700">{bill.Student?.name}</p>
											<p className="text-xs text-gray-500">{bill.Student?.nis}</p>
										</td>
										<td className="px-6 py-4 font-bold text-gray-700">Rp {parseInt(bill.amount).toLocaleString("id-ID")}</td>
										<td className="px-6 py-4">
											{bill.status === "Paid" && (
												<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
													<CheckCircle className="w-3 h-3 mr-1" /> Lunas
												</span>
											)}
											{bill.status === "Pending" && (
												<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
													<AlertCircle className="w-3 h-3 mr-1" /> Belum Bayar
												</span>
											)}
											{bill.status === "Verifying" && (
												<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
													<Clock className="w-3 h-3 mr-1" /> Menunggu Verifikasi
												</span>
											)}
										</td>
										<td className="px-6 py-4 text-right">
											{bill.paymentProof && (
												<button onClick={() => setPreviewImage(`https://api.meccaschool.online/${bill.paymentProof}`)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mr-3 inline-flex items-center">
													<Eye className="w-4 h-4 mr-1" /> Bukti
												</button>
											)}

											{bill.status !== "Paid" && (
												<button onClick={() => handleVerify(bill.id)} disabled={verifyingId === bill.id} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50">
													{verifyingId === bill.id ? "..." : "Verifikasi"}
												</button>
											)}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Modal Preview Gambar */}
			{previewImage && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewImage(null)}>
					<div className="bg-white p-2 rounded-xl max-w-2xl w-full relative" onClick={(e) => e.stopPropagation()}>
						<Image src={previewImage} alt="Bukti Bayar" width={800} height={600} className="w-full h-auto rounded-lg object-contain" />
						<div className="flex justify-between items-center mt-4 px-2 pb-2">
							<p className="text-sm text-gray-500">Bukti Pembayaran</p>
							<div className="flex gap-2">
								<button onClick={() => window.open(previewImage, "_blank")} className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-bold">
									<ExternalLink className="w-4 h-4 mr-1" /> Buka Asli
								</button>
								<button onClick={() => setPreviewImage(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-300">
									Tutup
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* MODAL CREATE BILL */}
			{showCreateModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
					<div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in duration-200">
						<button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
							<X className="w-5 h-5" />
						</button>
						<h2 className="text-xl font-bold text-gray-800 mb-4">Buat Tagihan Manual</h2>

						<form onSubmit={handleCreateSubmit} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Pilih Siswa</label>

								{/* [BARU] Input Pencarian Siswa di dalam Modal */}
								<div className="relative mb-2">
									<Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
									<input type="text" placeholder="Ketik Nama atau NIS untuk mencari..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
								</div>

								<select required className="w-full border p-2.5 rounded-lg text-gray-700 bg-white" value={newBill.studentId} onChange={(e) => setNewBill({...newBill, studentId: e.target.value})}>
									<option value="">-- Hasil Pencarian ({filteredStudentsList.length}) --</option>
									{filteredStudentsList.map((s) => (
										<option key={s.id} value={s.id}>
											{s.name} ({s.nis})
										</option>
									))}
								</select>
								<p className="text-xs text-gray-400 mt-1">Ketik di kotak pencarian untuk menyaring daftar siswa.</p>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Jenis Tagihan</label>
								<select required className="w-full border p-2.5 rounded-lg text-gray-700 bg-white" value={newBill.feeId} onChange={(e) => handleFeeChange(e.target.value)}>
									<option value="">-- Pilih Jenis Fee --</option>
									{feesList.map((f) => (
										<option key={f.id} value={f.id}>
											{f.name} - Rp {parseInt(f.amount).toLocaleString()}
										</option>
									))}
								</select>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
									<input type="number" required className="w-full border p-2.5 rounded-lg text-gray-700" value={newBill.customAmount} onChange={(e) => setNewBill({...newBill, customAmount: e.target.value})} />
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo</label>
									<input type="date" required className="w-full border p-2.5 rounded-lg text-gray-700" value={newBill.dueDate} onChange={(e) => setNewBill({...newBill, dueDate: e.target.value})} />
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Bulan (Angka)</label>
									<input type="number" min="1" max="12" className="w-full border p-2.5 rounded-lg text-gray-700" value={newBill.month} onChange={(e) => setNewBill({...newBill, month: parseInt(e.target.value)})} />
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
									<input type="number" className="w-full border p-2.5 rounded-lg text-gray-700" value={newBill.year} onChange={(e) => setNewBill({...newBill, year: parseInt(e.target.value)})} />
								</div>
							</div>

							<button type="submit" disabled={creating} className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 mt-4 flex justify-center items-center">
								{creating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Tagihan"}
							</button>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
