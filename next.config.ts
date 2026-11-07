import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', 'mammoth', '@react-pdf/renderer', 'pdfkit'],
  outputFileTracingIncludes: {
    '/api/cv/download-pdf': [
      'node_modules/pdfkit/js/data/*.afm',
      'node_modules/pdfkit/js/standard-fonts/*.cjs',
    ],
  },

};

export default nextConfig;
