/** @type {import('next').NextConfig} */
const nextConfig = {
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "host", value: "freelogictest.com" }],
        destination: "/iq/sondage-light",
        permanent: true,
      },
      {
        source: "/",
        has: [{ type: "host", value: "www.freelogictest.com" }],
        destination: "/iq/sondage-light",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
