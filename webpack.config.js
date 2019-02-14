const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
var WebpackAutoInject = require('webpack-auto-inject-version');
// const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    // entry: {
    //     'bundle.min.css': [
    //         "./src/css/main.css",
    //         "./src/css/patch.css"
    //     ],
    //     'bundle.js': [
    //         "./src/main.js"
    //     ]
    // },
    entry: {
        bundle: "./src/main.js",
        // print_bundle: "./src/print.js"
    },
    module: {
        rules: [{
            test: /\.woff$/,
            use: {
                loader: "url-loader",
                options: {
                    limit: 50000,
                },
            },
        },{
             test: /\.css$/,
             use: ["style-loader", "css-loader"]
            // use: [
            //     {
            //         loader: MiniCssExtractPlugin.loader,
            //         options: {
            //             // you can specify a publicPath here
            //             // by default it use publicPath in webpackOptions.output
            //             publicPath: '../'
            //         }
            //     },
            //     "css-loader"
            // ]
        }]
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery",
            "window.$": "jquery"
        }),
        // new MiniCssExtractPlugin({
        //     // Options similar to the same options in webpackOptions.output
        //     // both options are optional
        //     filename: "[name].css",
        //     chunkFilename: "[id].css"
        // }),
        new WebpackAutoInject({
            components: {
                AutoIncreaseVersion: false
            }
        }),
        new CopyWebpackPlugin([
            { from: "./src/index.html" },
            { from: "./src/midi.html" },
            { from: "./src/print.html" },
            // { from: "./src/templates/patch-sheet-template.html", to: "templates"},
            { from: "./src/css/midi.css", to: "css" },
            { from: "./src/favicon-16x16.png" },
            { from: "./src/favicon-32x32.png" },
            { from: "./src/favicon-96x96.png" },
            { from: "./src/help-01.png" },
            { from: "./src/help-02.png" }
            // { from: "./src/css/patch.css", to: "css" },
            // { from: "./src/css/print.css", to: "css" },
        ])  //,
        // new UglifyJSPlugin({
        //     uglifyOptions: {
        //         compress: {
        //             drop_console: true,
        //         }
        //     }
        // })
    ],
    performance: {
        maxAssetSize: 1000000,
        maxEntrypointSize: 1000000
    }
};
