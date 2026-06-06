/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/LigaStatsGame',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig
