-- DropForeignKey
ALTER TABLE "VendorInventory" DROP CONSTRAINT "VendorInventory_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "VendorTransitInventory" DROP CONSTRAINT "VendorTransitInventory_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "WarehouseLog" DROP CONSTRAINT "WarehouseLog_employeeId_fkey";

-- AddForeignKey
ALTER TABLE "VendorInventory" ADD CONSTRAINT "VendorInventory_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorTransitInventory" ADD CONSTRAINT "VendorTransitInventory_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseLog" ADD CONSTRAINT "WarehouseLog_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "WalmartEmployee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
