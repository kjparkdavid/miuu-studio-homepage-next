/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  // pin the project root (Next 15 otherwise guesses from lockfiles found in parent folders)
  outputFileTracingRoot: __dirname,
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
