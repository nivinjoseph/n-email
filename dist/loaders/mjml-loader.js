"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const n_config_1 = require("@nivinjoseph/n-config");
require("@nivinjoseph/n-ext");
const loaderUtils = require("loader-utils");
const Path = require("path");
const Fs = require("fs");
const mjml2html = require("mjml");
const n_exception_1 = require("@nivinjoseph/n-exception");
const config = require(Path.resolve(process.cwd(), "webpack.config.js"));
const resolve = require("enhanced-resolve").create.sync({ alias: config.resolve && config.resolve.alias || [] });
module.exports = function (content) {
    this.cacheable && this.cacheable();
    // const localVariables = require(this.resourcePath.replace(".mjml", ".json"));
    const jsFilePath = this.resourcePath.replace(".mjml", ".js");
    const loaderContext = this;
    const absolutePath = resolve(Path.dirname(jsFilePath), jsFilePath);
    loaderContext.addDependency(absolutePath);
    const jsFile = Fs.readFileSync(jsFilePath, "utf8").replace("require(", "// require(");
    const localVariables = (new Function(`
            'use strict';
            return (function(exports) {
                ${jsFile}
                return exports.default; 
            });`))()({});
    const options = loaderUtils.getOptions(this) || {};
    const globalVariables = options.variables || {};
    const variables = Object.assign({}, globalVariables, localVariables);
    Object.keys(variables)
        .forEach(key => {
        let value = variables[key];
        if (key.startsWith("image:")) {
            key = key.split(":")[1];
            value = "${require('{0}')}".format(value);
        }
        if (!key.startsWith("$"))
            throw new Error(`Invalid variables key '${key}'.`);
        content = content.replaceAll(key, value.toString());
    });
    const isDev = n_config_1.ConfigurationManager.getConfig("env") === "dev";
    const mjmlOptions = isDev
        ? {
            beautify: true,
            validationLevel: "strict"
        }
        : {
            keepComments: false,
            beautify: true,
            // minify: true,
            validationLevel: "strict"
        };
    let html;
    try {
        const result = mjml2html(content, mjmlOptions);
        if (result.errors && Array.isArray(result.errors) && result.errors.isNotEmpty) {
            const logger = this.getLogger("mjml-loader");
            logger.error(`MJML error in ${this.resourcePath.replace(process.cwd(), "").substring(1)}`);
            const fileName = Path.basename(this.resourcePath);
            result.errors.forEach(e => logger.error(e.formattedMessage.replace(process.cwd(), fileName)));
        }
        html = result.html;
    }
    catch (error) {
        const logger = this.getLogger("mjml-loader");
        logger.error(`MJML error in ${this.resourcePath.replace(process.cwd(), "").substring(1)}`);
        if (error.errors && Array.isArray(error.errors) && error.errors.isNotEmpty) {
            const fileName = Path.basename(this.resourcePath);
            error.errors.forEach((e) => logger.error(e.formattedMessage.replace(process.cwd(), fileName)));
            throw new n_exception_1.Exception("MJML error", error);
        }
        else
            throw error;
    }
    if (isDev)
        html = html.replace("</body>", `<script src="index.js"></script>`);
    return html;
};
//# sourceMappingURL=mjml-loader.js.map