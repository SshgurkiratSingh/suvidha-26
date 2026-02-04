-- CreateEnum
CREATE TYPE "Department" AS ENUM ('ELECTRICITY', 'GAS', 'WATER', 'SANITATION', 'MUNICIPAL');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('BILL_PAYMENT', 'NEW_CONNECTION', 'LOAD_CHANGE', 'NAME_CHANGE', 'CONNECTION_REMOVAL', 'REFILL', 'GRIEVANCE', 'SCHEME_APPLICATION', 'WATER_QUALITY_TEST');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'UNDER_PROCESS', 'DEMAND_NOTE_ISSUED', 'PAYMENT_PENDING', 'APPROVED', 'REJECTED', 'DELIVERED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('INITIATED', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "AuthType" AS ENUM ('OTP');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER', 'SUPPORT', 'ANALYST');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('ADMIN', 'CITIZEN', 'SYSTEM');

-- CreateTable
CREATE TABLE "Citizen" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Citizen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "authType" "AuthType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAccount" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "department" "Department" NOT NULL,
    "consumerId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "serviceAccountId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "billId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "receiptNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "department" "Department" NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "status" "ApplicationStatus" NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schemeId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "data" JSONB,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grievance" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "department" "Department" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "data" JSONB,

    CONSTRAINT "Grievance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT,
    "grievanceId" TEXT,
    "fileUrl" TEXT NOT NULL,
    "localPath" TEXT,
    "extractedText" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicService" (
    "id" TEXT NOT NULL,
    "department" "Department" NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requiredDocuments" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicScheme" (
    "id" TEXT NOT NULL,
    "department" "Department" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eligibility" TEXT NOT NULL,

    CONSTRAINT "PublicScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Advisory" (
    "id" TEXT NOT NULL,
    "department" "Department" NOT NULL,
    "message" TEXT NOT NULL,
    "validTill" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advisory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "department" "Department" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "effectiveFrom" TIMESTAMP(3),
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tariff" (
    "id" TEXT NOT NULL,
    "department" "Department" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "rate" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tariff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterQualityTest" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "sampleAddress" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL,
    "reportUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaterQualityTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'SUPER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorReport" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Citizen_mobileNumber_key" ON "Citizen"("mobileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Citizen_email_key" ON "Citizen"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAccount" ADD CONSTRAINT "ServiceAccount_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_serviceAccountId_fkey" FOREIGN KEY ("serviceAccountId") REFERENCES "ServiceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "PublicScheme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_grievanceId_fkey" FOREIGN KEY ("grievanceId") REFERENCES "Grievance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterQualityTest" ADD CONSTRAINT "WaterQualityTest_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
