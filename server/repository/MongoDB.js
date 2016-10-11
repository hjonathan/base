'use strict';
/**
 *  OPTIONS EXAMPLE
 *  "host":"localhost",
 *  "port":"27017",
 *  "db":"denormalizer"
 *  Implements for write in event store;
 */
var MongoClient = require('mongodb').MongoClient;
var Mongo = function (options) {
    this.options = options || {};
    this.db = null;
    this.err = null;
};

Mongo.prototype.connect = function (done) {
    var that = this,
        host = this.options.host,
        port = this.options.port,
        dbQuery = this.options.db;

    MongoClient.connect('mongodb://' + host + ':' + port + '/' + dbQuery, function (err, db) {
        if (err) that.err = err;
        that.db = db;
        done(err, db);
    });
};

Mongo.prototype.addEvent = function (ev, done) {
    var that = this,
        host = this.options.host,
        port = this.options.port,
        dbQuery = this.options.db,
        collection = null;

    if (that.db != null) {
        collection = that.db.collection(ev.type);
        collection.insert([ev], function (err, result) {
            if (err !== null) console.log(err);
            done(err, result);
        });
    } else {
        done(null, []);
    }
};

module.exports = Mongo;