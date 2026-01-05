/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {useState} from "react";
import axios from "axios";
import {useRouter} from "next/navigation";
import {Save, ArrowLeft, Loader2} from "lucide-react";
import Link from "next/link";

export default function AddTeacherPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	const [formData, setFormData] = useState({
		nip: "",
		name: "",
		subjectSpecialization: ""
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({...formData, [e.target.name]: e.target.value});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const token = localStorage.getItem("token");
			if (!token) {
				router.push("/login");
				return;
			}

			await axios.post("https://api.meccaschool.online/api/admin/teachers", formData, {
				headers: {Authorization: `Bearer ${token}`}
			});

			alert("Guru berhasil ditambahkan! Akun login otomatis dibuat.");
			router.push("/teachers");
		} catch (error: any) {
			// Menggunakan any sementara untuk kemudahan akses error axios
			console.error(error);
			let errorMessage = "Gagal menyimpan data.";
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

	return (
		<div className="p-6 lg:p-8 max-w-2xl mx-auto">
			<div className="mb-6">
				<Link href="/teachers" className="text-gray-500 hover:text-indigo-600 flex items-center gap-2 text-sm font-medium mb-2">
					<ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
				</Link>
				<h1 className="text-2xl font-bold text-gray-800">Tambah Guru Baru</h1>
			</div>

			<form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-5">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">NIP (Nomor Induk Pegawai)</label>
					<input type="text" name="nip" required className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 placeholder-gray-400" placeholder="Contoh: 19800101..." onChange={handleChange} value={formData.nip} />
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
					<input type="text" name="name" required className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 placeholder-gray-400" placeholder="Nama Guru" onChange={handleChange} value={formData.name} />
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Spesialisasi Mapel</label>
					<input type="text" name="subjectSpecialization" required className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 placeholder-gray-400" placeholder="Contoh: Matematika" onChange={handleChange} value={formData.subjectSpecialization} />
				</div>

				<div className="pt-4 flex justify-end">
					<button type="submit" disabled={loading} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center shadow-md transition-all">
						{loading ? (
							<Loader2 className="w-5 h-5 animate-spin" />
						) : (
							<span className="flex items-center">
								<Save className="w-5 h-5 mr-2" /> Simpan Data
							</span>
						)}
					</button>
				</div>
			</form>
		</div>
	);
}
