require("dotenv").config();
const bcrypt = require("bcryptjs");
const { prisma } = require("../src/prisma");

const [email, password, fullName] = process.argv.slice(2);

if (!email || !password || !fullName) {
  console.error(
    "Usage: node scripts/create-admin.js <email> <password> <fullName>"
  );
  process.exit(1);
}

const run = async () => {
  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.admin.create({
    data: {
      email,
      passwordHash,
      fullName,
    },
  });

  console.log("Admin created", { id: admin.id, email: admin.email });
  await prisma.$disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
