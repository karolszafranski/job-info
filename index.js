var crypto = require('crypto');
var pg = require('pg');
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');

var pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || "",
    max: 20,
    idleTimeoutMillis: 1000,
});

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/*
CREATE TABLE warnings (
	id SERIAL PRIMARY KEY,
	app VARCHAR (128) UNIQUE NOT NULL,
	count INT NOT NULL
);

INSERT INTO warnings(app, count) VALUES ('com.example.app', 100);
*/

app.set('port', (process.env.PORT || 5000));

app.get('/', function(req, res) {
  response.json({});
});

function onSuccess(cb) {
    var self = this;
    return function(err) {
        if(typeof err === 'undefined' || err === null) {
            var args = Array.prototype.slice.call(arguments, 1);
            cb.apply(self, args);
        }
        else {
            console.log(err);
            process.exit(3);
        }
    }
}

function verify(signature, timestamp, app) {
    var string = (process.env.SALT || "") + app + timestamp;
    var hash = crypto.createHash('sha256').update(string).digest('hex');
    // echo -n "string" | openssl dgst -sha256
    return signature == hash;
}

app.get('/warning/:app', function(req, res) {
    if(verify(req.headers.signature, req.headers.timestamp, req.params.app)) {
        pgPool.connect(onSuccess(function(client, done) {
            var select_sql = 'SELECT count FROM warnings WHERE app=' + client.escapeLiteral(req.params.app) + ';';
            client.query(select_sql, onSuccess(function(result) {
                done();
                if(result.rowCount == 0) {
                    res.status(404).send("ERR");
                }
                else {
                    res.status(200).send("" + result.rows[0].count);
                }
            }));
        }));
    }
    else {
        res.status(401).send("FAIL");
    }
});

app.post('/warning/:app', function(req, res) {
    if(verify(req.headers.signature, req.headers.timestamp, req.params.app)) {
        pgPool.connect(onSuccess(function(client, done) {
            var update_sql = 'UPDATE warnings SET count=' + client.escapeLiteral(req.body.count) + ' WHERE app=' + client.escapeLiteral(req.params.app) + ';';
            client.query(update_sql, onSuccess(function(result) {
                done();
                res.status(200).send("OK");
            }));
        }));
    }
    else {
        res.status(401).send("ERR");
    }
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
