const _ = require("lodash"),
    Event = require("events"),
    Emitter = new Event.EventEmitter();

var ComponentBase = function (options) {
    this.collection = [];
    this.serviceLocator = null;
    ComponentBase.prototype.init.call(this, options);
};

_.extend(ComponentBase.prototype, Emitter);
_.extend(ComponentBase.prototype, {
    init: function (options) {
        this.serviceLocator = options && options.serviceLocator ? options.serviceLocator : {};
        return this;
    },
    addComponent: function (alias, arr, cb) {
        this.collection.push({
            id: alias,
            component: cb()
        });
    },
    getComponent: function (alias) {
        return _.find(this.collection, function (o) {
            return o.id === alias;
        });
    }
});

module.exports = ComponentBase;