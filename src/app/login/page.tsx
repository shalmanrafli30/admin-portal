"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import axios from "axios";
import {ShieldCheck, Loader2, Lock, ArrowRight} from "lucide-react";

export default function AdminLoginPage() {
	const router = useRouter();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const response = await axios.post("https://api.meccaschool.online/graphql", {
				query: `
          mutation Login($username: String!, $password: String!, $role: String!) {
            login(username: $username, password: $password, role: $role) {
              token
              user {
                id
                username
                name
                role
              }
            }
          }
        `,
				variables: {
					username,
					password,
					role: "admin" // Role Admin
				}
			});

			if (response.data.errors) {
				throw new Error(response.data.errors[0].message);
			}

			const {token, user} = response.data.data.login;

			// Double check role di client
			if (user.role !== "admin") throw new Error("Akses ditolak. Bukan Admin.");

			localStorage.setItem("token", token);
			localStorage.setItem("user", JSON.stringify(user));

			router.push("/dashboard");
		} catch (err: unknown) {
			console.error(err);
			// Menangkap pesan error dari GraphQL atau Network
			let msg = "Login gagal. Cek username/password.";
			if (err instanceof Error) {
				msg = err.message;
			}
			setError(msg);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
			<div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-4 border-indigo-600">
				<div className="flex justify-center mb-6">
					<div className="bg-indigo-100 p-4 rounded-full shadow-inner">
						<ShieldCheck className="text-indigo-700 w-12 h-12" />
					</div>
				</div>

				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-800">Admin Portal</h1>
					<p className="text-gray-500 text-sm mt-1">Mecca School Management System</p>
				</div>

				{error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center border border-red-200">{error}</div>}

				<form onSubmit={handleLogin} className="space-y-5">
					<div>
						<label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
						<input type="text" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-800" placeholder="admin" value={username} onChange={(e) => setUsername(e.target.value)} />
					</div>
					<div>
						<label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
						<div className="relative">
							<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
							<input type="password" required className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-800" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
						</div>
					</div>
					<button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-lg transition-all flex justify-center items-center shadow-lg transform active:scale-[0.98]">
						{loading ? (
							<Loader2 className="animate-spin w-5 h-5" />
						) : (
							<span className="flex items-center">
								Masuk Dashboard <ArrowRight className="ml-2 w-4 h-4" />
							</span>
						)}
					</button>
				</form>
			</div>
		</div>
	);
}
