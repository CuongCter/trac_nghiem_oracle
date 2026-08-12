import { closePool, execute, initPool } from "../config/database";
import { hashPassword } from "../utils/auth";

async function main() {
  await initPool();
  const email = "admin@example.com";
  const fullName = "System Admin";
  const role = "ADMIN";
  const status = "ACTIVE";
  const passwordHash = await hashPassword("Admin@123");

  const { rows: existing } = await execute<{ ID: number }>(
    "SELECT ID FROM USERS WHERE LOWER(EMAIL) = LOWER(:email)",
    { email },
  );

  if (existing.length > 0) {
    await execute(
      "UPDATE USERS SET FULL_NAME = :fn, ROLE = :role, STATUS = :status, PASSWORD_HASH = :ph, UPDATED_AT = SYSTIMESTAMP WHERE ID = :id",
      { fn: fullName, role, status, ph: passwordHash, id: existing[0].ID },
    );
    // eslint-disable-next-line no-console
    console.log(
      `Updated existing admin user (id=${existing[0].ID}) with password "Admin@123"`,
    );
  } else {
    await execute(
      `INSERT INTO USERS (FULL_NAME, EMAIL, PASSWORD_HASH, ROLE, STATUS)
       VALUES (:fn, :email, :ph, :role, :status)`,
      { fn: fullName, email, ph: passwordHash, role, status },
    );
    // eslint-disable-next-line no-console
    console.log("Created admin user admin@example.com / Admin@123");
  }

  await closePool();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("seed admin failed", err);
  process.exit(1);
});
