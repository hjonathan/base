const _ = require("lodash");
const Entity = require("./entity");

var ServiceLocator = function (options) {
    this.collection = null;
    ServiceLocator.prototype.init.call(this, options);
};

_.extend(ContainerModule.prototype, {
    init: function (options) {
        this.provider = options.provider || null;
    },
    addService: function (alias, service) {
        this.collection.push({
            id: alias,
            service: service
        });
        return this;
    },
    getService: function (alias) {
        return _.find(this.collection, function (o) {
            return o.id === alias;
        });
    }
    getServices: function (arr) {
        var resp = [], val;
        if (_.isArray(arr)) {
            _.arrayList = _.each(arr, function (o) {
                val = this.getService(o);
                if (val)
                    resp.push(val);
            });
        }
        return resp;
    }
});

module.exports = ServiceLocator;