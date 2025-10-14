/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    // In Docker, use the container name; otherwise use localhost
    const apiUrl = process.env.API_URL ?
      `${process.env.API_URL}/api/:path*` :
      'http://localhost:4001/api/:path*';
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