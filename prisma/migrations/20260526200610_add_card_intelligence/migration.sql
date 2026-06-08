-- CreateTable
CREATE TABLE "CardIntelligence" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "movement" TEXT NOT NULL,
    "targets" TEXT NOT NULL,
    "range" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardIntelligence_pkey" PRIMARY KEY ("id")
);
