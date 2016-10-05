const _ = require("lodash"),
    $ = require("jquery"),
    Component = require("./../../../core/components/ComponentBase");


var PanelMain = function (options) {
    this.template = _.template($("#tpl-panel-main").html());
    this.serviceLocator = null;
    this.$el = null;
    PanelMain.prototype.init.call(this, options);
};

_.extend(PanelMain.prototype, new Component);
_.extend(PanelMain.prototype, {
    init: function (options) {

    },
    render: function () {
        this.$el = this.template({});
        return this;
    }
});

module.exports = PanelMain;
