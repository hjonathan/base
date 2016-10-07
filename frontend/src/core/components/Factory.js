const _ = require("lodash"),
    Event = require("events"),
    Emitter = new Event.EventEmitter();

var Factory = function (options) {
    this.collection = [];
    this.serviceLocator = null;
    Factory.prototype.init.call(this, options);
};

_.extend(Factory.prototype, Emitter);
_.extend(Factory.prototype, {
    init: function (options) {
        this.serviceLocator = options && options.serviceLocator ? options.serviceLocator : {};
        return this;
    },
    add: function (alias, services, cb) {
        var arr = [];
        this.collection.push({
            id: alias,
            factory: cb,
            services: services
        });
    },
    get: function (alias) {
        var services = [],
            el = _.find(this.collection, function (o) {
                return o.id === alias;
            });
        return el.factory(services);
    }
});

module.exports = Factory;