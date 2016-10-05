var PanelMain = require("./modules/main/panelMain/PanelMain"),
    $ = require("jquery");

var ServiceManager = {};

var mainComponent = new PanelMain({
    serviceLocator: ServiceManager
});
mainComponent.render();
$("#app-container").append(mainComponent.$el);
if (window) {
    window.app = {
        active: "",
        reactive: mainComponent,
        pasive: ""
    }
}
// add Modules -- login
require("./modules/login/Login")();