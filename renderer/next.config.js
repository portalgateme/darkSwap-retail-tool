/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'export',
  distDir: '../dist/renderer/out',
  images: { unoptimized: true } // 👈 quan trọng cho Electron
}

module.exports = nextConfig
