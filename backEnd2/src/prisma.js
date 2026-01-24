require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const sslEnabled = process.env.PG_SSL_DISABLE !== "true";
const rejectUnauthorized = process.env.PG_SSL_REJECT_UNAUTHORIZED === "true";

// If we are accepting unauthorized certs (self-signed), we might need to suppress Node's warning/error
if (sslEnabled && !rejectUnauthorized) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslEnabled
    ? {
        rejectUnauthorized,
      }
    : false,
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

module.exports = { prisma };
