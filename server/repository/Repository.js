var EventStore = require('./eventstore/EventStore.js');

var NGRepository = function (connectionOptions) {
    this.eventStore = new EventStore(connectionOptions);
};

NGRepository.prototype.connect = function (done) {
    this.eventStore.connect(function (err, db){
        done(err, db);
    });
};

NGRepository.prototype.addEvent = function (event, done) {
    var that = this;

    this.eventStore.connect(function (){
    });

    that.eventStore.addEvent(event, function (err, result){
        if(err) throw (err);
        done(err, result);
    });
};


module.exports = NGRepository;