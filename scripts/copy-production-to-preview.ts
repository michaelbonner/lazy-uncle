import { spawnSync } from "node:child_process";
import { once } from "node:events";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";

const confirmationFlag = "--confirm-preview-overwrite";

function getDatabaseUrl(name: string): URL {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `${name} is not set. Add it to .env before running this script.`,
    );
  }

  const url = new URL(value);
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error(`${name} must be a PostgreSQL connection string.`);
  }

  return url;
}

function databaseIdentity(url: URL): string {
  return `${url.hostname}:${url.port || "5432"}${url.pathname}`;
}

function displayDatabase(url: URL): string {
  return `${url.hostname}${url.port ? `:${url.port}` : ""}${url.pathname}`;
}

function connectionDetails(url: URL): {
  connectionString: string;
  env: NodeJS.ProcessEnv;
} {
  const connectionUrl = new URL(url);
  const username = decodeURIComponent(connectionUrl.username);
  const password = decodeURIComponent(connectionUrl.password);
  connectionUrl.username = "";
  connectionUrl.password = "";

  return {
    connectionString: connectionUrl.toString(),
    env: {
      ...process.env,
      ...(username ? { PGUSER: username } : {}),
      ...(password ? { PGPASSWORD: password } : {}),
    },
  };
}

function run(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv = process.env,
): void {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env,
  });

  if (result.error) {
    if ((result.error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(
        `${command} was not found. Install the PostgreSQL client tools and try again.`,
      );
    }
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `${command} exited with status ${result.status ?? "unknown"}.`,
    );
  }
}

async function removeUnsupportedSettings(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  const input = createReadStream(inputPath);
  const output = createWriteStream(outputPath, { encoding: "utf8" });
  const lines = createInterface({ input, crlfDelay: Infinity });
  let removedTransactionTimeout = false;

  for await (const line of lines) {
    if (!removedTransactionTimeout && line === "SET transaction_timeout = 0;") {
      removedTransactionTimeout = true;
      continue;
    }

    if (!output.write(`${line}\n`)) {
      await once(output, "drain");
    }
  }

  output.end();
  await once(output, "finish");
}

async function main(): Promise<void> {
  if (!process.argv.includes(confirmationFlag)) {
    throw new Error(
      `This replaces all data in the preview database. Re-run with ${confirmationFlag} to continue.`,
    );
  }

  const production = getDatabaseUrl("PRODUCTION_DATABASE_URL");
  const preview = getDatabaseUrl("PREVIEW_DATABASE_URL");
  const productionConnection = connectionDetails(production);
  const previewConnection = connectionDetails(preview);

  if (databaseIdentity(production) === databaseIdentity(preview)) {
    throw new Error(
      "Production and preview point to the same database; refusing to continue.",
    );
  }

  const temporaryDirectory = await mkdtemp(
    join(tmpdir(), "lazy-uncle-db-copy-"),
  );
  const dumpPath = join(temporaryDirectory, "production.dump");
  const rawRestorePath = join(temporaryDirectory, "restore.raw.sql");
  const restorePath = join(temporaryDirectory, "restore.sql");

  try {
    console.log(
      `Dumping production database (${displayDatabase(production)})...`,
    );
    run(
      "pg_dump",
      [
        "--format=custom",
        "--no-owner",
        "--no-privileges",
        "--file",
        dumpPath,
        productionConnection.connectionString,
      ],
      productionConnection.env,
    );

    run("pg_restore", [
      "--file",
      rawRestorePath,
      "--no-owner",
      "--no-privileges",
      dumpPath,
    ]);
    await removeUnsupportedSettings(rawRestorePath, restorePath);

    console.log(`Clearing preview database (${displayDatabase(preview)})...`);
    run(
      "psql",
      [
        "--dbname",
        previewConnection.connectionString,
        "--set",
        "ON_ERROR_STOP=1",
        "--command",
        `DO $$
        DECLARE schema_name text;
        BEGIN
          FOR schema_name IN
            SELECT nspname
            FROM pg_namespace
            WHERE nspname <> 'information_schema'
              AND nspname NOT LIKE 'pg\\_%' ESCAPE '\\'
          LOOP
            EXECUTE format('DROP SCHEMA %I CASCADE', schema_name);
          END LOOP;
        END $$;
        CREATE SCHEMA public;`,
      ],
      previewConnection.env,
    );

    console.log("Restoring production data to preview...");
    run(
      "psql",
      [
        "--dbname",
        previewConnection.connectionString,
        "--set",
        "ON_ERROR_STOP=1",
        "--file",
        restorePath,
      ],
      previewConnection.env,
    );

    console.log(
      "Preview database successfully replaced with a copy of production.",
    );
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
