/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {useEffect, useState} from "react";
import axios from "axios";
import {useRouter} from "next/navigation";
import {Users, GraduationCap, CreditCard, ArrowUpRight, Calendar, Bell, Loader2, Plus} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
	const router = useRouter();
	const [stats, setStats] = useState({
		totalStudents: 0,
		totalTeachers: 0,
		pendingBills: 0,
		totalRevenue: 0
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				const token = localStorage.getItem("token");
				if (!token) {
					router.push("/login");
					return;
				}

				const api = axios.create({
					baseURL: "https://api.meccaschool.online/api/admin",
					headers: {Authorization: `Bearer ${token}`}
				});

				// Fetch data secara paralel agar cepat
				const [resStudents, resTeachers, resBills] = await Promise.all([
					api.get("/students?limit=1"), // Cuma butuh total count
					api.get("/teachers?limit=1"),
					api.get("/bills?limit=1000") // Ambil agak banyak buat hitung revenue/pending
				]);

				const bills = resBills.data.bills || resBills.data.data || [];
				const pendingCount = bills.filter((b: any) => b.status === "Pending" || b.status === "Verifying").length;
				const revenue = bills.filter((b: any) => b.status === "Paid").reduce((acc: number, curr: any) => acc + parseFloat(curr.amount), 0);

				setStats({
					totalStudents: resStudents.data.totalItems || 0,
					totalTeachers: resTeachers.data.totalItems || 0,
					pendingBills: pendingCount,
					totalRevenue: revenue
				});
			} catch (error) {
				console.error("Gagal load dashboard stats", error);
			} finally {
				setLoading(false);
			}
		};

		fetchStats();
	}, [router]);

	if (loading)
		return (
			<div className="flex h-screen items-center justify-center text-indigo-600">
				<Loader2 className="w-10 h-10 animate-spin" />
			</div>
		);

	return (
		<div className="p-6 lg:p-8 space-y-6">
			{/* Header */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div>
					<h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
					<p className="text-gray-500 mt-1">Ringkasan aktivitas sekolah hari ini.</p>
				</div>
				<div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
					<Calendar className="w-5 h-5 text-indigo-600" />
					<span className="text-sm font-medium text-gray-700">{new Date().toLocaleDateString("id-ID", {weekday: "long", year: "numeric", month: "long", day: "numeric"})}</span>
				</div>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{/* Card 1: Total Siswa */}
				<div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
					<div className="flex justify-between items-start">
						<div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition">
							<GraduationCap className="w-6 h-6 text-blue-600" />
						</div>
						<span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
							<ArrowUpRight className="w-3 h-3 mr-1" /> +2%
						</span>
					</div>
					<div className="mt-4">
						<h3 className="text-3xl font-bold text-gray-800">{stats.totalStudents}</h3>
						<p className="text-sm text-gray-500 font-medium">Total Siswa Aktif</p>
					</div>
				</div>

				{/* Card 2: Total Guru */}
				<div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
					<div className="flex justify-between items-start">
						<div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition">
							<Users className="w-6 h-6 text-purple-600" />
						</div>
					</div>
					<div className="mt-4">
						<h3 className="text-3xl font-bold text-gray-800">{stats.totalTeachers}</h3>
						<p className="text-sm text-gray-500 font-medium">Total Guru & Staf</p>
					</div>
				</div>

				{/* Card 3: Tagihan Pending */}
				<div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
					<div className="flex justify-between items-start">
						<div className="p-3 bg-orange-50 rounded-xl group-hover:bg-orange-100 transition">
							<Bell className="w-6 h-6 text-orange-600" />
						</div>
						{stats.pendingBills > 0 && <span className="flex items-center text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full animate-pulse">Perlu Tindakan</span>}
					</div>
					<div className="mt-4">
						<h3 className="text-3xl font-bold text-gray-800">{stats.pendingBills}</h3>
						<p className="text-sm text-gray-500 font-medium">Tagihan Belum Lunas</p>
					</div>
				</div>

				{/* Card 4: Total Pendapatan */}
				{/* <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
					<div className="flex justify-between items-start">
						<div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition">
							<Wallet className="w-6 h-6 text-emerald-600" />
						</div>
					</div>
					<div className="mt-4">
						<h3 className="text-xl font-bold text-gray-800 truncate" title={`Rp ${stats.totalRevenue.toLocaleString("id-ID")}`}>
							Rp {(stats.totalRevenue / 1000000).toFixed(1)} Jt
						</h3>
						<p className="text-sm text-gray-500 font-medium">Estimasi Pendapatan</p>
					</div>
				</div> */}
			</div>

			{/* Section Bawah: Quick Actions & Banner */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Banner Welcome */}
				<div className="lg:col-span-2 bg-linear-to-r from-indigo-600 to-blue-600 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg">
					<div className="relative z-10">
						<h2 className="text-2xl font-bold mb-2">Selamat Datang, Admin! 👋</h2>
						<p className="text-indigo-100 mb-6 max-w-lg">Pantau terus perkembangan akademik dan keuangan sekolah dengan mudah melalui dashboard ini. Jangan lupa cek tagihan yang perlu diverifikasi.</p>
						<Link href="/finance" className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition shadow-md inline-flex items-center">
							<CreditCard className="w-4 h-4 mr-2" /> Cek Keuangan
						</Link>
					</div>
					{/* Background Decoration */}
					<div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
						<Users className="w-64 h-64" />
					</div>
				</div>

				{/* Quick Actions List */}
				<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
					<h3 className="font-bold text-gray-800 mb-4">Aksi Cepat</h3>
					<div className="space-y-3">
						<Link href="/students/add" className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-200 group">
							<div className="bg-blue-100 p-2 rounded-lg text-blue-600 mr-3 group-hover:scale-110 transition">
								<Plus className="w-5 h-5" />
							</div>
							<div>
								<p className="text-sm font-bold text-gray-700">Tambah Siswa Baru</p>
								<p className="text-xs text-gray-400">Daftarkan siswa ke sistem</p>
							</div>
						</Link>

						<Link href="/finance" className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-200 group">
							<div className="bg-orange-100 p-2 rounded-lg text-orange-600 mr-3 group-hover:scale-110 transition">
								<CreditCard className="w-5 h-5" />
							</div>
							<div>
								<p className="text-sm font-bold text-gray-700">Verifikasi Pembayaran</p>
								<p className="text-xs text-gray-400">Cek bukti transfer masuk</p>
							</div>
						</Link>

						<Link href="/schedules" className="flex items-center p-3 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-200 group">
							<div className="bg-purple-100 p-2 rounded-lg text-purple-600 mr-3 group-hover:scale-110 transition">
								<Calendar className="w-5 h-5" />
							</div>
							<div>
								<p className="text-sm font-bold text-gray-700">Atur Jadwal</p>
								<p className="text-xs text-gray-400">Kelola jadwal pelajaran</p>
							</div>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
