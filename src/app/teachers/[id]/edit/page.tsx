"use client";

import {useState, useEffect} from "react";
import axios from "axios";
import {useRouter, useParams} from "next/navigation";
import {Save, ArrowLeft, Loader2} from "lucide-react";
import Link from "next/link";

export default function EditTeacherPage() {
	const router = useRouter();
	const params = useParams();
	const id = params?.id; // Mengambil ID dari URL dynamic route

	const [loading, setLoading] = useState(false);
	const [fetching, setFetching] = useState(true);

	// State untuk form data yang bisa diedit
	const [formData, setFormData] = useState({
		name: "",
		subjectSpecialization: ""
	});

	// State untuk data yang read-only (NIP)
	const [nip, setNip] = useState("");

	// 1. Fetch Data Guru saat halaman dibuka
	useEffect(() => {
		const fetchTeacher = async () => {
			if (!id) return;

			try {
				const token = localStorage.getItem("token");
				if (!token) {
					router.push("/login");
					return;
				}

				const res = await axios.get(`https://api.meccaschool.online/api/admin/teachers/${id}`, {
					headers: {Authorization: `Bearer ${token}`}
				});

				const data = res.data;
				setFormData({
					name: data.name,
					subjectSpecialization: data.subjectSpecialization
				});
				setNip(data.nip);
			} catch (error) {
				console.error(error);
				alert("Gagal mengambil data guru.");
				router.push("/teachers");
			} finally {
				setFetching(false);
			}
		};
		fetchTeacher();
	}, [id, router]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({...formData, [e.target.name]: e.target.value});
	};

	// 2. Submit Perubahan (PUT)
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const token = localStorage.getItem("token");
			await axios.put(`https://api.meccaschool.online/api/admin/teachers/${id}`, formData, {
				headers: {Authorization: `Bearer ${token}`}
			});
			alert("Data guru berhasil diperbarui!");
			router.push("/teachers");
		} catch (error: unknown) {
			let errorMessage = "Gagal menyimpan perubahan.";
			if (axios.isAxiosError(error)) {
				errorMessage = error.response?.data?.message || error.message;
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}
			alert(`Gagal: ${errorMessage}`);
		} finally {
			setLoading(false);
		}
	};

	if (fetching)
		return (
			<div className="h-screen flex justify-center items-center text-gray-500">
				<Loader2 className="w-10 h-10 animate-spin mr-2 text-indigo-600" />
				Memuat data...
			</div>
		);

	return (
		<div className="p-6 lg:p-8 max-w-2xl mx-auto">
			{/* Header Navigasi */}
			<div className="mb-6">
				<Link href="/teachers" className="text-gray-500 hover:text-indigo-600 flex items-center gap-2 text-sm font-medium mb-2 transition-colors">
					<ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
				</Link>
				<h1 className="text-2xl font-bold text-gray-800">Edit Data Guru</h1>
			</div>

			<form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-5">
				{/* Field NIP (Read Only) */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">NIP (Tidak dapat diubah)</label>
					<input type="text" value={nip} disabled className="w-full border p-2.5 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200" />
				</div>

				{/* Field Nama */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
					<input type="text" name="name" required className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 border-gray-300" value={formData.name} onChange={handleChange} />
				</div>

				{/* Field Spesialisasi */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Spesialisasi Mapel</label>
					<input type="text" name="subjectSpecialization" required className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 border-gray-300" value={formData.subjectSpecialization} onChange={handleChange} />
				</div>

				{/* Tombol Simpan */}
				<div className="pt-4 flex justify-end">
					<button type="submit" disabled={loading} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center shadow-md transition-all active:scale-95">
						{loading ? (
							<Loader2 className="w-5 h-5 animate-spin" />
						) : (
							<span className="flex items-center">
								<Save className="w-5 h-5 mr-2" /> Simpan Perubahan
							</span>
						)}
					</button>
				</div>
			</form>
		</div>
	);
}
