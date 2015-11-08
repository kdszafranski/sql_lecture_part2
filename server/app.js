var express = require('express');
var app = express();

var path = require('path');
var bodyParser = require('body-parser');

var pg = require('pg');
var connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/cedrix';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({expanded: true}));

// Get all the people information
app.get('/data', function(req,res){
    var results = [];

    //SQL Query > SELECT data from table
    pg.connect(connectionString, function (err, client, done) {
        var query = client.query("SELECT * FROM people ORDER BY name ASC");

        // Stream results back one row at a time, push into results array
        query.on('row', function (row) {
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function () {
            client.end();
            return res.json(results);
        });

        // Handle Errors
        if (err) {
            console.log(err);
        }
    });
});

// Add a new person
app.post('/data', function(req,res){
    // pull the data off of the request
    var addedPerson = {
        "name" : req.body.peopleAdd,
        "location" : req.body.locationAdd,
        "animal" : req.body.animal,
        "address" : req.body.address
    };

    pg.connect(connectionString, function (err, client) {
        //SQL Query > Insert Data
        //Uses prepared statements, the $1 and $2 are placeholder variables. PSQL then makes sure they are relatively safe values
        //and then uses them when it executes the query.
        client.query("INSERT INTO people (name, location, spirit_animal, address) VALUES ($1, $2, $3, $4) RETURNING id",
            [addedPerson.name, addedPerson.location, addedPerson.animal, addedPerson.address],
            function(err, result) {
                if(err) {
                    console.log("Error inserting data: ", err);
                    res.send(false);
                }

                res.send(true);
            });

    });

});

app.delete('/data', function(req,res){
    console.log(req.body.id);

    var personID = req.body.id;

    pg.connect(connectionString, function (err, client) {
        //SQL Query > Insert Data
        //Uses prepared statements, the $1 and $2 are placeholder variables. PSQL then makes sure they are relatively safe values
        //and then uses them when it executes the query.
        client.query("DELETE FROM people WHERE id = $1", [personID],
            function(err, result) {
                if(err) {
                    console.log("Error deleting row: ", err);
                    res.send(false)
                }

                res.send(true);
            });

    });


});

app.get("/find", function(req, res) {
    var results = [];
    var personName = "%" + req.query.peopleSearch + "%";

    //SQL Query > SELECT data from table
    pg.connect(connectionString, function (err, client, done) {

        var query = client.query("SELECT * FROM people WHERE name ILIKE $1", [personName]);

        // Stream results back one row at a time, push into results array
        query.on('row', function (row) {
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function () {
            client.end();
            return res.json(results);
        });

        // Handle Errors
        if (err) {
            console.log(err);
        }
    });
});

app.get("/*", function(req,res){
    var file = req.params[0] || "/views/index.html";
    res.sendFile(path.join(__dirname, "./public", file));
});

app.set("port", process.env.PORT || 5000);
app.listen(app.get("port"), function(){
    console.log("Listening on port: ", app.get("port"));
});
