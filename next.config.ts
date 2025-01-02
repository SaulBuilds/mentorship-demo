import type { NextConfig } from "next";
import withTM from 'next-transpile-modules';

const withTranspiledModules = withTM(['three']);



const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  transpilePackages: ['three'],
    swcMinify: true,
    // Add any other Next.js configuration options here
  };
  
  export default withTranspiledModules(nextConfig);
