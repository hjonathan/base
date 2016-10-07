require("./Login")();

module.exports = function () {
    var PanelMain = oneTruth.module("mod-main"),
        login,
        Login = oneTruth.factory("fact-login");
    login = new Login();
    PanelMain.adopt(login);
    oneTruth.module("mod-login", login);
};