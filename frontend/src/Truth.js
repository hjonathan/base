const _ = require("lodash"),
    Component = require("./core/components/ComponentBase"),
    Factory = require("./core/components/Factory"),
    Module = require("./core/components/Module"),
    $ = require("jquery");

/**
 * Class Main
 */
var Truth = function (options) {
    this.containerFactory = new Factory();
    this.containerModule = new Module();
    Truth.prototype.init.call(this, options);
};
_.extend(Truth.prototype, {
    init: function () {
    },
    component: function (obj) {
        var el = function (options) {
            Component.prototype.init.call(this, options);
        };
        _.extend(el.prototype, Component.prototype);
        _.extend(el.prototype, obj);
        return el;
    },
    factory: function (alias, services, obj) {
        if (obj && services) {
            this.containerFactory.add(alias, services, obj);
        } else {
            return this.containerFactory.get(alias);
        }
    },
    module: function (alias, obj) {
        if (obj) {
            this.containerModule.add(alias, obj);
        } else {
            return this.containerModule.get(alias);
        }
    }
});

module.exports = Truth;