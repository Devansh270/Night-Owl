-- CreateTable
CREATE TABLE "DebugSession" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebugSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebugAnalysis" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "rootCause" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "whyItHappened" TEXT NOT NULL,
    "suggestedFix" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "examWhy" TEXT NOT NULL,
    "shortExamAnswer" TEXT NOT NULL,
    "vivaQuestions" JSONB NOT NULL,

    CONSTRAINT "DebugAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DebugAnalysis_sessionId_key" ON "DebugAnalysis"("sessionId");

-- AddForeignKey
ALTER TABLE "DebugAnalysis" ADD CONSTRAINT "DebugAnalysis_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DebugSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
