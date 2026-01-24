require("dotenv").config();
const { app } = require("../src/app");

const PORT = process.env.SMOKE_PORT || 5050;

const run = async () => {
  const server = app.listen(PORT, async () => {
    try {
      const health = await fetch(`http://localhost:${PORT}/health`);
      if (!health.ok) {
        throw new Error("Health check failed");
      }

      const departments = await fetch(
        `http://localhost:${PORT}/api/public/departments`
      );
      if (!departments.ok) {
        throw new Error("Public departments failed");
      }

      console.log("Smoke test passed");
    } catch (error) {
      console.error(error);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  });
};

run();
