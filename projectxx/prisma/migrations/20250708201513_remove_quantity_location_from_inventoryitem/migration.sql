/*
  Warnings:

  - You are about to drop the column `location` on the `InventoryItem` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `InventoryItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "InventoryItem" DROP COLUMN "location",
DROP COLUMN "quantity";
