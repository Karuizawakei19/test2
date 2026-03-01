-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "providerConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "providerConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "receiverConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "receiverConfirmedAt" TIMESTAMP(3);
