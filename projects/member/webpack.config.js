const { ModuleFederationPlugin } = require("webpack").container;

module.exports = {
  output: {
    uniqueName: "opdWalletUser",
    // "auto" makes webpack emit a runtime that resolves the public path from
    // `import.meta.url`, which is a syntax error when remoteEntry.js is
    // loaded via a plain <script> tag (as the host does) instead of as an ES
    // module, so it can't be used here. OPD_WALLET_PUBLIC_PATH is set by
    // `npm start` for local dev and should be set by CI/CD for deployed
    // builds; the literal below is only a safety net for builds where it
    // isn't. Both branches are normalized to end in exactly one "/", since
    // webpack's chunk loader concatenates this directly with the chunk
    // filename with no separator of its own.
    publicPath: process.env.OPD_WALLET_PUBLIC_PATH
      ? `${process.env.OPD_WALLET_PUBLIC_PATH}/`
      : "auto",
  },
  optimization: {
    runtimeChunk: false,
  },
  devServer: {
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "opdWalletUser",
      filename: "remoteEntry.js",
      exposes: {
        "./Routes": "./projects/member/src/app/app.routes.ts",
      },
      library:{
        type: 'var',
        name: 'opdWalletUser'
      },
      shared: {
        "@angular/common": { singleton: true, strictVersion: false, requiredVersion: false },
        "@angular/common/http": { singleton: true, strictVersion: false, requiredVersion: false },
        "@angular/core": { singleton: true, strictVersion: false, requiredVersion: false },
        "@angular/router": { singleton: true, strictVersion: false, requiredVersion: false },
        rxjs: { singleton: true, strictVersion: false, requiredVersion: false },
      },
    }),
  ],
};