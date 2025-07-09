/*
  Warnings:

  - Added the required column `warehouseId` to the `BillingRecord` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ItemRequestStatus" AS ENUM ('PENDING', 'FULFILLED');

-- DropForeignKey
ALTER TABLE "BillingRecord" DROP CONSTRAINT "BillingRecord_orderId_fkey";

-- AlterTable
ALTER TABLE "BillingRecord" ADD COLUMN     "itemRequestId" TEXT,
ADD COLUMN     "warehouseId" TEXT NOT NULL,
ALTER COLUMN "orderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ItemRequest" ADD COLUMN     "status" "ItemRequestStatus" NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "BillingRecord" ADD CONSTRAINT "BillingRecord_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingRecord" ADD CONSTRAINT "BillingRecord_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingRecord" ADD CONSTRAINT "BillingRecord_itemRequestId_fkey" FOREIGN KEY ("itemRequestId") REFERENCES "ItemRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
