import { ArtifactReference, ArtifactType, ParentResourceType, ResourceScope } from "../shared/types";
import { NonRetriableError } from "../shared/errors";

const PATH_PATTERNS: Array<{
  parentResourceType: ParentResourceType;
  pattern: RegExp;
  resourceScope: ResourceScope;
}> = [
  {
    parentResourceType: "onlineMeeting",
    pattern:
      /^users\/(?<ownerUserId>[^/]+)\/onlineMeetings\/(?<parentResourceId>[^/]+)\/(?<collection>transcripts|recordings)\/(?<artifactId>[^/]+)$/i,
    resourceScope: "user"
  },
  {
    parentResourceType: "adhocCall",
    pattern:
      /^users\/(?<ownerUserId>[^/]+)\/adhocCalls\/(?<parentResourceId>[^/]+)\/(?<collection>transcripts|recordings)\/(?<artifactId>[^/]+)$/i,
    resourceScope: "user"
  },
  {
    parentResourceType: "onlineMeeting",
    pattern:
      /^communications\/onlineMeetings\/(?<parentResourceId>[^/]+)\/(?<collection>transcripts|recordings)\/(?<artifactId>[^/]+)$/i,
    resourceScope: "communications"
  },
  {
    parentResourceType: "adhocCall",
    pattern:
      /^communications\/adhocCalls\/(?<parentResourceId>[^/]+)\/(?<collection>transcripts|recordings)\/(?<artifactId>[^/]+)$/i,
    resourceScope: "communications"
  }
];

export function normalizeGraphResourcePath(resource: string): string {
  return resource
    .trim()
    .replace(/^https:\/\/graph\.microsoft\.com\/v1\.0\//i, "")
    .replace(/^\/+/, "")
    .replace(/\('([^']+)'\)/g, "/$1")
    .replace(/\("([^"]+)"\)/g, "/$1")
    .replace(/adhoccalls/gi, "adhocCalls")
    .replace(/\/content$/i, "");
}

export function parseArtifactReference(resource: string): ArtifactReference {
  const normalizedResourcePath = normalizeGraphResourcePath(resource);

  for (const descriptor of PATH_PATTERNS) {
    const match = descriptor.pattern.exec(normalizedResourcePath);
    if (!match?.groups) {
      continue;
    }

    const collection = match.groups.collection.toLowerCase();
    const artifactType: ArtifactType = collection === "transcripts" ? "transcript" : "recording";

    return {
      artifactType,
      artifactId: match.groups.artifactId,
      normalizedResourcePath,
      ownerUserId: match.groups.ownerUserId,
      parentResourceId: match.groups.parentResourceId,
      parentResourceType: descriptor.parentResourceType,
      resourceScope: descriptor.resourceScope
    };
  }

  throw new NonRetriableError(`Unsupported Microsoft Graph resource path: ${resource}`);
}

export function buildGraphArtifactPath(reference: ArtifactReference): string {
  const collection = pluralize(reference.artifactType);

  if (reference.resourceScope === "communications") {
    const scopeCollection = reference.parentResourceType === "onlineMeeting" ? "onlineMeetings" : "adhocCalls";
    return `communications/${scopeCollection}/${reference.parentResourceId}/${collection}/${reference.artifactId}`;
  }

  if (!reference.ownerUserId) {
    throw new NonRetriableError(`User-scoped artifact is missing ownerUserId: ${reference.normalizedResourcePath}`);
  }

  const scopeCollection = reference.parentResourceType === "onlineMeeting" ? "onlineMeetings" : "adhocCalls";
  return `users/${reference.ownerUserId}/${scopeCollection}/${reference.parentResourceId}/${collection}/${reference.artifactId}`;
}

export function buildGraphArtifactContentPath(reference: ArtifactReference): string {
  return `${buildGraphArtifactPath(reference)}/content`;
}

function pluralize(type: ArtifactType): "transcripts" | "recordings" {
  return type === "transcript" ? "transcripts" : "recordings";
}
