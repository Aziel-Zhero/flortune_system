
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // Adicionado para permitir origens de desenvolvimento do Firebase Studio
    // Ajuste o padrão de domínio se o seu for diferente.
    allowedDevOrigins: ["*.cloudworkstations.dev"],
  },
};

export default nextConfig;
