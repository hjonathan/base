var MongoDBAdapter = require('./MongoDB');

var EventStore = function (options) {
    this.options = options;
    this.adapter = null;
    switch (options.type) {
        case 'mongodb':
            this.adapter = new MongoDBAdapter(options);
            break;
        case 'redisdb':
            this.adapter = new RedisDBAdapter(options);
            break;
    }
};

EventStore.prototype.connect = function (done) {
    this.adapter.connect(done);
};

EventStore.prototype.addEvent = function (ev, done) {
    this.adapter.addEvent(ev, done);
};

EventStore.prototype.disconnect = function (done) {
    //this.adapter.disconnect(done);
};

module.exports = EventStore;