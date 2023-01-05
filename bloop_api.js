import { Router } from "express";
// TODO import TEST_RESPONSE from "./test-response.json" assert { type: "json" };
import sqlite3 from "sqlite3"; // TODO For database
import url from "url";



// --------------------------------------- HELPER FUNCTIONS --------------------------------------

function _isNumeric(val) {
	return /^\d+$/.test(val);
}



// --------------------------------------- SQLITE3 DATABASE --------------------------------------

const dbFile = 'test-bloop.db';

// Open test.db database for reading and writing, or create the database if it doesn't exist
let test_db = new sqlite3.Database('./' + dbFile, (err) => {// TODO sqlite3.OPEN_READWRITE, (err) => {
	if(err && err.code == "SQLITE_CANTOPEN") {
		createDatabase();
		return;
	} else if(err) {
		console.log("Errored out initializing test_id: " + err);
		// TODO exit(1);
	}
	
	console.log('created the database in the first function');
	createTable(test_db, "testTable");
});


function createDatabase() {
	test_db = new sqlite3.Database(dbFile, (err) => {
		if(err) {
			console.log("Errored out: " + err);
			// TODO exit(1);
		}
		console.log('created the database');
		createTable(test_db, "testTable");
	});
}

function createTable(db, table_name) {
	// TODO Maybe change TEXT to INTEGER for the time so that we can use UNIX timestamps (the curr_msec in sc1-driver-io)??
	db.exec(
		`create table if not exists ${table_name} (
			timestamp	INTEGER	PRIMARY KEY	NOT NULL,
			payload		BLOB	NOT NULL
		);`,
		() => {
			console.log('Created table', table_name);
	});
}

function insertIntoTable(db, table, ts, pl) {
	console.log('Inserting entry');

	db.run(`insert into ${table} (timestamp, payload) values (?, ?);`, ts, pl, () => {});
}



// ------------------------------------ HTTP REQUEST HANDLING ------------------------------------

const ROUTER = Router();

// TODO Add ability to specify table name in request
ROUTER.get("/get-entry-count", (req, res) => {
	test_db.all(`select count(timestamp) as "field1", null as "field2" from testTable union select max(timestamp) as "field1", payload as "field2" from testTable;`, (err, rows) => {
		// TODO console.log('count(timestamp):', rows[0]['count(timestamp)']);
		
		// TODO const temp = res.send({ response: test_response, count: rows[0]['count(timestamp)'] }).status(200);
		
		console.log('count(timestamp):', rows[0]['field1']);

		const temp = res.send({ count: rows[0]['field1'], tStamp: rows[1]['field1'], bytes: rows[1]['field2'] }).status(200);
	});
});


// Get rows from testTable or specified table with more recent timestamps than the one specified
// USAGE: /get-new-rows[/<tableName>]/<timestamp>
// TODO Maybe change "new" in this (and /get-new-row-count) to "later"
ROUTER.get("/get-new-rows/*", (req, res) => {
	console.log("Requested new rows"); // TODO

	// Parse the request
	const request = url.parse(req.url, true);
	
	// Get the path from the request
	const reqPath = request.pathname;
	
	console.log("Path ", reqPath);
	
	// Get the requester's most recent timestamp from request path
	const pathParts = reqPath.split('/');
	const latestTimestamp = pathParts[pathParts.length - 1];
	const tableName = (pathParts.length > 3) ? pathParts[pathParts.length - 2] : 'testTable';
	
	console.log('Most recent timestamp:', latestTimestamp, '\t\tTable name:', tableName);
	
	// Send rows entered after the provided timestamp to the requester
	test_db.all(`select * from ${tableName} where timestamp > ${latestTimestamp};`, (err, rows) => {
		const temp = res.send({ response: rows }).status(200);
	});
});


// Get the number of rows in testTable or specified table with more recent timestamps than the one specified
// USAGE: /get-new-row-count[/<tableName>]/<timestamp>
ROUTER.get("/get-new-row-count/*", (req, res) => {
	console.log("Requested new row count"); // TODO
	
	// Parse the request
	const request = url.parse(req.url, true);
	
	// Get the path from the request
	const reqPath = request.pathname;
	
	console.log("Path ", reqPath);
	
	// Get the requester's most recent timestamp from request path
	const pathParts = reqPath.split('/');
	console.log('path parts:', pathParts);
	const latestTimestamp = pathParts[pathParts.length - 1];
	const tableName = (pathParts.length > 3) ? pathParts[pathParts.length - 2] : 'testTable';
	console.log("Most recent timestamp ", latestTimestamp);
	
	// Send rows entered after the provided timestamp to the requester
	test_db.all(`select count(timestamp) from ${tableName} where timestamp > ${latestTimestamp};`, (err, rows) => {
		const temp = res.send({ response: rows }).status(200);
	});
});



// ------------------------------------ EXPERIMENTAL ------------------------------------------

// Drop specified table
// USAGE: /drop-table/<table name>
ROUTER.get("/drop-table/*", (req, res) => {
	// Parse the request
	const request = url.parse(req.url, true);
	
	// Get the path from the request
	const reqPath = request.pathname;
	
	// Get the table name
	const pathParts = reqPath.split('/');
	const tableName = pathParts[pathParts.length - 1];

	console.log("Dropping table", tableName);
	
	// Drop specified table
	test_db.all(`drop table if exists ${tableName};`, (err, rows) => {
		const temp = res.send({ response: rows }).status(200);
	});
});


// Lists all table names
ROUTER.get("/list-tables", (req, res) => {
	console.log("Requested list of table names"); // TODO
	
	// Send existing table names to the requester
	test_db.all(`select name from sqlite_schema where type='table' order by name;`, (err, rows) => {
		const temp = res.send({ response: rows }).status(200);
	});
});


