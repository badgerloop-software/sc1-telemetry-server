import { Router } from "express";
// TODO import TEST_RESPONSE from "./test-response.json" assert { type: "json" };
import sqlite3 from "sqlite3"; // TODO For database
import url from "url";



// --------------------------------------- HELPER FUNCTIONS --------------------------------------

function _isNumeric(val) {
	return /^\d+$/.test(val);
}



// --------------------------------------- SQLITE3 DATABASE --------------------------------------

// TODO Make the file (or table) name be the UNIX timestamp of the first packet/connection from the solar car.
// 		The initial timestamp/file (or table) name could be in the header from the HTTP request.
// 		Could/Should also include the file (or table) name (i.e. the initial UNIX timestamp) in every HTTP request header from the solar car.

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

// TODO Add table name parameter
function insertIntoTable(db, table, ts, pl) {
	console.log('Inserting entry');

	/* db.run('insert into testTable (timestamp, payload) values (?, ?);', ts, pl, () => {
			runQueries(db);
	});*/

	db.run(`insert into ${table} (timestamp, payload) values (?, ?);`, ts, pl, () => {
			//runQueries(db);
	});

	/*db.exec(`
		insert into testTable (timestamp, payload)
			values ('${ts}', ${pl});`, () => {/*${pl});
		`, () => {
			/* TODO console.log(`
			insert into testTable (test_id, name, test_flag)
				values (${id}, '${name}', '${flag}');
			`);*//*
			runQueries(db);
	});*/
}


// TODO If this function is used, add table name as a parameter
/* TODO Remove: function runQueries(db) {
	/*TODO db.all(`
		select test_id, name, test_flag from testTable t
		where test_id >= ?`, 2, (err, rows) => {
			// TODO rows.forEach(row => {
			// TODO	console.log(row.test_id + '\t' + row.name + '\t' + row.test_flag);
			// TODO });
		}
	);*//*
	
	// TODO console.log('--------------------------------------------------------------');
	
	db.all(`select max(timestamp), payload from testTable;`, (err, rows) => {
		//rows.forEach(row => {
		console.log('max(timestamp):', rows[0]['max(timestamp)'], '\npayload:', rows[0]['payload']);
		//});
	}); 
	
	/*db.all(`select * from testTable;`, (err, rows) => {
		rows.forEach(row => {
			console.log(row.test_id + '\t' + row.name + '\t' + row.test_flag);
		});
	});*//*
}*/



// ------------------------------------ HTTP REQUEST HANDLING ------------------------------------

const ROUTER = Router();


// HTTP request for uploading datasets to the server
ROUTER.post("/add-data", (req, res) => {
	console.log('add-data request');

	// Get headers
	const headers = req.headers;
	
	// TODO console.log(headers);
	
	// TODO Get dataset timestamp from headers
	const datasetTime = headers['content-disposition'].split('=')[1];

	// Get file extension from headers
	// TODO const extension = headers['content-type'].split('/')[1];
	
	// Set initial file path
	/* TODO	let filepath = './' + filename + '.' + extension;

	// Initialize the number of duplicate file paths that exist
	let numDuplicates = 0;
	
	// Add duplicate number to filename if the file already exists
	while(existsSync(filepath)) {
		// A duplicate was found, so generate a new file path/name
		numDuplicates ++;
		filepath = `./${filename}_${numDuplicates}.${extension}`;
		
		// TODO console.log(filepath);
	}

	console.log("Generated new file: " + filepath);

	*/


	// Event handler that runs when data is received from the request
	req.on('data', (data) => {
		// TODO console.log('received data: ', data);
		
		// TODO insertIntoTable(test_db, parseInt(datasetTime), data);
		insertIntoTable(test_db, 'testTable', parseInt(datasetTime), data);
		
		// Write data to file
		// TODO fs.appendFile(filepath, data, (err) => {});
		//console.log(data);
	});
	
	// Event handler that runs when the request ends
	req.on('end', () => {
		console.log('ended');
		const temp = res.send({ response: 1 }).status(200);
	});
	

	/* TODO
	// TODO console.log(req);
	console.log(req.headers);
	console.log(filepath);*/
});


// TODO Add ability to specify table name in request
ROUTER.get("/get-entry-count", (req, res) => {
	test_db.all(`select count(timestamp) as "field1", null as "field2" from testTable union select max(timestamp) as "field1", payload as "field2" from testTable;`, (err, rows) => {
		// TODO console.log('count(timestamp):', rows[0]['count(timestamp)']);
		
		// TODO const temp = res.send({ response: test_response, count: rows[0]['count(timestamp)'] }).status(200);
		
		console.log('count(timestamp):', rows[0]['field1']);

		const temp = res.send({ count: rows[0]['field1'], tStamp: rows[1]['field1'], bytes: rows[1]['field2'] }).status(200);
	});
});


