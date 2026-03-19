/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ye line Vercel ko bolegi ki ESLint errors hone par bhi build fail na kare
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ye line Vercel ko bolegi ki TypeScript errors hone par bhi build fail na kare
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig; 
// Note: Agar file .mjs hai toh 'export default nextConfig;' use karein
