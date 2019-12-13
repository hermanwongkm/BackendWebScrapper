// Sys variables stores in .env file
require('dotenv').load();

// need another queue to save the files. todo
// required for RabbitMQ
var amqp = require('amqplib/callback_api');

// required for ACR cloud
var express = require('express');
var bodyParser = require('body-parser')
var app = express();

// MongoDB requirements and variables.
var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
// 
var serverAdr = 'localhost:27017',
    dbName = 'musicDB'
mongoose.connect(`mongodb://${serverAdr}/${dbName}`, { useNewUrlParser: true })
mongoose.connection.on('error', function (err) {
    if (err) throw err;
});
mongoose.set('useCreateIndex', true);


var q = 'mongoQueue'

// Enable cross domain
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    next();
});

// Body parser with bigger body size limit
var sizeLimit = process.env.SIZE_LIMIT || '5mb';
app.use(bodyParser.json({ limit: sizeLimit }));
app.use(bodyParser.urlencoded({ limit: sizeLimit, extended: true }));

// Schema definition for MongoDB
const musicSchema = new mongoose.Schema({
    queried:String,
    recognised:String,
    device_id: String,
    isrc: String,
    upc: String,
    title: String,
    album: String,
    artists: [String],
    acrid: String,
    confidence: String,
    music: String,
    timestamp_acr: { type: Date, index: { unique: true, dropDups: true } }||String,// UTC timezone
    timestamp_device: Date,

});
const Record = mongoose.model('Record', musicSchema);

// const cloneAndPluck = function (sourceObject, keys) {
//     const newObject = {};
//     keys.forEach((obj, key) => { newObject[key] = sourceObject[key]; });
//     return newObject;
// };

// // const subset = cloneAndPluck(elmo, ["color", "height"]);

amqp.connect('amqp://localhost', function (err2, conn) {

    conn.createChannel(function (err2, ch3) {
        if (err2) {
            throw err2;
        }
        // ch3.prefetch(1)
        ch3.assertQueue(q, { durable: true })
        console.log(" [*] Waiting for records in %s. To exit press CTRL+C", q);
        ch3.consume(q, function (msg) {
            // json file received contains two field, id -> deviceID, music -> music file.
            jsonMsg = JSON.parse(msg.content);
            let r = new Record(jsonMsg);
            if (r.music){
                console.log("[*] Music 15 second sample is saved.")
            }else{
                console.log("[*] No Music File is saved! Maintence Required!")
            }
            extraLine = "";
            if(r.queried =="False"){
                extraLine = "Backed up a unqueried record"
            };
            if(r.recognised =="False" && r.queried =="True"){
                extraLine = "Backed up a unrecognised record"
            };
            r.save().then(doc => {
                console.log("Saved one record.",extraLine), console.log(picked = ({ queried,recognised,device_id, isrc, upc, title, album, artists, timestamp_acr,timestamp_device } =
                    doc, {queried,recognised ,device_id, isrc, upc, title, album, artists, timestamp_acr,timestamp_device }))
            })
                .catch(err => { console.error(err) })
        }, { noAck: true });

    }, {
        });

});

