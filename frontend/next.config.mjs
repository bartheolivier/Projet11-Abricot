/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*', // <-- On a enlevé le /api/ ici
      },
    ];
  },
};

export default nextConfig;
