-- AlterTable
ALTER TABLE "FoodListing" ADD COLUMN     "foodCategory" TEXT NOT NULL DEFAULT 'other',
ADD COLUMN     "pickupWindowEnd" TIMESTAMP(3),
ADD COLUMN     "pickupWindowStart" TIMESTAMP(3),
ADD COLUMN     "storageCondition" TEXT NOT NULL DEFAULT 'room_temp';
