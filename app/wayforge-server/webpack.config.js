/* eslint-disable @typescript-eslint/no-var-requires */
const path = require(`path`)
const nodeExternals = require(`webpack-node-externals`)
const { CleanWebpackPlugin } = require(`clean-webpack-plugin`)
const DotenvWebpackPlugin = require(`dotenv-webpack`)

module.exports = {
  entry: `./src/main.ts`,
  output: {
    filename: `index.js`,
    path: path.resolve(__dirname, `dist`),
  },
  target: `node`,
  externals: [nodeExternals()],
  plugins: [new DotenvWebpackPlugin(), new CleanWebpackPlugin()],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: `esbuild-loader`,
            options: {
              target: `es2020`,
              platform: `node`,
              sourcemap: true,
            },
          },
        ],
      },
    ],
  },
  // resolve: {
  //   extensions: [`.ts`],
  //   fallback: {
  //     path: require.resolve(`path-browserify`),
  //   },
  // },
  mode: `development`,
  devtool: `inline-source-map`,
  devServer: { contentBase: `./dist` },
}

/* eslint-disable @typescript-eslint/no-var-requires */
// const { merge } = require(`webpack-merge`)

// module.exports = (config, context) => {
//   return merge(config, {
//     module: {
//       rules: [
//         {
//           test: /\.ts$/,
//           use: [
//             {
//               loader: `esbuild-loader`,
//               options: {
//                 target: `es2020`,
//                 platform: `node`,
//                 sourcemap: true,
//               },
//             },
//           ],
//         },
//       ],
//     },
//   })
// }
// // "webpackConfig": "apps/wayforge-server/webpack.config.js",
