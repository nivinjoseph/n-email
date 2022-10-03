import * as SendGrid from "@sendgrid/mail";
import { ConfigurationManager } from "@nivinjoseph/n-config";
import { given } from "@nivinjoseph/n-defensive";
import { MailDataRequired } from "@sendgrid/helpers/classes/mail";


export class SendGridEmailService
{
    private readonly _senderEmail: string;
    
    public constructor()
    {
        const sendGridApiKey = ConfigurationManager.getConfig<string>("sendGridApiKey");
        given(sendGridApiKey, "sendGridApiKey").ensureHasValue().ensureIsString();
        SendGrid.setApiKey(sendGridApiKey);
        
        const sendGridSenderEmail = ConfigurationManager.getConfig<string>("sendGridSenderEmail");
        given(sendGridSenderEmail, "sendGridSenderEmail").ensureHasValue().ensureIsString();
        this._senderEmail = sendGridSenderEmail;
    }


    public async sendEmail(toEmail: string, subject: string, body: string, isBodyHtml = false): Promise<void>
    {
        given(toEmail, "email").ensureHasValue().ensureIsString();
        given(subject, "subject").ensureHasValue().ensureIsString();
        given(body, "body").ensureHasValue().ensureIsString();
        given(isBodyHtml, "isBodyHtml").ensureHasValue().ensureIsBoolean();

        const message: MailDataRequired = {
            to: toEmail,
            from: this._senderEmail,
            subject: subject.trim(),
            customArgs: {
                wrMetadata: JSON.stringify({ env: ConfigurationManager.getConfig<string>("env") }).base64Encode()
            }
        } as any;

        if (isBodyHtml)
            message.html = body;
        else
            message.text = body;

        // eslint-disable-next-line no-useless-catch
        try 
        {
            await SendGrid.send(message);
        }
        catch (exp)
        {
            // throw new EmailSendException(toEmail, subject, exp);

            throw exp;
        }
    }
}