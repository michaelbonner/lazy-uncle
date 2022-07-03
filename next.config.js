/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa");

const settings = {
  env: {},
  i18n: {
    locales: ["en-US"],
    defaultLocale: "en-US",
  },
  devIndicators: {
    autoPrerender: false,
  },
  reactStrictMode: true,
  pwa: {
    dest: "public",
  },
};

module.exports =
  process.env.NODE_ENV === "development" ? settings : withPWA(settings);
