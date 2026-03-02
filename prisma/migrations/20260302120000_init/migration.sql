CREATE TABLE "Study" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "indication" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "versionTag" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "textExtract" TEXT,
    CONSTRAINT "Document_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ExtractionRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studyId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "modelName" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    CONSTRAINT "ExtractionRun_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExtractionRun_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ExtractedField" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "evidence" TEXT NOT NULL,
    "reviewerState" TEXT NOT NULL DEFAULT 'pending',
    "reviewerEdits" TEXT,
    "reviewReason" TEXT,
    CONSTRAINT "ExtractedField_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ExtractionRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "USDMArtifact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "usdmJson" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "USDMArtifact_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ExtractionRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "DDFArtifact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "ddfJson" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DDFArtifact_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ExtractionRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ChangeSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "baseRunId" TEXT NOT NULL,
    "compareRunId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "changes" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "FeedbackAmendment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studyId" TEXT NOT NULL,
    "amendmentDate" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "linkedUsdmPaths" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeedbackAmendment_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "USDMArtifact_runId_key" ON "USDMArtifact"("runId");
CREATE UNIQUE INDEX "DDFArtifact_runId_key" ON "DDFArtifact"("runId");
CREATE INDEX "ExtractionRun_studyId_idx" ON "ExtractionRun"("studyId");
CREATE INDEX "ExtractionRun_documentId_idx" ON "ExtractionRun"("documentId");
CREATE INDEX "ExtractedField_runId_idx" ON "ExtractedField"("runId");
CREATE INDEX "ExtractedField_path_idx" ON "ExtractedField"("path");
CREATE INDEX "FeedbackAmendment_studyId_idx" ON "FeedbackAmendment"("studyId");
