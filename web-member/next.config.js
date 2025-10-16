/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  typescript: {
    // ⚠️ Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    // In Docker, use the container name; otherwise use localhost
    const apiUrl = process.env.API_URL ?
      `${process.env.API_URL}/api/:path*` :
      'http://localhost:4000/api/:path*';
    console.log('API URL for rewrites:', apiUrl);

    return [
      {
        source: '/api/:path*',
        destination: apiUrl,
      },
    ];
  },
};

module.exports = nextConfig;