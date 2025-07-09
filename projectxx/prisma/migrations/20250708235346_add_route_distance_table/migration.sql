-- CreateTable
CREATE TABLE "RouteDistance" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "travelTime" DOUBLE PRECISION,
    "reachable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RouteDistance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RouteDistance_vendorId_warehouseId_key" ON "RouteDistance"("vendorId", "warehouseId");

-- AddForeignKey
ALTER TABLE "RouteDistance" ADD CONSTRAINT "RouteDistance_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteDistance" ADD CONSTRAINT "RouteDistance_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
