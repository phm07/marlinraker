import webpack from "webpack";
import path from "path";
import nodeExternals from "webpack-node-externals";
import TerserPlugin from "terser-webpack-plugin";

const config: webpack.Configuration = {
    mode: "production",
    entry: "./src/Server.ts",
    target: "node",
    devtool: "source-map",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "index.js",
        clean: true,
        devtoolModuleFilenameTemplate: "[resource-path]"
    },
    resolve: {
        extensions: [".js", ".ts"]
    },
    plugins: [
        new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify("production")
            }
        })
    ],
    externals: [nodeExternals()],
    externalsPresets: {
        node: true
    },
    optimization: {
        minimizer: [new TerserPlugin({
            extractComments: false
        })]
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: "ts-loader",
                exclude: /node_modules/
            }
        ]
    }
}

export default config;