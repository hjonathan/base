const _ = require("lodash");
const Entity = require("./entity");

var ContainerModule = function (options) {
    this.ServiceLocator = null;
    this.collection = null;
    ContainerModule.prototype.init.call(this, options);
};

_.extend(ContainerModule.prototype, {
    init: function (options) {
        this.provider = options.provider || null;
    },
    addModule: function (nameModule, arrServices, callbackView) {
        var nModule,
            services;

        services = this.getServices(arrServices);
        try {
            nModule = callbackView(arrServices);
            this.collection.push({
                id: nameModule,
                module: nModule
            })
        }
        catch (e) {
            console.log(e);
        }
    },
    getModule: function (idEntity) {
        return _.find(this.collection, function (o) {
            return o.id === idEntity;
        });

    },
    getServiceLocator: function () {
        return this.serviceLocator;
    }
    getServices: function (arrServices) {
        return this.serviceLocator.getServices(arrServices);
    }
});

module.exports = ContainerModule;