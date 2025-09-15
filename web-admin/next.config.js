/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  basePath: '/admin',
  async rewrites() {
    // In Docker, use the container name; otherwise use localhost
    const apiUrl = process.env.API_URL ?
      `${process.env.API_URL}/:path*` :
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