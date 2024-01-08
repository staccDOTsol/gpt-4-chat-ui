/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  reactStrictMode: true,
  swcMinify: true,
  webpack(config) {
    config.experiments = { ...config.experiments, topLevelAwait: true };
    // all the polyfills
    //fix ./node_modules/tiktoken/tiktoken_bg.wasm
//Module parse failed: Unexpected character '' (1:0)
//The module seem to be a WebAssembly module, but module is not flagged as WebAssembly module for webpack.
//You need to set 'module.type = "webassembly/sync"' to flag this module correctly for webpack.

    config.experiments  = { ...config.experiments, syncWebAssembly: true };
    config.resolve.extensions = [
      ...config.resolve.extensions,
      ".wasm",
      ".mjs",
      ".js",
      ".jsx",
      ".json",
    ];
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      crypto: false,
      stream: false,
      zlib: false,
      util: false,
      assert: false,
      buffer: "buffer",
      constants: false,
      http: false,
      https: false,
      net: false,
      tls: false,
      child_process: false,
      dns: false,
      url: false,
    };  
    return config;
  },
};
export default nextConfig;