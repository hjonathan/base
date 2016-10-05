const _ = require("lodash");
const Entity = require("./entity");

var ContainerEntity = function (options) {
    this.serviceLocator = null;
    this.collection = null;
    ContainerEntity.prototype.init.call(this, options);
};

_.extend(ContainerEntity.prototype, {
    init: function (options) {
        this.serviceLocator = options.serviceLocator || null;
    },
    addEntity: function () {
        var nEnt;
        if (entity instanceof Entity) {
            this.collection.push({
                id: entity.getId(),
                entity: entity
            });
        }
        if (_.isObject(entity)) {
            nEnt = new Entity(entity);
            this.collection.push({
                id: nEnt.getId(),
                entity: nEnt
            });
        }
        return this;
    },
    getEntity: function (idEntity) {
        return _.find(this.collection, function (o) {
            return o.id === idEntity;
        });
    },
    getServiceLocator: function () {
        return this.serviceLocator;
    }
});

module.exports = ContainerEntity;