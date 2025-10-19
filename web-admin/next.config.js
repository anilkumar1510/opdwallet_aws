/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/admin',
  reactStrictMode: true,
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
    // API_URL already includes /api, so we use it directly with the path
    const apiBaseUrl = process.env.API_URL ?
      process.env.API_URL.replace(/\/api$/, '') :  // Remove trailing /api if present
      'http://localhost:4000';
    const apiUrl = `${apiBaseUrl}/api/:path*`;
    console.log('API URL for rewrites:', apiUrl);

    // With basePath: '/admin', all routes are automatically prefixed
    // So /api/:path* will match requests to /admin/api/:path* from the frontend
    return [
      {
        source: '/api/:path*',
        destination: apiUrl,
      },
    ];
  },
};

module.exports = nextConfig;