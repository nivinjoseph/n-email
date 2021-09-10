"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendGridEmailService = void 0;
const tslib_1 = require("tslib");
const SendGrid = require("@sendgrid/mail");
const n_config_1 = require("@nivinjoseph/n-config");
const n_defensive_1 = require("@nivinjoseph/n-defensive");
class SendGridEmailService {
    constructor() {
        const sendGridApiKey = n_config_1.ConfigurationManager.getConfig("sendGridApiKey");
        (0, n_defensive_1.given)(sendGridApiKey, "sendGridApiKey").ensureHasValue().ensureIsString();
        SendGrid.setApiKey(sendGridApiKey);
        const sendGridSenderEmail = n_config_1.ConfigurationManager.getConfig("sendGridSenderEmail");
        (0, n_defensive_1.given)(sendGridSenderEmail, "sendGridSenderEmail").ensureHasValue().ensureIsString();
        this._senderEmail = sendGridSenderEmail;
    }
    sendEmail(toEmail, subject, body, isBodyHtml = false) {
        return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            (0, n_defensive_1.given)(toEmail, "email").ensureHasValue().ensureIsString();
            (0, n_defensive_1.given)(subject, "subject").ensureHasValue().ensureIsString();
            (0, n_defensive_1.given)(body, "body").ensureHasValue().ensureIsString();
            (0, n_defensive_1.given)(isBodyHtml, "isBodyHtml").ensureHasValue().ensureIsBoolean();
            const message = {
                to: toEmail,
                from: this._senderEmail,
                subject: subject.trim(),
                customArgs: {
                    wrMetadata: JSON.stringify({ env: n_config_1.ConfigurationManager.getConfig("env") }).base64Encode()
                }
            };
            if (isBodyHtml)
                message.html = body;
            else
                message.text = body;
            try {
                yield SendGrid.send(message);
            }
            catch (exp) {
                // throw new EmailSendException(toEmail, subject, exp);
                throw exp;
            }
        });
    }
}
exports.SendGridEmailService = SendGridEmailService;
//# sourceMappingURL=send-grid-email-service.js.map