// Get rows from specified table with more recent timestamps than the one specified
// USAGE: /get-new-rows/<tableName>/<timestamp>
// NOTE: Alternate form of request (with one parameter) below
ROUTER.get("/get-new-rows/*/*", (req, res) => {
	console.log("SPECIFYING TABLE - Requested new rows"); // TODO
	
	// Parse the request
	const request = url.parse(req.url, true);
	
	// Get the path from the request
	const reqPath = request.pathname;

	console.log("Path ", reqPath);
	
	// Get the requester's most recent timestamp from request path
	const pathParts = reqPath.split('/');
	const latestTimestamp = pathParts[pathParts.length - 1];
	const tableName = pathParts[pathParts.length - 2];
	
	// TODO Check that table exists
	//      NO. Instead, just check table names in engineering dashboard before getting any data
	
	console.log('Most recent timestamp:', latestTimestamp, '\t\tTable name:', tableName);
	
	// Send rows entered after the provided timestamp to the requester
	test_db.all(`select * from ${tableName} where timestamp > ${latestTimestamp};`, (err, rows) => {
		const temp = res.send({ response: rows }).status(200);
	});
});


// Get rows from testTable with more recent timestamps than the one specified
// USAGE: /get-new-rows/<timestamp>
// NOTE: Alternate form of request (with two parameters) above
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
	
	console.log("Most recent timestamp ", latestTimestamp);
	
	// Send rows entered after the provided timestamp to the requester
	test_db.all(`select * from testTable where timestamp > ${latestTimestamp};`, (err, rows) => {
		const temp = res.send({ response: rows }).status(200);
	});
});


// TODO Add ability to specify table name
// Get the number of rows in testTable with more recent timestamps than the one specified
// USAGE: /get-new-row-count/<timestamp>
ROUTER.get("/get-new-row-count/*", (req, res) => {
	console.log("Requested new row count"); // TODO
	
	// Parse the request
	const request = url.parse(req.url, true);
	
	// Get the path from the request
	const reqPath = request.pathname;
	
	console.log("Path ", reqPath);
	
	// Get the requester's most recent timestamp from request path
	const pathParts = reqPath.split('/');
	const latestTimestamp = pathParts[pathParts.length - 1];
	
	console.log("Most recent timestamp ", latestTimestamp);
	
	// Send rows entered after the provided timestamp to the requester
	test_db.all(`select count(timestamp) from testTable where timestamp > ${latestTimestamp};`, (err, rows) => {
		const temp = res.send({ response: rows }).status(200);
	});
});



// ------------------------------------ EXPERIMENTAL ------------------------------------------

// TODO Don't think this will be used for anything other than testing, so get request should be fine, even though nothing's being retrieved
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


// (EXPERIMENTAL - Testing duplicate to avoid interfering with add-data request) HTTP request for uploading datasets to the server
ROUTER.post("/exp-add-data", (req, res) => {
	console.log('add-data request');

	// Parse the request
	const request = url.parse(req.url, true);
	
	// Get the path from the request
	// TODO const reqPath = request.pathname;
	
	// Get the query from the request url
	const reqQuery = request.query;
	
	// Get table name and dataset timestamp from query
	const tableName = reqQuery['table-name'];
	const datasetTime = reqQuery['dataset-time'];



	// TODO Create the table first (in startThread()). Wait until a response is received from the server before adding data.
	// 		Then, insert into it without needing to check if the table exists

/* TODO
	// Get headers
	const headers = req.headers;
	
	console.log(headers);
	
	// TODO console.log(headers);
	
	
	// TODO Get table name (default is session's beginning timestamp) and dataset timestamp from headers
	const identifiers = headers['content-disposition'].split(',');
	const tableName = identifiers[0].split('=')[1]; // TODO Might be better (for testing and consistency) to specify table name somewhere other than in the headers. Being able to quickly check success of requests using URL would be nice
	// TODO Could make the URL like this: /add-data/* -> /add-data/<table_name>[/<timestamp>]
	// TODO Remove: const tableName = (_isNumeric(rawTableName) ? '_' : '') + rawTableName; // TODO Should I add an underscore here or ***leave it to the user to include an underscore in the request***?
	const datasetTime = identifiers[1].split('=')[1];
*/

	console.log("Table name:", tableName, "\t\tDataset time:", datasetTime);
	
	// Event handler that runs when data is received from the request
	req.on('data', (data) => {
		// TODO console.log('received data: ', data);
		
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
