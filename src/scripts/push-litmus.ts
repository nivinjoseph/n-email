import { ConfigurationManager } from "@nivinjoseph/n-config";
import { given } from "@nivinjoseph/n-defensive";
import "@nivinjoseph/n-ext";
import { ConsoleLogger, LogDateTimeZone } from "@nivinjoseph/n-log";
import * as Fs from "fs";
import * as Path from "path";
import { SendGridEmailService } from "./send-grid-email-service";


async function execute(): Promise<void>
{
    const webpackDistDir = ConfigurationManager.getConfig<string>("webpackDistDir");
    given(webpackDistDir, "webpackDistDir").ensureHasValue().ensureIsString();
    
    const distDir = Path.resolve(process.cwd(), webpackDistDir);

    const litmusEmail = ConfigurationManager.getConfig<string>("litmusEmail");
    given(litmusEmail, "litmusEmail").ensureHasValue().ensureIsString()
        .ensure(t => t.endsWith("@litmusemail.com"), "must be a litmus email");

    const logger = new ConsoleLogger(LogDateTimeZone.local);
    const sendGrid = new SendGridEmailService();
    const timestamp = (new Date()).toLocaleString();
    const files = Fs.readdirSync(distDir).where(t => t.endsWith(".html"));

    if (files.isEmpty)
    {
        await logger.logWarning("No files to push.");
    }
    else
    {
        await logger.logWarning(`${files.length} files to push.`);

        await files
            .forEachAsync(async (file) =>
            {
                const filePath = Path.resolve(distDir, file);
                const html = Fs.readFileSync(filePath, { encoding: "utf8", flag: "r" });
                const subject = `${file.substr(0, file.length - ".html".length)} ${timestamp}`;

                await sendGrid.sendEmail(litmusEmail, subject, html, true);

                await logger.logInfo(`Pushed ${file}`);
            }, 1);

        await logger.logInfo(`Successfully pushed ${files.length} file${files.length > 1 ? "s" : ""}.`);
    }
}

execute()
    .then(() => process.exit(0))
    .catch(e =>
    {
        console.error(e);
        process.exit(1);
    });