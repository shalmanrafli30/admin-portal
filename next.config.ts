import type {NextConfig} from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "api.meccaschool.online",
				port: "",
				pathname: "/uploads/**"
			}
		]
	}
};

export default nextConfig;
