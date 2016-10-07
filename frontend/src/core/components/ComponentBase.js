const _ = require("lodash"),
    Event = require("events"),
    Emitter = new Event.EventEmitter();

var ComponentBase = function (options) {
    ComponentBase.prototype.init.call(this, options);
};

_.extend(ComponentBase.prototype, Emitter);
_.extend(ComponentBase.prototype, {
    init: function (options) {
        this.id = null;
        this.collection = [];
        this.children = [];
        this.defaults = {};
    },
    adopt: function (comp) {
        this.children.push({
            id: comp.getId(),
            component: comp
        });
    },
    getChild: function (alias) {
        var el = _.find(this.collection, function (o) {
            return o.id === alias;
        });
        return el.component;
    },
    getId: function () {
        return this.id;
    },
    get: function (key) {
        return this.defaults[key];
    },
    set: function (key, value) {
        this.defaults[key] = value;
        return this;
    }
});

module.exports = ComponentBase;