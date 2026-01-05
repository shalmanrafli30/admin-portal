"use client";

import {useState, useEffect} from "react";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {LayoutDashboard, Users, GraduationCap, Calendar, CreditCard, LogOut, Menu, X, BookOpen, Layers} from "lucide-react";

export default function Sidebar() {
	const pathname = usePathname();
	const router = useRouter();

	// [FIX 1] Default false agar di Mobile tertutup saat load
	// Di Desktop akan tetap tampil karena class 'lg:translate-x-0'
	const [isOpen, setIsOpen] = useState(false);
	const [userName, setUserName] = useState("Admin");

	useEffect(() => {
		if (typeof window !== "undefined") {
			const userStr = localStorage.getItem("user");
			if (!userStr && pathname !== "/login") {
				router.push("/login");
			} else if (userStr) {
				try {
					const user = JSON.parse(userStr);
					setTimeout(() => setUserName(user.name || "Admin"), 0);
				} catch (e) {
					console.error(e);
				}
			}
		}
	}, [pathname, router]);

	const handleLogout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		router.push("/login");
	};

	if (pathname === "/login") return null;

	const menus = [
		{name: "Dashboard", href: "/dashboard", icon: LayoutDashboard},
		{name: "Data Siswa", href: "/students", icon: GraduationCap},
		{name: "Data Guru", href: "/teachers", icon: Users},
		{name: "Akademik (Kelas/Mapel)", href: "/academic", icon: BookOpen},
		{name: "Jadwal Pelajaran", href: "/schedules", icon: Calendar},
		{name: "Keuangan & Tagihan", href: "/finance", icon: CreditCard}
	];

	return (
		<>
			{/* Mobile Toggle Button */}
			<button className="lg:hidden fixed top-4 left-4 z-50 bg-indigo-600 text-white p-2 rounded shadow-lg hover:bg-indigo-700 transition-colors" onClick={() => setIsOpen(!isOpen)}>
				{isOpen ? <X size={20} /> : <Menu size={20} />}
			</button>

			{/* [FIX 2] Backdrop / Overlay Gelap (Hanya muncul di Mobile saat Open) */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
					onClick={() => setIsOpen(false)} // Klik luar untuk tutup
				/>
			)}

			{/* Sidebar Container */}
			<aside
				className={`fixed top-0 left-0 h-screen bg-slate-900 text-white w-64 transition-transform duration-300 ease-in-out z-50 shadow-2xl 
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0`} // lg:translate-x-0 memastikan di desktop selalu muncul
			>
				{/* Logo Area */}
				<div className="h-16 flex items-center justify-center border-b border-slate-700 bg-slate-950">
					<Layers className="w-6 h-6 text-indigo-500 mr-2" />
					<span className="font-bold text-xl tracking-wide">
						Mecca<span className="text-indigo-400">Admin</span>
					</span>
				</div>

				{/* User Profile Mini */}
				<div className="p-4 border-b border-slate-800 flex items-center gap-3">
					<div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm">{userName.charAt(0).toUpperCase()}</div>
					<div className="overflow-hidden">
						<p className="text-sm font-semibold truncate w-32">{userName}</p>
						<p className="text-xs text-slate-400">Administrator</p>
					</div>
				</div>

				{/* Menu Items */}
				<nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-140px)] scrollbar-thin scrollbar-thumb-slate-700">
					{menus.map((menu) => {
						const isActive = pathname === menu.href || pathname.startsWith(`${menu.href}/`);
						return (
							<Link
								key={menu.name}
								href={menu.href}
								onClick={() => setIsOpen(false)} // Tutup sidebar saat menu diklik (Mobile)
								className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? "bg-indigo-600 text-white shadow-md ring-1 ring-indigo-500" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
							>
								<menu.icon className={`w-5 h-5 mr-3 ${isActive ? "text-white" : "text-slate-400"}`} />
								<span className="font-medium text-sm">{menu.name}</span>
							</Link>
						);
					})}
				</nav>

				{/* Logout Button */}
				<div className="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-slate-900">
					<button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors duration-200">
						<LogOut className="w-5 h-5 mr-3" />
						<span className="font-medium text-sm">Keluar</span>
					</button>
				</div>
			</aside>
		</>
	);
}
