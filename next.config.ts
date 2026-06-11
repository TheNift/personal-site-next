import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	deploymentId: "personal-site",
	webpack(config) {
		config.module.rules.push({
			test: /\.(vert|frag)$/,
			type: 'asset/source',
		});
		return config;
	},
};

export default nextConfig;
