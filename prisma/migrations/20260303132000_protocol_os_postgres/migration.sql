-- CreateTable
CREATE TABLE "Study" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "indication" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Study_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "versionTag" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "textExtract" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractionRun" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "modelName" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "ExtractionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractedField" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "evidence" TEXT NOT NULL,
    "reviewerState" TEXT NOT NULL DEFAULT 'pending',
    "reviewerEdits" TEXT,
    "reviewReason" TEXT,

    CONSTRAINT "ExtractedField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "USDMArtifact" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "usdmJson" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "USDMArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DDFArtifact" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "ddfJson" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DDFArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeSet" (
    "id" TEXT NOT NULL,
    "baseRunId" TEXT NOT NULL,
    "compareRunId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "changes" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackAmendment" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "amendmentDate" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "linkedUsdmPaths" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackAmendment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "globalRole" TEXT NOT NULL DEFAULT 'viewer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "indication" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMembership" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brief" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fieldsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceSnippet" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceRef" TEXT,
    "publishedDate" TIMESTAMP(3),
    "tagsJson" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvidenceSnippet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignGraph" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "nodesJson" JSONB NOT NULL,
    "edgesJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignGraph_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionNode" (
    "id" TEXT NOT NULL,
    "graphId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "selectedOptionId" TEXT,
    "contentJson" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "graphId" TEXT NOT NULL,
    "nodeKey" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "planId" TEXT,
    "proposalJson" JSONB NOT NULL,
    "scoreJson" JSONB,
    "conflictsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyProfile" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "policyJson" JSONB NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "graphVersion" INTEGER,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportArtifact" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "storageRef" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExportArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExtractionRun_studyId_idx" ON "ExtractionRun"("studyId");

-- CreateIndex
CREATE INDEX "ExtractionRun_documentId_idx" ON "ExtractionRun"("documentId");

-- CreateIndex
CREATE INDEX "ExtractedField_runId_idx" ON "ExtractedField"("runId");

-- CreateIndex
CREATE INDEX "ExtractedField_path_idx" ON "ExtractedField"("path");

-- CreateIndex
CREATE UNIQUE INDEX "USDMArtifact_runId_key" ON "USDMArtifact"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "DDFArtifact_runId_key" ON "DDFArtifact"("runId");

-- CreateIndex
CREATE INDEX "FeedbackAmendment_studyId_idx" ON "FeedbackAmendment"("studyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ProjectMembership_projectId_idx" ON "ProjectMembership"("projectId");

-- CreateIndex
CREATE INDEX "ProjectMembership_userId_idx" ON "ProjectMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMembership_projectId_userId_key" ON "ProjectMembership"("projectId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Brief_projectId_key" ON "Brief"("projectId");

-- CreateIndex
CREATE INDEX "EvidenceSnippet_projectId_idx" ON "EvidenceSnippet"("projectId");

-- CreateIndex
CREATE INDEX "DesignGraph_projectId_idx" ON "DesignGraph"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "DesignGraph_projectId_version_key" ON "DesignGraph"("projectId", "version");

-- CreateIndex
CREATE INDEX "DecisionNode_graphId_key_idx" ON "DecisionNode"("graphId", "key");

-- CreateIndex
CREATE INDEX "Proposal_graphId_nodeKey_idx" ON "Proposal"("graphId", "nodeKey");

-- CreateIndex
CREATE INDEX "PolicyProfile_projectId_idx" ON "PolicyProfile"("projectId");

-- CreateIndex
CREATE INDEX "ChangeLog_projectId_idx" ON "ChangeLog"("projectId");

-- CreateIndex
CREATE INDEX "ExportArtifact_projectId_idx" ON "ExportArtifact"("projectId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractionRun" ADD CONSTRAINT "ExtractionRun_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractionRun" ADD CONSTRAINT "ExtractionRun_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedField" ADD CONSTRAINT "ExtractedField_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ExtractionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "USDMArtifact" ADD CONSTRAINT "USDMArtifact_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ExtractionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DDFArtifact" ADD CONSTRAINT "DDFArtifact_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ExtractionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackAmendment" ADD CONSTRAINT "FeedbackAmendment_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMembership" ADD CONSTRAINT "ProjectMembership_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMembership" ADD CONSTRAINT "ProjectMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brief" ADD CONSTRAINT "Brief_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceSnippet" ADD CONSTRAINT "EvidenceSnippet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignGraph" ADD CONSTRAINT "DesignGraph_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionNode" ADD CONSTRAINT "DecisionNode_graphId_fkey" FOREIGN KEY ("graphId") REFERENCES "DesignGraph"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_graphId_fkey" FOREIGN KEY ("graphId") REFERENCES "DesignGraph"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyProfile" ADD CONSTRAINT "PolicyProfile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeLog" ADD CONSTRAINT "ChangeLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportArtifact" ADD CONSTRAINT "ExportArtifact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

