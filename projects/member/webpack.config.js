const { ModuleFederationPlugin } = require("webpack").container;

module.exports = {
  output: {
    uniqueName: "opdWalletUser",
    publicPath: "auto",
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
        "@angular/core": { singleton: true, strictVersion: false, requiredVersion: false },
        "@angular/router": { singleton: true, strictVersion: false, requiredVersion: false },
        rxjs: { singleton: true, strictVersion: false, requiredVersion: false },
      },
    }),
  ],
};