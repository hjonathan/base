module.exports = Module;
const _ = require("lodash"),
    Event = require("events"),
    Emitter = new Event.EventEmitter();

var Module = function (options) {
    this.collection = [];
    this.serviceLocator = null;
    Module.prototype.init.call(this, options);
};

_.extend(Module.prototype, Emitter);
_.extend(Module.prototype, {
    init: function (options) {
        this.serviceLocator = options && options.serviceLocator ? options.serviceLocator : {};
        return this;
    },
    add: function (alias, cb) {
        this.collection.push({
            id: alias,
            component: cb
        });
    },
    get: function (alias) {
        var el = _.find(this.collection, function (o) {
            return o.id === alias;
        });
        return el.component;
    }
});

module.exports = Module;