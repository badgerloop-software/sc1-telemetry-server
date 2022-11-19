import { Router } from "express";
import TEST_RESPONSE from "./test-response.json" assert { type: "json" };
import sqlite3 from "sqlite3"; // TODO For database



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
	createTable(test_db);
});


function createDatabase() {
	test_db = new sqlite3.Database(dbFile, (err) => {
		if(err) {
			console.log("Errored out: " + err);
			// TODO exit(1);
		}
		console.log('created the database');
		createTable(test_db);
	});
}

function createTable(db) {
	// TODO Maybe change TEXT to INTEGER for the time so that we can use UNIX timestamps (the curr_msec in sc1-driver-io)??
	db.exec(
		`create table testTable (
			timestamp	INTEGER	PRIMARY KEY	NOT NULL,
			payload		BLOB	NOT NULL
		);`,
		() => {
			console.log('Created the table');
	});
}

function insertIntoTable(db, ts, pl) {
	console.log('Inserting entry');
	db.run('insert into testTable (timestamp, payload) values (?, ?);', ts, pl, () => {
			runQueries(db);
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

function runQueries(db) {
	/*TODO db.all(`
		select test_id, name, test_flag from testTable t
		where test_id >= ?`, 2, (err, rows) => {
			// TODO rows.forEach(row => {
			// TODO	console.log(row.test_id + '\t' + row.name + '\t' + row.test_flag);
			// TODO });
		}
	);*/
	
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
	});*/
}



// ------------------------------------ HTTP REQUEST HANDLING ------------------------------------

const test_response = TEST_RESPONSE;

let resp_counter = 0;

const ROUTER = Router();


ROUTER.get("/api", (req, res) => {
	resp_counter ++;
	console.log("Get request", resp_counter);
	
	const temp = res.send({ response: test_response, count: resp_counter }).status(200);
});



// HTTP request for uploading images to the server
ROUTER.post("/add-data", (req, res) => {
	console.log('add-data request');

	// Get headers
	const headers = req.headers;
	
	// TODO console.log(headers);
	
	// TODO Get session beginning timestamp from headers
	const sessionTime = headers['content-disposition'].split('=')[1];

	console.log(sessionTime);
	
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
		
		insertIntoTable(test_db, parseInt(sessionTime), data);
		
		// Write data to file
		// TODO fs.appendFile(filepath, data, (err) => {});
		//console.log(data);
	});
	
	// Event handler that runs when the request ends
	req.on('end', () => {
		console.log('ended');
	});
	

	/* TODO
	// TODO console.log(req);
	console.log(req.headers);
	console.log(filepath);*/
});


ROUTER.get("/get-entry-count", (req, res) => {
	test_db.all(`select count(timestamp) as "field1", null as "field2" from testTable union select max(timestamp) as "field1", payload as "field2" from testTable;`, (err, rows) => {
		// TODO console.log('count(timestamp):', rows[0]['count(timestamp)']);
		
		// TODO const temp = res.send({ response: test_response, count: rows[0]['count(timestamp)'] }).status(200);
		
		console.log('count(timestamp):', rows[0]['field1']);

		const temp = res.send({ response: test_response, count: rows[0]['field1'], tStamp: rows[1]['field1'], bytes: rows[1]['field2'] }).status(200);
	});
	
});



export default ROUTER;
