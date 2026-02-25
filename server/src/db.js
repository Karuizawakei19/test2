

// PrismaClient - use t0 talk to the database
const { PrismaClient } = require('@prisma/client');

// Create one single connection shared across the whole server

const prisma = new PrismaClient();

module.exports = prisma;