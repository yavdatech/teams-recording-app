export interface GraphEncryptedContent {
  data: string;
  dataKey: string;
  dataSignature: string;
  encryptionCertificateId: string;
  encryptionCertificateThumbprint?: string;
}

export type GraphLifecycleEvent = "missed" | "reauthorizationRequired" | "subscriptionRemoved";

export interface GraphChangeNotification {
  changeType?: string;
  clientState?: string;
  encryptedContent?: GraphEncryptedContent;
  lifecycleEvent?: GraphLifecycleEvent;
  resource: string;
  resourceData?: Record<string, unknown>;
  subscriptionId: string;
  tenantId?: string;
}

export interface GraphNotificationCollection {
  validationTokens?: string[];
  value?: GraphChangeNotification[];
}
