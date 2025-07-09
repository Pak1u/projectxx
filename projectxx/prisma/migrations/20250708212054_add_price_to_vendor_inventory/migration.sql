/*
  Warnings:

  - Added the required column `price` to the `Offer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `VendorInventory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "price" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "VendorInventory" ADD COLUMN     "price" DOUBLE PRECISION NOT NULL;
