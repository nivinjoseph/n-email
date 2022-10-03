/* eslint-disable @typescript-eslint/no-unsafe-call */
const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
import { ConfigurationManager } from "@nivinjoseph/n-config";
const webpack = require("webpack");


const env = ConfigurationManager.getConfig<string>("env");
console.log("WEBPACK ENV", env);

const isDev = env === "dev";

const moduleRules: Array<any> = [
    {
        test: /\.(png|jpg|jpeg|gif|webp|svg)$/i,
        use: [
            isDev ? {
                loader: "file-loader",
                options: {
                    esModule: false,
                    name: (_resourcePath: string, _resourceQuery: string): string =>
                    {
                        return "[name].[ext]";
                    }
                }
            } : {
                loader: "./src/loaders/aws-file-loader.js",
                options: {
                    awsS3AccessKeyId: ConfigurationManager.getConfig("awsS3AccessKeyId"),
                    awsS3SecretAccessKey: ConfigurationManager.getConfig("awsS3SecretAccessKey"),
                    awsS3Bucket: ConfigurationManager.getConfig("awsS3Bucket")
                }
            },
            {
                loader: "./src/loaders/image-loader.js",
                options: {
                    jpegQuality: 80,
                    pngQuality: 60
                }
            }
        ]
    },
    {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
            isDev ? "file-loader" : {
                loader: "url-loader",
                options: {
                    limit: 9000,
                    fallback: "file-loader"
                }
            }
        ]
    },
    {
        test: /\.mjml$/,
        use: [
            ...["file-loader?name=[name].html", "extract-loader"],
            {
                loader: "html-loader",
                options: {
                    attrs: ["img:src", "use:xlink:href"],
                    interpolate: "require"
                }
            },
            {
                loader: "./src/loaders/mjml-loader.js",
                options: {
                    // variables: require("./test-emails/variables.json")
                    variables: {
                        "$primary-color": "green"
                    }
                }
            }
        ]
    }
];

const plugins = [
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin({
        APP_CONFIG: JSON.stringify({})
    })
];

module.exports = {
    stats: {
        errorDetails: true
    },
    context: process.cwd(),
    mode: isDev ? "development" : "production",
    target: "web",
    entry: ["./test-emails/index.js"],
    output: {
        filename: "index.js",
        path: path.resolve(process.cwd(), ConfigurationManager.getConfig<string>("distDir")),
        publicPath: ""
    },
    devtool: false,
    devServer: {
        static: {
            directory: ConfigurationManager.getConfig<string>("distDir")
        },
        // hot: true,
        // liveReload: true,
        watchFiles: ["test-emails/**/*.mjml", "test-emails/**/*.js"]
        // contentBase: "./dist",
        // contentBase: ConfigurationManager.getConfig<string>("distDir")
    },
    optimization: {
        minimize: false
    },
    module: {
        rules: moduleRules
    },
    plugins: plugins,
    resolve: {
        alias: {
            // https://feathericons.com/
            // feather: path.resolve(__dirname, "node_modules/feather-icons/dist/feather-sprite.svg")
        }
    }
};