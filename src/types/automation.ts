// Automatisierung: Recurring Jobs und E-Mail-Versand

export interface RecurringPayrollJob {
  id: string;
  name: string;
  description: string;
  schedule: PayrollSchedule;
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
  employeeFilter: EmployeeFilter;
  actions: PayrollAction[];
  notifications: NotificationSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollSchedule {
  type: 'monthly' | 'weekly' | 'custom';
  dayOfMonth?: number; // für monthly: z.B. 25 für den 25. des Monats
  dayOfWeek?: number; // für weekly: 0-6 (Sonntag-Samstag)
  customCron?: string; // für complex schedules
  timeZone: string;
}

export interface EmployeeFilter {
  includeAll: boolean;
  departments?: string[];
  employeeIds?: string[];
  employmentTypes?: ('fulltime' | 'parttime' | 'minijob')[];
  excludeIds?: string[];
}

export interface PayrollAction {
  type: PayrollActionType;
  enabled: boolean;
  settings: Record<string, any>;
}

export type PayrollActionType =
  | 'calculate_payroll' // Lohnabrechnung berechnen
  | 'generate_pdf' // PDF generieren
  | 'send_email' // E-Mail versenden
  | 'export_datev' // DATEV-Export
  | 'create_bank_transfer' // Überweisung vorbereiten
  | 'update_time_tracking' // Zeiterfassung übernehmen
  | 'validate_compliance'; // Compliance prüfen

export interface NotificationSettings {
  email: EmailNotification;
  webhooks: WebhookNotification[];
}

export interface EmailNotification {
  enabled: boolean;
  recipients: string[];
  sendOnSuccess: boolean;
  sendOnError: boolean;
  template: EmailTemplate;
}

export interface WebhookNotification {
  enabled: boolean;
  url: string;
  events: ('success' | 'error' | 'started')[];
  headers?: Record<string, string>;
}

export interface EmailTemplate {
  subject: string;
  bodyHtml: string;
  bodyText: string;
  attachments: EmailAttachment[];
}

export interface EmailAttachment {
  type: 'payslip_pdf' | 'summary_excel' | 'datev_export';
  fileName: string;
  includePerEmployee: boolean;
}

export interface PayrollJobExecution {
  id: string;
  jobId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  progress: {
    totalEmployees: number;
    processedEmployees: number;
    currentStep: string;
    percentage: number;
  };
  results: PayrollJobResult[];
  errors: string[];
  summary: {
    successCount: number;
    errorCount: number;
    totalAmount: number;
    emailsSent: number;
  };
}

export interface PayrollJobResult {
  employeeId: string;
  employeeName: string;
  status: 'success' | 'error' | 'skipped';
  payrollId?: string;
  netAmount?: number;
  actions: ActionResult[];
  error?: string;
}

export interface ActionResult {
  type: PayrollActionType;
  status: 'success' | 'error' | 'skipped';
  result?: any;
  error?: string;
  duration: number; // milliseconds
}

// E-Mail-Versand-System
export interface EmailSystem {
  provider: EmailProvider;
  settings: EmailProviderSettings;
  templates: EmailTemplateLibrary;
  queue: EmailQueue;
}

export type EmailProvider = 'smtp' | 'sendgrid' | 'mailgun' | 'ses' | 'office365';

export interface EmailProviderSettings {
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
  };
  sendgrid?: {
    apiKey: string;
  };
  mailgun?: {
    apiKey: string;
    domain: string;
  };
  ses?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
}

export interface EmailTemplateLibrary {
  payslip: EmailTemplate;
  monthlyReport: EmailTemplate;
  complianceAlert: EmailTemplate;
  jobCompletion: EmailTemplate;
  errorNotification: EmailTemplate;
}

export interface EmailQueue {
  pending: QueuedEmail[];
  sent: SentEmail[];
  failed: FailedEmail[];
}

export interface QueuedEmail {
  id: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml: string;
  bodyText: string;
  attachments: EmailAttachmentData[];
  scheduledFor: Date;
  priority: 'low' | 'normal' | 'high';
  retryCount: number;
  maxRetries: number;
  tags: string[];
}

export interface SentEmail {
  id: string;
  queuedEmailId: string;
  sentAt: Date;
  messageId: string;
  deliveryStatus: 'delivered' | 'bounced' | 'complained';
}

export interface FailedEmail {
  id: string;
  queuedEmailId: string;
  failedAt: Date;
  error: string;
  retryScheduled?: Date;
}

export interface EmailAttachmentData {
  filename: string;
  content: Buffer | string;
  contentType: string;
  encoding?: string;
}

// Webhook-Integration für Zapier etc.
export interface WebhookIntegration {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  isActive: boolean;
  secret?: string;
  headers?: Record<string, string>;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  lastTriggered?: Date;
  successCount: number;
  errorCount: number;
}

export type WebhookEvent = 
  | 'payroll.calculated'
  | 'payroll.approved'
  | 'employee.added'
  | 'employee.updated'
  | 'compliance.alert'
  | 'job.completed'
  | 'export.ready';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: Date;
  data: any;
  source: string;
}