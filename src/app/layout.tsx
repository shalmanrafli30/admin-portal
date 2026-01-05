import "./globals.css";
import {Inter} from "next/font/google";
import type {Metadata} from "next";
import Sidebar from "@/components/Sidebar";
import MainLayout from "@/components/MainLayout"; // Import Wrapper Baru

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
	title: "Mecca School Admin App",
	description: "Mecca School Admin App"
};

export default function RootLayout({children}: {children: React.ReactNode}) {
	return (
		<html lang="en">
			<body className={`${inter.className} bg-gray-100 text-gray-900`}>
				{/* Sidebar (Otomatis hidden di /login karena logic di dalamnya) */}
				<Sidebar />

				{/* Main Content dibungkus Wrapper agar paddingnya dinamis */}
				<MainLayout>{children}</MainLayout>
			</body>
		</html>
	);
}
