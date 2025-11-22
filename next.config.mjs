import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration pour les uploads de fichiers (images produits)
  // La limite par défaut est 1MB, on l'augmente à 10MB pour les images produits
  serverActions: {
    bodySizeLimit: "10mb",
  },
  // Configuration pour les images externes (Supabase Storage)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
