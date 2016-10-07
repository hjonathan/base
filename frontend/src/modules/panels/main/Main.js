const _ = require("lodash"),
    $ = require("jquery");

module.exports = function () {
    window.oneTruth.factory("fact-main", [], function (services) {
        var PanelMain = oneTruth.component({
            template: _.template($("#tpl-panel-main").html()),
            $el: null,
            init: function () {

            },
            render: function () {
                this.$el = this.template({});
                return this;
            }
        });
        return PanelMain;
    });
};