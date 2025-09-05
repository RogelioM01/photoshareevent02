import * as nodemailer from 'nodemailer';

/**
 * EMAILIT SMTP SERVICE
 * 
 * Alternative SMTP implementation for Emailit.com using em_smtp_ credentials
 * This works with the SMTP credential type instead of REST API
 */

interface EmailSMTPOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
  }>;
}

class EmailitSMTPService {
  private transporter: any;
  private enabled: boolean;
  private smtpKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.smtpKey = process.env.EMAILIT_API_KEY || ''; // This is the em_smtp_ key
    this.fromEmail = process.env.EMAILIT_FROM_EMAIL || 'noreply@rocky.mx';
    this.fromName = process.env.EMAILIT_FROM_NAME || 'Rocky Events';
    this.enabled = !!this.smtpKey && this.smtpKey.startsWith('em_smtp_');

    if (this.enabled) {
      this.initializeSMTP();
    } else {
      console.log('⚠️ Emailit SMTP not configured - need em_smtp_ credential');
    }
  }

  private initializeSMTP() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.emailit.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.fromEmail,
        pass: this.smtpKey // The em_smtp_ credential goes here as password
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('✅ Emailit SMTP service initialized');
    console.log(`📧 SMTP Host: smtp.emailit.com`);
    console.log(`📧 SMTP User: ${this.fromEmail}`);
    console.log(`📧 SMTP Key: ${this.smtpKey.substring(0, 12)}...`);
  }

  async sendEmail(options: EmailSMTPOptions): Promise<any> {
    if (!this.enabled) {
      throw new Error('Emailit SMTP service not configured');
    }

    const mailOptions = {
      from: `${this.fromName} <${this.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo || this.fromEmail,
      attachments: options.attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType
      }))
    };

    try {
      console.log(`📧 EMAILIT SMTP: Sending to ${options.to}`);
      console.log(`📧 Subject: ${options.subject}`);
      
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ EMAILIT SMTP: Email sent successfully');
      console.log('📧 Message ID:', result.messageId);
      
      return result;
    } catch (error) {
      console.error('❌ EMAILIT SMTP: Failed to send email:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ EMAILIT SMTP: Connection verified');
      return true;
    } catch (error) {
      console.error('❌ EMAILIT SMTP: Connection failed:', error);
      return false;
    }
  }
}

export const emailitSMTPService = new EmailitSMTPService();