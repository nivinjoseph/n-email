/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ConfigurationManager } from "@nivinjoseph/n-config";
import "@nivinjoseph/n-ext";
const loaderUtils = require("loader-utils");
import * as Path from "path";
import * as Fs from "fs";
import mjml2html = require("mjml");
import { ApplicationException } from "@nivinjoseph/n-exception";
import { LoaderContext } from "webpack";
const config = require(Path.resolve(process.cwd(), "webpack.config.js"));
const resolve = require("enhanced-resolve").create.sync({ alias: config.resolve && config.resolve.alias || [] });


module.exports = function (this: LoaderContext<any>, content: any): string
{
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions, @typescript-eslint/no-unnecessary-condition
    this.cacheable && this.cacheable();

    // const localVariables = require(this.resourcePath.replace(".mjml", ".json"));

    const jsFilePath = this.resourcePath.replace(".mjml", ".js");
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const loaderContext = this;

    const absolutePath = resolve(Path.dirname(jsFilePath), jsFilePath);
    loaderContext.addDependency(absolutePath);


    const jsFile = Fs.readFileSync(jsFilePath, "utf8").replace("require(", "// require(");
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const localVariables = new Function(`
            'use strict';
            return (function(exports) {
                ${jsFile}
                return exports.default; 
            });`)()({});

    const options = loaderUtils.getOptions(this) || {};
    const globalVariables = options.variables || {};
    const variables = Object.assign({}, globalVariables, localVariables);
    Object.keys(variables)
        .forEach(key =>
        {
            let value = variables[key];

            if (key.startsWith("image:"))
            {
                key = key.split(":")[1];
                value = "${require('{0}')}".format(value);
            }

            if (!key.startsWith("$"))
                throw new Error(`Invalid variables key '${key}'.`);

            content = (content as string).replaceAll(key, value.toString());
        });

    const isDev = ConfigurationManager.getConfig("env") === "dev";
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


    let html: string;

    try 
    {
        const result = mjml2html(content, mjmlOptions as any);
        
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (result.errors && Array.isArray(result.errors) && result.errors.isNotEmpty)
        {
            const logger = this.getLogger("mjml-loader");
            logger.error(`MJML error in ${this.resourcePath.replace(process.cwd(), "").substring(1)}`);
            const fileName = Path.basename(this.resourcePath);
            result.errors.forEach(e => logger.error(e.formattedMessage.replace(process.cwd(), fileName)));
        }

        html = result.html;
    }
    catch (e)
    {
        const error = e as any;
        
        const logger = this.getLogger("mjml-loader");
        logger.error(`MJML error in ${this.resourcePath.replace(process.cwd(), "").substring(1)}`);

        if (error.errors && Array.isArray(error.errors) && error.errors.isNotEmpty)
        {
            const fileName = Path.basename(this.resourcePath);
            error.errors.forEach((e: any) => logger.error(e.formattedMessage.replace(process.cwd(), fileName)));

            throw new ApplicationException("MJML error", error);
        }
        else
            throw error;
    }

    if (isDev)
        html = html.replace("</body>", `<script src="index.js"></script></body>`);

    return html;
};