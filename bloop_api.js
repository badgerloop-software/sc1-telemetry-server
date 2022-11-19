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
	// 		
	db.exec(`
		create table testTable (
			timestamp	TEXT	PRIMARY KEY	NOT NULL,
			payload		BLOB	text not null
		);`
		/* TODO insert into testTable (timestamp, payload)
			values
				('1', ),
				(2, 'Name 2', 'F'),
				(3, 'Name 3', 'F');
		`*/, () => {
			console.log('Created the table');
			// TODO runQueries(db);
	});
}

function insertIntoTable(db, ts, pl) {
	db.exec(`
		insert into testTable (ts, pl)
			values ('${ts}', ${pl});
		`, () => {
			/* TODO console.log(`
			insert into testTable (test_id, name, test_flag)
				values (${id}, '${name}', '${flag}');
			`);*/
			runQueries(db);
	});
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
	
	db.all(`select max(timestamp) from testTable;`, (err, rows) => {
		//rows.forEach(row => {
		console.log('max(timestamp): ' + rows[0]['max(timestamp)']);
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
	
	// TODO console.log(req);
	
	console.log(headers);
	
	// Get file name from headers
	// TODO const filename = headers['content-disposition'].split('"')[1];
	
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
		console.log('received data: ', data);
		
		// TODO insertIntoTable(test_db, resp_counter, "Name " + resp_counter, 'T');
		
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



export default ROUTER;
