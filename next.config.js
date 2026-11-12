/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['sequelize', 'jsonwebtoken', 'pdfkit', 'sqlite3'],
  },
  eslint: {
    dirs: ['app', 'components', 'lib'],
  },
};

module.exports = nextConfig;
