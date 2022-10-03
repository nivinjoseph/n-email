"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const n_config_1 = require("@nivinjoseph/n-config");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
require("@nivinjoseph/n-ext");
const n_log_1 = require("@nivinjoseph/n-log");
const Fs = require("fs");
const Path = require("path");
const send_grid_email_service_1 = require("./send-grid-email-service");
function execute() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const distDir = n_config_1.ConfigurationManager.getConfig("distDir");
        (0, n_defensive_1.given)(distDir, "distDir").ensureHasValue().ensureIsString();
        const distDirPath = Path.resolve(process.cwd(), distDir);
        const litmusEmail = n_config_1.ConfigurationManager.getConfig("litmusEmail");
        (0, n_defensive_1.given)(litmusEmail, "litmusEmail").ensureHasValue().ensureIsString()
            .ensure(t => t.endsWith("@litmusemail.com"), "must be a litmus email");
        const logger = new n_log_1.ConsoleLogger({ logDateTimeZone: n_log_1.LogDateTimeZone.local });
        const sendGrid = new send_grid_email_service_1.SendGridEmailService();
        const timestamp = new Date().toLocaleString();
        const files = Fs.readdirSync(distDirPath).where(t => t.endsWith(".html"));
        if (files.isEmpty) {
            yield logger.logWarning("No files to push.");
        }
        else {
            yield logger.logWarning(`${files.length} files to push.`);
            yield files
                .forEachAsync((file) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const filePath = Path.resolve(distDirPath, file);
                const html = Fs.readFileSync(filePath, { encoding: "utf8", flag: "r" });
                const subject = `${file.substr(0, file.length - ".html".length)} ${timestamp}`;
                yield sendGrid.sendEmail(litmusEmail, subject, html, true);
                yield logger.logInfo(`Pushed ${file}`);
            }), 1);
            yield logger.logInfo(`Successfully pushed ${files.length} file${files.length > 1 ? "s" : ""}.`);
        }
    });
}
execute()
    .then(() => process.exit(0))
    .catch(e => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=push-litmus.js.map