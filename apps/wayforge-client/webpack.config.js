/* eslint-disable @typescript-eslint/no-var-requires */
const { merge } = require(`webpack-merge`)

module.exports = (config, context) => {
  return merge(config, {
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
  })
}
// "webpackConfig": "apps/wayforge-server/webpack.config.js",
// "webpackConfig": "@nrwl/react/plugins/webpack"
