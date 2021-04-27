const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const hubspot = require("@hubspot/api-client");
const { program } = require("commander");
const createCsvStringifier = require("csv-writer").createObjectCsvStringifier;
require("dotenv").config();

async function getAllFromHubspot(hubspotClient) {
  // const drafts = await hubspotClient.cms.hubdb.tablesApi.getAllDraftTables();
  const published = await hubspotClient.cms.hubdb.tablesApi.getAllTables();

  // const merged = [...drafts.body.results, ...published.body.results];

  return published.body.results;
}

function getDatabaseType(input) {
  const mappings = {
    NUMBER: "REAL",
  };

  return mappings[input] ? mappings[input] : input;
}

function addHubspotInternalColumns(table) {
  let output = [];

  output.push({
    name: "hs_id",
    type: "text",
  });
  output.push({
    name: "hs_name",
    type: "text",
  });
  output.push({
    name: "hs_child_table_id",
    type: "text",
  });

  return [...output, ...table.columns];
}

function buildCreateStatements(hubDbTables) {
  let createString = "";
  for (const table of hubDbTables) {
    createString += "CREATE TABLE `" + table.name + "`(";

    const columns = addHubspotInternalColumns(table);
    let columnsString = "";
    for (const column of columns) {
      columnsString += `${column.name} ${getDatabaseType(column.type)},`;
    }

    // remove last comma/char
    createString += columnsString.slice(0, -1);

    createString += ");";
  }
  return createString;
}

async function getAllRows(hubspotClient, tableName) {
  const rows = await hubspotClient.cms.hubdb.rowsApi.getTableRows(tableName);
  return rows.body.results;
}

function flatten(hubDbRow) {
  // Let's add hubspots default stuff
  let { values, ...rest } = hubDbRow;

  let newFields = {};

  for (const key in values) {
    if (typeof values[key] === "object") {
      // todo: implement
      continue;
    }

    newFields[key] = values[key];
  }

  newFields.hs_id = rest.id;
  newFields.hs_name = rest.name;
  newFields.hs_child_table_id = rest.child_table_id;

  return newFields;
}

/**
 * Untrusted user input, so prep statmeents
 * @param {*} hubspotClient
 * @param {*} tableName
 */
async function insertData(hubspotClient, dbConnection, tableName) {
  const rows = await getAllRows(hubspotClient, tableName);
  // TODO: performance

  for (const row of rows) {
    const cleanRow = flatten(row);

    // Each row might have different number of columns:/
    const columnCount = Object.values(cleanRow).length;
    const placeholders = "?,".repeat(columnCount).slice(0, -1);

    const columns = Object.keys(cleanRow).join(",");

    //todo: sql injection, although this is less risky.
    await dbConnection.run(
      `INSERT INTO \`${tableName}\` (${columns}) VALUES (${placeholders})`,
      ...Object.values(cleanRow)
    );
  }
  // stmt.finalize();
}

async function setup(hubspotClient, dbConnection) {
  console.log("Setup is starting");
  const tables = await getAllFromHubspot(hubspotClient);
  const tableStructure = buildCreateStatements(tables);

  // Drop all first
  for (const table of tables) {
    console.log("DROP TABLE IF EXISTS `" + table.name + "`");
    await dbConnection.run("DROP TABLE IF EXISTS `" + table.name + "`");
  }

  const split = tableStructure.split(";");
  for (const query of split) {
    if (!query) {
      continue;
    }
    const result = await dbConnection.run(query);
  }

  for (const table of tables) {
    await insertData(hubspotClient, dbConnection, table.name);
  }
}

function createCsvFromQueryResult(result) {
  // Get first row.
  const exampleRow = result[0];
  const header = Object.keys(exampleRow).map((item) => ({
    id: item,
    name: item,
  }));

  console.log(header);
  const csvStringifier = createCsvStringifier({
    header,
  });

  return csvStringifier.stringifyRecords(result);
}

async function sql(query, dbConnection, opts, other) {
  const results = await dbConnection.all(query);

  if (!opts.output) {
    console.table(results);
    return;
  }
  if (opts.output === "json") {
    return process.stdout.write(JSON.stringify(results));
  }

  if (opts.output === "csv") {
    return process.stdout.write(createCsvFromQueryResult(results));
  }

  throw new Error("invalid value for --output");
  // otherwise...
}

// this is a top-level await
(async () => {
  if (!process.env.HAPIKEY) {
    throw new Error("No HAPIKEY in .env set");
  }

  if (!process.env.DATABASE_PATH) {
    throw new Error("No DATABASE_PATH set in .env");
  }

  const hubspotClient = new hubspot.Client({
    apiKey: process.env.HAPIKEY,
  });

  // open the database
  const db = await open({
    filename: process.env.DATABASE_PATH,
    driver: sqlite3.Database,
  });

  program
    .arguments("<query>")
    .option("-o, --output <format>", "output as csv")
    .action((prop, options, command) => sql(prop, db, options, command));

  program.command("setup").action(() => setup(hubspotClient, db));

  await program.parseAsync(process.argv);
})();
