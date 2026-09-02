-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'FIELD_AUDITOR', 'FARMER', 'CUSTOMER', 'ORGANISATION');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "IdentityStatus" AS ENUM ('UNVERIFIED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('NONE', 'DRAFT', 'SIGNED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OrganisationType" AS ENUM ('NGO', 'CSR', 'FOUNDATION', 'COMPANY', 'GOVERNMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "OrganisationStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OwnershipStatus" AS ENUM ('OWNED', 'LEASED', 'COMMUNITY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('NONE', 'DRAFT', 'SIGNED', 'ACTIVE', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ClusterStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TreeStatus" AS ENUM ('PLANNED', 'PLANTED', 'ACTIVE', 'NEEDS_ATTENTION', 'FLAGGED', 'DEAD', 'REPLACED', 'RETIRED');

-- CreateEnum
CREATE TYPE "TreeOwnership" AS ENUM ('FARMER', 'ORGANISATION', 'SHARED');

-- CreateEnum
CREATE TYPE "TagStatus" AS ENUM ('ACTIVE', 'REPLACED', 'LOST', 'DAMAGED');

-- CreateEnum
CREATE TYPE "MeasurementStatus" AS ENUM ('SUBMITTED', 'PENDING_REVIEW', 'VERIFIED', 'FLAGGED', 'REMEASURE_REQUIRED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "AuditSelection" AS ENUM ('NONE', 'SELECTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CheckSeverity" AS ENUM ('INFO', 'WARN', 'FAIL');

-- CreateEnum
CREATE TYPE "PhotoStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuditResult" AS ENUM ('PENDING', 'PASS', 'MINOR_DISCREPANCY', 'MAJOR_DISCREPANCY', 'FRAUD_SUSPECTED');

-- CreateEnum
CREATE TYPE "LedgerReason" AS ENUM ('BASE', 'SURVIVAL', 'GROWTH_BONUS', 'DEAD', 'PENALTY', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "LedgerStatus" AS ENUM ('ELIGIBLE', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Occasion" AS ENUM ('BIRTH', 'WEDDING', 'BIRTHDAY', 'MEMORIAL', 'HOUSEWARMING', 'COMMITMENT');

-- CreateEnum
CREATE TYPE "SponsorshipPlan" AS ENUM ('ONE_TIME', 'PREPAID_MULTI_YEAR', 'ORGANISATION', 'GIFT');

-- CreateEnum
CREATE TYPE "SponsorshipStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "ExperimentStatus" AS ENUM ('PLANNED', 'RUNNING', 'LEARNING', 'DECIDED');

-- CreateEnum
CREATE TYPE "ExperimentDecision" AS ENUM ('PERSEVERE', 'PIVOT', 'STOP');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "organisationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farmer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "village" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "identityStatus" "IdentityStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "contractStatus" "ContractStatus" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farmer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organisationType" "OrganisationType" NOT NULL,
    "registrationDetails" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "status" "OrganisationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProgramStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandPlot" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationLabel" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "ownershipStatus" "OwnershipStatus" NOT NULL DEFAULT 'UNKNOWN',
    "agreementStatus" "AgreementStatus" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandPlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreeCluster" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "programId" TEXT,
    "landPlotId" TEXT,
    "name" TEXT NOT NULL,
    "locationLabel" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "ClusterStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreeCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmerAgreement" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "landPlotId" TEXT,
    "organisationId" TEXT,
    "treeRights" TEXT NOT NULL,
    "harvestRights" TEXT NOT NULL,
    "replacementConditions" TEXT NOT NULL,
    "landSaleConditions" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "status" "AgreementStatus" NOT NULL DEFAULT 'DRAFT',
    "signedAt" TIMESTAMP(3),
    "documentKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmerAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tree" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "clusterId" TEXT,
    "farmerId" TEXT,
    "organisationId" TEXT,
    "landPlotId" TEXT,
    "species" TEXT NOT NULL,
    "variety" TEXT,
    "plantingDate" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "TreeStatus" NOT NULL DEFAULT 'PLANTED',
    "ownershipStatus" "TreeOwnership" NOT NULL DEFAULT 'FARMER',
    "currentGirthCm" DECIMAL(6,2),
    "currentGirthDate" TIMESTAMP(3),
    "replacementForId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreeTag" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "tagCode" TEXT NOT NULL,
    "status" "TagStatus" NOT NULL DEFAULT 'ACTIVE',
    "attachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "replacedAt" TIMESTAMP(3),
    "replacedByTagId" TEXT,
    "notes" TEXT,

    CONSTRAINT "TreeTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreeStatusHistory" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "fromStatus" "TreeStatus",
    "toStatus" "TreeStatus" NOT NULL,
    "reason" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreeStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Measurement" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "measurementDate" TIMESTAMP(3) NOT NULL,
    "measurementHeightCm" INTEGER NOT NULL,
    "girthCm" DECIMAL(6,2) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "distanceFromTreeM" INTEGER,
    "deviceMetadata" TEXT,
    "clientSubmissionId" TEXT,
    "notes" TEXT,
    "verificationStatus" "MeasurementStatus" NOT NULL DEFAULT 'SUBMITTED',
    "anomaly" BOOLEAN NOT NULL DEFAULT false,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationNotes" TEXT,
    "auditStatus" "AuditSelection" NOT NULL DEFAULT 'NONE',
    "correctsId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeasurementCheck" (
    "id" TEXT NOT NULL,
    "measurementId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "severity" "CheckSeverity" NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeasurementCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "measurementId" TEXT,
    "auditId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "thumbnailKey" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "takenAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" "PhotoStatus" NOT NULL DEFAULT 'PENDING',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "supersededById" TEXT,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL,
    "measurementId" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "auditorId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performedAt" TIMESTAMP(3),
    "reportedGirthCm" DECIMAL(6,2) NOT NULL,
    "observedGirthCm" DECIMAL(6,2),
    "observedStatus" "TreeStatus",
    "differenceCm" DECIMAL(6,2),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "result" "AuditResult" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "basePaise" INTEGER NOT NULL DEFAULT 0,
    "survivalPaise" INTEGER NOT NULL,
    "growthBonusPaise" INTEGER NOT NULL,
    "minGrowthCmForBonus" DECIMAL(5,2) NOT NULL DEFAULT 1,
    "deadPaise" INTEGER NOT NULL DEFAULT 0,
    "penaltyPaise" INTEGER NOT NULL DEFAULT 0,
    "replacementRule" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Illustrative payment model',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentLedger" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "treeId" TEXT,
    "measurementId" TEXT,
    "paymentConfigId" TEXT,
    "amountPaise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "reason" "LedgerReason" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "LedgerStatus" NOT NULL DEFAULT 'ELIGIBLE',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "externalPaymentId" TEXT,

    CONSTRAINT "PaymentLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsorship" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "treeName" TEXT NOT NULL,
    "message" TEXT,
    "occasion" "Occasion" NOT NULL,
    "planType" "SponsorshipPlan" NOT NULL DEFAULT 'PREPAID_MULTI_YEAR',
    "amountPaise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "termYears" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "status" "SponsorshipStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "girthAtStartCm" DECIMAL(6,2),
    "externalPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sponsorship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "previousState" JSONB,
    "newState" JSONB,
    "reason" TEXT,
    "requestId" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "payload" JSONB NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "NotificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experiment" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "assumption" TEXT,
    "targetAudience" TEXT,
    "experiment" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "target" TEXT,
    "result" TEXT,
    "status" "ExperimentStatus" NOT NULL DEFAULT 'PLANNED',
    "learning" TEXT,
    "decision" "ExperimentDecision",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Farmer_userId_key" ON "Farmer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Tree_publicId_key" ON "Tree"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Tree_seq_key" ON "Tree"("seq");

-- CreateIndex
CREATE UNIQUE INDEX "Tree_replacementForId_key" ON "Tree"("replacementForId");

-- CreateIndex
CREATE INDEX "Tree_farmerId_idx" ON "Tree"("farmerId");

-- CreateIndex
CREATE INDEX "Tree_clusterId_idx" ON "Tree"("clusterId");

-- CreateIndex
CREATE INDEX "Tree_organisationId_idx" ON "Tree"("organisationId");

-- CreateIndex
CREATE INDEX "Tree_status_idx" ON "Tree"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TreeTag_tagCode_key" ON "TreeTag"("tagCode");

-- CreateIndex
CREATE UNIQUE INDEX "TreeTag_replacedByTagId_key" ON "TreeTag"("replacedByTagId");

-- CreateIndex
CREATE INDEX "TreeTag_treeId_idx" ON "TreeTag"("treeId");

-- CreateIndex
CREATE INDEX "TreeStatusHistory_treeId_idx" ON "TreeStatusHistory"("treeId");

-- CreateIndex
CREATE UNIQUE INDEX "Measurement_correctsId_key" ON "Measurement"("correctsId");

-- CreateIndex
CREATE INDEX "Measurement_treeId_measurementDate_idx" ON "Measurement"("treeId", "measurementDate");

-- CreateIndex
CREATE INDEX "Measurement_verificationStatus_idx" ON "Measurement"("verificationStatus");

-- CreateIndex
CREATE INDEX "Measurement_submittedById_idx" ON "Measurement"("submittedById");

-- CreateIndex
CREATE UNIQUE INDEX "Measurement_treeId_clientSubmissionId_key" ON "Measurement"("treeId", "clientSubmissionId");

-- CreateIndex
CREATE INDEX "MeasurementCheck_measurementId_idx" ON "MeasurementCheck"("measurementId");

-- CreateIndex
CREATE UNIQUE INDEX "Photo_storageKey_key" ON "Photo"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "Photo_supersededById_key" ON "Photo"("supersededById");

-- CreateIndex
CREATE INDEX "Photo_treeId_idx" ON "Photo"("treeId");

-- CreateIndex
CREATE INDEX "Photo_measurementId_idx" ON "Photo"("measurementId");

-- CreateIndex
CREATE INDEX "Audit_treeId_idx" ON "Audit"("treeId");

-- CreateIndex
CREATE INDEX "Audit_result_idx" ON "Audit"("result");

-- CreateIndex
CREATE INDEX "PaymentLedger_farmerId_status_idx" ON "PaymentLedger"("farmerId", "status");

-- CreateIndex
CREATE INDEX "PaymentLedger_treeId_idx" ON "PaymentLedger"("treeId");

-- CreateIndex
CREATE INDEX "Sponsorship_customerId_idx" ON "Sponsorship"("customerId");

-- CreateIndex
CREATE INDEX "Sponsorship_treeId_idx" ON "Sponsorship"("treeId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationEvent_status_createdAt_idx" ON "NotificationEvent"("status", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationEvent_recipientUserId_idx" ON "NotificationEvent"("recipientUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Experiment_code_key" ON "Experiment"("code");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farmer" ADD CONSTRAINT "Farmer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandPlot" ADD CONSTRAINT "LandPlot_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreeCluster" ADD CONSTRAINT "TreeCluster_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreeCluster" ADD CONSTRAINT "TreeCluster_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreeCluster" ADD CONSTRAINT "TreeCluster_landPlotId_fkey" FOREIGN KEY ("landPlotId") REFERENCES "LandPlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmerAgreement" ADD CONSTRAINT "FarmerAgreement_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmerAgreement" ADD CONSTRAINT "FarmerAgreement_landPlotId_fkey" FOREIGN KEY ("landPlotId") REFERENCES "LandPlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmerAgreement" ADD CONSTRAINT "FarmerAgreement_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tree" ADD CONSTRAINT "Tree_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "TreeCluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tree" ADD CONSTRAINT "Tree_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tree" ADD CONSTRAINT "Tree_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tree" ADD CONSTRAINT "Tree_landPlotId_fkey" FOREIGN KEY ("landPlotId") REFERENCES "LandPlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tree" ADD CONSTRAINT "Tree_replacementForId_fkey" FOREIGN KEY ("replacementForId") REFERENCES "Tree"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreeTag" ADD CONSTRAINT "TreeTag_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreeTag" ADD CONSTRAINT "TreeTag_replacedByTagId_fkey" FOREIGN KEY ("replacedByTagId") REFERENCES "TreeTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreeStatusHistory" ADD CONSTRAINT "TreeStatusHistory_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreeStatusHistory" ADD CONSTRAINT "TreeStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_correctsId_fkey" FOREIGN KEY ("correctsId") REFERENCES "Measurement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementCheck" ADD CONSTRAINT "MeasurementCheck_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "Measurement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "Measurement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "Photo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "Measurement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentLedger" ADD CONSTRAINT "PaymentLedger_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentLedger" ADD CONSTRAINT "PaymentLedger_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentLedger" ADD CONSTRAINT "PaymentLedger_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "Measurement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentLedger" ADD CONSTRAINT "PaymentLedger_paymentConfigId_fkey" FOREIGN KEY ("paymentConfigId") REFERENCES "PaymentConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sponsorship" ADD CONSTRAINT "Sponsorship_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sponsorship" ADD CONSTRAINT "Sponsorship_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEvent" ADD CONSTRAINT "NotificationEvent_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
