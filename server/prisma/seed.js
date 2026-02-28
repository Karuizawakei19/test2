const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const provider = await prisma.user.findFirst({
    where: { role: 'provider' }
  });

  if (!provider) {
    console.log('No provider found. Register a provider account first, then run this script.');
    return;
  }

  console.log(`Creating Cebu listings for provider: ${provider.name}`);

  const now = new Date();

  await prisma.foodListing.createMany({
    data: [
      {
        foodName: 'Lechon Meal Packs',
        quantity: 8,
        originalPrice: 150,
        address: 'Fuente Osmeña Circle, Cebu City',
        latitude: 10.3103,
        longitude: 123.8944,
        expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
        providerId: provider.id,
      },
      {
        foodName: 'Day-old Ensaymada',
        quantity: 15,
        originalPrice: 40,
        address: 'Mandaue City Public Market, Mandaue City',
        latitude: 10.3231,
        longitude: 123.9411,
        expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        providerId: provider.id,
      },
      {
        foodName: 'Rice & BBQ Combo',
        quantity: 10,
        originalPrice: 120,
        address: 'Lapu-Lapu City Hall, Lapu-Lapu City',
        latitude: 10.3100,
        longitude: 123.9494,
        expiresAt: new Date(now.getTime() + 5 * 60 * 60 * 1000),
        providerId: provider.id,
      },
      {
        foodName: 'Assorted Bread & Pastries',
        quantity: 20,
        originalPrice: 60,
        address: 'Carcar Public Market, Carcar City',
        latitude: 10.1077,
        longitude: 123.6400,
        expiresAt: new Date(now.getTime() + 1 * 60 * 60 * 1000),
        providerId: provider.id,
      },
      {
        foodName: 'Fresh Lumpia Packs',
        quantity: 12,
        originalPrice: 70,
        address: 'Danao City Plaza, Danao City',
        latitude: 10.5203,
        longitude: 124.0270,
        expiresAt: new Date(now.getTime() + 3 * 60 * 60 * 1000),
        providerId: provider.id,
      },
    ],
  });

  console.log('seed data created!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());