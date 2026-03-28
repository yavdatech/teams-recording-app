import "dotenv/config";

import { z } from "zod";

const csv = z
  .string()
  .transform((value) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );

const envBoolean = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return value;
}, z.boolean());

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    LOG_LEVEL: z.string().default("info"),

    BOT_ENABLED: envBoolean.default(true),
    BOT_APP_ID: z.string().optional(),
    BOT_DISPLAY_NAME: z.string().default("Meeting Recorder"),
    BOT_CALLBACK_URL: z.string().url().optional(),
    BOT_REQUESTED_MODALITIES: csv.default("audio"),
    BOT_SUPPORTS_VIDEO: envBoolean.default(false),
    BOT_ALLOW_CONVERSATION_WITHOUT_HOST: envBoolean.default(true),

    TEAMS_APP_ID: z.string().optional(),
    TEAMS_APP_SHORT_NAME: z.string().default("Meeting Recorder"),
    TEAMS_APP_FULL_NAME: z.string().default("Meeting Recorder Bot"),
    TEAMS_APP_SHORT_DESCRIPTION: z.string().default(
      "Join Teams meetings, then let backend services ingest recordings and transcripts."
    ),
    TEAMS_APP_FULL_DESCRIPTION: z.string().default(
      "Meeting Recorder joins supported Teams meetings, can be removed by organizers from the participant roster, and works with the backend ingestion service to collect transcripts and recordings after Graph publishes them."
    ),
    TEAMS_APP_DEVELOPER_NAME: z.string().default("Your Company"),
    TEAMS_APP_WEBSITE_URL: z.string().url().default("https://your-public-api.example.com"),
    TEAMS_APP_PRIVACY_URL: z.string().url().default("https://your-public-api.example.com/privacy"),
    TEAMS_APP_TERMS_URL: z.string().url().default("https://your-public-api.example.com/terms"),

    AZURE_TENANT_ID: z.string().min(1),
    AZURE_CLIENT_ID: z.string().min(1),
    AZURE_CLIENT_SECRET: z.string().optional(),
    AZURE_USE_MANAGED_IDENTITY: envBoolean.default(false),
    AZURE_MANAGED_IDENTITY_CLIENT_ID: z.string().optional(),
    AZURE_CLIENT_CERTIFICATE_PATH: z.string().optional(),
    AZURE_CLIENT_CERTIFICATE_PASSWORD: z.string().optional(),

    GRAPH_BASE_URL: z.string().url().default("https://graph.microsoft.com/v1.0"),
    GRAPH_SCOPE: z.string().default("https://graph.microsoft.com/.default"),
    GRAPH_NOTIFICATION_URL: z.string().url(),
    GRAPH_LIFECYCLE_NOTIFICATION_URL: z.string().url(),
    GRAPH_NOTIFICATION_CLIENT_STATE: z.string().min(16),
    GRAPH_SUBSCRIPTION_MODE: z.enum(["tenant", "organizers"]).default("tenant"),
    GRAPH_ORGANIZER_USER_IDS: csv.default(""),
    GRAPH_INCLUDE_RESOURCE_DATA: envBoolean.default(true),
    GRAPH_SUBSCRIPTION_TTL_MINUTES: z.coerce.number().int().min(45).max(1440).default(1440),
    GRAPH_SUBSCRIPTION_RENEWAL_WINDOW_MINUTES: z.coerce.number().int().min(5).max(1440).default(180),
    GRAPH_SUBSCRIPTION_SYNC_INTERVAL_MS: z.coerce.number().int().positive().default(900_000),
    GRAPH_ENCRYPTION_CERTIFICATE_PATH: z.string().optional(),
    GRAPH_ENCRYPTION_PRIVATE_KEY_PATH: z.string().optional(),
    GRAPH_ENCRYPTION_PRIVATE_KEY_PASSPHRASE: z.string().optional(),
    GRAPH_ENCRYPTION_CERTIFICATE_ID: z.string().optional(),

    AZURE_STORAGE_CONNECTION_STRING: z.string().min(1),
    AZURE_BLOB_CONTAINER_ARTIFACTS: z.string().min(3).default("teams-artifacts"),
    AZURE_BLOB_CONTAINER_STATE: z.string().min(3).default("teams-state"),
    AZURE_BLOB_CONTAINER_DEADLETTER: z.string().min(3).default("teams-deadletter"),

    QUEUE_MODE: z.enum(["memory", "servicebus"]).default("memory"),
    AZURE_SERVICE_BUS_CONNECTION_STRING: z.string().optional(),
    AZURE_SERVICE_BUS_INGESTION_QUEUE: z.string().min(1).default("teams-artifact-ingestion"),
    AZURE_SERVICE_BUS_COMPLIANCE_QUEUE: z.string().min(1).default("teams-meeting-compliance"),
    AZURE_SERVICE_BUS_EVENT_QUEUE: z.string().min(1).default("teams-artifact-events"),
    QUEUE_MAX_DELIVERIES: z.coerce.number().int().min(1).max(100).default(10),

    INGESTION_MAX_FETCH_ATTEMPTS: z.coerce.number().int().min(1).max(20).default(6),
    INGESTION_INITIAL_RETRY_DELAY_MS: z.coerce.number().int().min(250).default(3_000),
    INGESTION_LOCK_TTL_SECONDS: z.coerce.number().int().min(30).default(900),
    INGESTION_WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(64).default(4),

    COMPLIANCE_ENABLED: envBoolean.default(true),
    COMPLIANCE_DEFAULT_EXPECT_RECORDING: envBoolean.default(true),
    COMPLIANCE_DEFAULT_EXPECT_TRANSCRIPT: envBoolean.default(true),
    COMPLIANCE_DEFAULT_GRACE_PERIOD_MINUTES: z.coerce.number().int().min(1).max(1440).default(30),
    COMPLIANCE_REMINDER_INTERVAL_MINUTES: z.coerce.number().int().min(1).max(1440).default(30),
    COMPLIANCE_MAX_REMINDERS: z.coerce.number().int().min(0).max(100).default(3),
    COMPLIANCE_WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(32).default(2),
    COMPLIANCE_NOTIFICATION_WEBHOOK_URL: z.string().url().optional()
  })
  .superRefine((value, ctx) => {
    const hasClientSecret = Boolean(value.AZURE_CLIENT_SECRET);
    const hasClientCertificate = Boolean(value.AZURE_CLIENT_CERTIFICATE_PATH);

    if (!value.AZURE_USE_MANAGED_IDENTITY && !hasClientSecret && !hasClientCertificate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Provide AZURE_CLIENT_SECRET, AZURE_CLIENT_CERTIFICATE_PATH, or enable AZURE_USE_MANAGED_IDENTITY."
      });
    }

    if (value.GRAPH_SUBSCRIPTION_MODE === "organizers" && value.GRAPH_ORGANIZER_USER_IDS.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "GRAPH_ORGANIZER_USER_IDS must contain at least one user ID when GRAPH_SUBSCRIPTION_MODE=organizers."
      });
    }

    if (value.GRAPH_INCLUDE_RESOURCE_DATA) {
      if (!value.GRAPH_ENCRYPTION_CERTIFICATE_PATH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "GRAPH_ENCRYPTION_CERTIFICATE_PATH is required when GRAPH_INCLUDE_RESOURCE_DATA=true."
        });
      }

      if (!value.GRAPH_ENCRYPTION_PRIVATE_KEY_PATH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "GRAPH_ENCRYPTION_PRIVATE_KEY_PATH is required when GRAPH_INCLUDE_RESOURCE_DATA=true."
        });
      }

      if (!value.GRAPH_ENCRYPTION_CERTIFICATE_ID) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "GRAPH_ENCRYPTION_CERTIFICATE_ID is required when GRAPH_INCLUDE_RESOURCE_DATA=true."
        });
      }
    }

    if (value.QUEUE_MODE === "servicebus" && !value.AZURE_SERVICE_BUS_CONNECTION_STRING) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "AZURE_SERVICE_BUS_CONNECTION_STRING is required when QUEUE_MODE=servicebus."
      });
    }

    if (value.BOT_ENABLED) {
      if (!value.BOT_CALLBACK_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "BOT_CALLBACK_URL is required when BOT_ENABLED=true."
        });
      }

      if (value.BOT_REQUESTED_MODALITIES.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "BOT_REQUESTED_MODALITIES must include at least one modality when BOT_ENABLED=true."
        });
      }
    }
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration:\n${parsed.error.issues.map((issue) => `- ${issue.message}`).join("\n")}`);
}

export const env = parsed.data;
export type Env = typeof env;
