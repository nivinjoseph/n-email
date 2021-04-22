export declare class SendGridEmailService {
    private readonly _senderEmail;
    constructor();
    sendEmail(toEmail: string, subject: string, body: string, isBodyHtml?: boolean): Promise<void>;
}
