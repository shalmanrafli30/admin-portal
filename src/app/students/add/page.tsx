"use client";

import {useState} from "react";
import axios from "axios";
import {useRouter} from "next/navigation";
import {Save, ArrowLeft, Loader2} from "lucide-react";
import Link from "next/link";

export default function AddStudentPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	// Form State
	const [formData, setFormData] = useState({
		name: "",
		dob: "",
		parentName: "",
		parentContact: "",
		parentEmail: "",
		address: "",
		isCatering: false
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const {name, value} = e.target;
		setFormData((prev) => ({...prev, [name]: value}));
	};

	const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData((prev) => ({...prev, isCatering: e.target.checked}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const token = localStorage.getItem("token");
			await axios.post("https://api.meccaschool.online/api/admin/students", formData, {
				headers: {Authorization: `Bearer ${token}`}
			});

			alert("Siswa berhasil ditambahkan! Akun login & tagihan awal otomatis dibuat.");
			router.push("/students");
		} catch (error: unknown) {
			console.error(error);
			let errorMessage = "Terjadi kesalahan saat menyimpan data.";

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
		<div className="p-6 lg:p-8 max-w-4xl mx-auto">
			{/* Header Nav */}
			<div className="mb-6">
				<Link href="/students" className="text-gray-500 hover:text-indigo-600 flex items-center gap-2 text-sm font-medium mb-2">
					<ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
				</Link>
				<h1 className="text-2xl font-bold text-gray-800">Tambah Siswa Baru</h1>
			</div>

			<form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Informasi Siswa */}
					<div className="md:col-span-2 border-b pb-2 mb-2">
						<h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Data Siswa</h3>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
						<input type="text" name="name" required className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800" placeholder="Contoh: Ahmad Dahlan" onChange={handleChange} />
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
						<input type="date" name="dob" required className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800" onChange={handleChange} />
						<p className="text-xs text-gray-400 mt-1">*Digunakan sebagai password default (DDMMYYYY)</p>
					</div>

					{/* Informasi Orang Tua */}
					<div className="md:col-span-2 border-b pb-2 mb-2 mt-4">
						<h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Data Wali / Orang Tua</h3>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Nama Wali</label>
						<input type="text" name="parentName" required className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800" placeholder="Nama Orang Tua" onChange={handleChange} />
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Email Wali (Untuk Login Parent)</label>
						<input type="email" name="parentEmail" required className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800" placeholder="email@contoh.com" onChange={handleChange} />
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon / WA</label>
						<input type="text" name="parentContact" required className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800" placeholder="0812..." onChange={handleChange} />
					</div>

					<div className="md:col-span-2">
						<label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
						<input type="text" name="address" required className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800" placeholder="Jalan..." onChange={handleChange} />
					</div>

					{/* Opsi Tambahan */}
					<div className="md:col-span-2 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
						<label className="flex items-center space-x-3 cursor-pointer">
							<input type="checkbox" name="isCatering" className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300" onChange={handleCheckbox} />
							<span className="text-gray-700 font-medium">Ikut Program Katering Sekolah?</span>
						</label>
						<p className="text-xs text-gray-500 mt-1 ml-8">Jika dicentang, tagihan katering bulanan akan otomatis dibuat.</p>
					</div>
				</div>

				<div className="mt-8 flex justify-end">
					<button type="submit" disabled={loading} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center transition shadow-md">
						{loading ? (
							<Loader2 className="w-5 h-5 animate-spin" />
						) : (
							<span className="flex items-center">
								<Save className="w-5 h-5 mr-2" /> Simpan Data Siswa
							</span>
						)}
					</button>
				</div>
			</form>
		</div>
	);
}