// Gets the latest table that has a timestamp for a name
ROUTER.get("/newest-timestamp-table", (req, res) => {
	console.log("Requested most recent table (with timestamp as name)"); // TODO
	
	// Get table names and send the largest numeric name (excluding the initial underscore) as the response
	test_db.all(`select name from sqlite_schema where type='table';`, (err, rows) => {
		// Find the largest numeric table name. Not using select statement due to limitations of casting text to integer
		
		// Map table names to numeric values, if possible; non-numeric names map to -1
		const numericTables = rows.map((val) => {
			if(_isNumeric(val['name'].slice(1))) {
				return parseInt(val['name'].slice(1), 10);
			} else {
				return -1;
			}
		});

		console.log('numeric tables:', numericTables);
		
		// Send the largest numeric table name as response
		const temp = res.send({ response: '_' + Math.max(...numericTables) }).status(200);
	});
});


// TODO Change to post or put
// Add specified table to database
// 		- Adds an underscore to given name
// 		- Drops leading 0s from numeric names
// USAGE: /add-table/<table name>
ROUTER.get("/add-table/*", (req, res) => {
	console.log("Adding new table"); // TODO

	// TODO Instead of trying to check special cases or allowing decimal names to get mixed up with names that should be timestamps, have a header that specifies whether the provided table name is a timestamp or a raw name for the table. Then, add a prefix to the table name to distinguish each possibility (e.g. 't' for timestamp and 'n' for name)
	// TODO Would this hinder testing at all?
	
	// Parse the request
	const request = url.parse(req.url, true);
	
	// Get the path from the request
	const reqPath = request.pathname;
	
	// Get the table name from request path
	const pathParts = reqPath.split('/'); // TODO Just use ...split('/').at(-1) to get the table name right away
	const rawTableName = pathParts[pathParts.length - 1];
	// If raw table name is numeric, strip leading 0s (using parseInt()) to avoid duplicates when parsing table names for ordering later
	// Add an underscore to the front of the raw name. If raw name is numeric, this is required to make it a valid table name
	const tableName = '_' + (_isNumeric(rawTableName) ? parseInt(rawTableName) : rawTableName);
	
	// Check if table exists and act accordingly
	test_db.all(`select name from sqlite_schema where type='table' and name = ?;`, tableName, (err, rows) => {
		console.log("Rows from existing table query:", rows, '\t\tLength:', rows.length);
		if(rows.length > 0) {
			// Table exists
			console.log("Table ", tableName, "\t\tExists");
			// Respond saying table exists
			const temp = res.send({ response: tableName + " exists" }).status(200);
		} else {
			// Table doesn't exist
			console.log("Table ", tableName, "\t\tDoesn't exist");
			// Create table with the specified table name
			createTable(test_db, tableName);
			
			// Send new table name as response
			const temp = res.send({ response: tableName }).status(200);
		}
	});
});


// HTTP request for uploading datasets to the server
ROUTER.post("/add-data", (req, res) => {
	console.log('add-data request');

	// Parse the request
	const request = url.parse(req.url, true);
	
	// Get the query from the request url
	const reqQuery = request.query;
	
	// Get table name and dataset timestamp from query
	const tableName = reqQuery['table-name'];
	const datasetTime = reqQuery['dataset-time'];


	// TODO Create the table first (in startThread()). Wait until a response is received from the server before adding data.
	// 		Then, insert into it without needing to check if the table exists


	console.log("Table name:", tableName, "\t\tDataset time:", datasetTime);
	
	// Event handler that runs when data is received from the request
	req.on('data', (data) => {
		insertIntoTable(test_db, tableName, parseInt(datasetTime), data);
	});
	
	// Event handler that runs when the request ends
	req.on('end', () => {
		console.log('ended');
		const temp = res.send({ response: 1 }).status(200);
	});
});


ROUTER.get("/get-entry-count/*", (req, res) => {
	// Parse the request
	const request = url.parse(req.url, true);
	
	// Get the path from the request
	const reqPath = request.pathname;
	
	// Get the table name from request path
	const pathParts = reqPath.split('/'); // TODO Just use ...split('/').at(-1) to get the table name right away
	const tableName = pathParts[pathParts.length - 1];

	test_db.all(`select count(timestamp) as "field1", null as "field2" from ${tableName} union select max(timestamp) as "field1", payload as "field2" from ${tableName};`, (err, rows) => {
		
		// TODO SHOULD ADD QUICK ERROR CHECKING TO AVOID CRASHING THE SERVER
		//      Could check to see if err is null/undefined/whatever it would be when no error occurs
		
		console.log('count(timestamp):', rows[0]['field1']);

		const temp = res.send({ count: rows[0]['field1'], tStamp: rows[1]['field1'], bytes: rows[1]['field2'] }).status(200);
	});
});


ROUTER.get("/get-first-timestamp/*", (req, res) => {
	// Parse the request
	const request = url.parse(req.url, true);
	
	// Get the path from the request
	const reqPath = request.pathname;
	
	// Get the table name from request path
	const pathParts = reqPath.split('/'); // TODO Just use ...split('/').at(-1) to get the table name right away
	const tableName = pathParts[pathParts.length - 1];

	test_db.all(`select min(timestamp) as "first timestamp" from ${tableName};`, (err, rows) => {
		
		// TODO SHOULD ADD QUICK ERROR CHECKING TO AVOID CRASHING THE SERVER
		//      Could check to see if err is null/undefined/whatever it would be when no error occurs
		
		console.log('first timestamp:', rows[0]['first timestamp']);

		const temp = res.send({ response: rows[0]['first timestamp'] }).status(200);
	});
});



export default ROUTER;
