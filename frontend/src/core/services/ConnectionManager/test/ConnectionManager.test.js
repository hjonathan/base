var chai = require('chai'),
    sinon = require('sinon'),
    expect = chai.expect,
    assert = chai.assert,
    Connection = require("../ConnectionManager");

describe('ConnectionManager.js', function () {
    var st, con;
    beforeEach(function () {
        con = new Connection();
    });

    it('setPath() -getPath', function (done) {
        con.setPath("login", "login/test/path");
        expect(con.getPath("login")).to.be.equal("login/test/path");
        done();
    });


 it('addDomain() -getDomain', function (done) {
        con.addDomain("login");
        expect(con.getDomain()).to.be.equal("login");
        done();
    });

    it('addKey() - getKey', function (done) {
        con.setKey("login", "login/test/path");
        expect(con.getKey("login")).to.be.equal("login/test/path");
        done();
    });

    it('execute()', function (done) {
        con.setPath("login", "login/test/path");

        con.addConnection("login", myKeys, function (url, rest){
         expect(con.getKey("login/test/path")).to.be.equal("login/test/path");
        });

        expect(con.getKey("login")).to.be.equal("login/test/path");
        done();
    });


    /*it('dispatchParent()', function (done) {
     var childs,
     spy1,
     spy2,
     actionToParent = {
     type: "actionToParent",
     data: {
     myVar: "myVar"
     }
     },
     callbackChild = function (actionInput, newState) {
     },
     callbackChild2 = function (actionInput, newState) {
     },
     storeChild = new Store({
     id: "child2"
     }),
     storeChildListener = new Store({
     id: "child3"
     }),
     storeChildListener2 = new Store({
     id: "child4"
     });

     spy1 = sinon.spy(callbackChild);
     spy2 = sinon.spy(callbackChild2);
     //Adopt the child
     st.adopt(storeChild);
     st.adopt(storeChildListener);
     st.adopt(storeChildListener2);
     //Subscribe to child
     storeChildListener.subscribe("actionToParent", spy1);
     storeChildListener2.subscribe("actionToParent", spy2);

     //Dispatch to parent
     storeChild.dispatchParent(actionToParent);
     // Test the action in childs
     assert(spy1.calledOnce === true, 'Not call a listener of child');
     assert(spy2.calledOnce === true, 'Not call a listener of child');
     done();
     });

     it('adopt() -- getChilds()', function (done) {
     var childs,
     st2 = new Store({
     id: "test1"
     });
     st.adopt(st2);
     childs = st.getChilds();
     expect(childs.length).to.be.equal(1);
     expect(childs[0]).to.be.equal(st2);
     done();
     });


     it('getReducers()', function (done) {
     var reducers,
     cb = function (state, action) {
     };

     st.addReducer("action1", cb);
     reducers = st.getReducers();
     expect(reducers.length).to.be.equal(1);
     expect(reducers[0].type).to.be.equal("action1");
     expect(reducers[0].callback).to.be.equal(cb);
     done();
     });

     it('dispatch() -- subscribe()', function (done) {
     var action1 = "actionone",
     action2 = "actiontwo",
     actiond1 = {
     type: "actionone",
     data: {
     myVar: "myVar"
     }
     },
     actiond2 = {
     type: "actiontwo",
     data: {
     myVar: "myVar"
     }
     },
     callback = function (actionInput, newState) {
     expect(actionInput).to.be.equal(actiond1);
     expect(newState).to.be.an('array');
     },
     callback1 = function (actionInput, newState) {
     expect(actionInput).to.be.equal(actiond1);
     expect(newState).to.be.an('array');
     },
     callback2 = function (actionInput, newState) {
     expect(actionInput).to.be.equal(actiond2);
     expect(newState).to.be.an('array');
     };
     st.subscribe(action1, callback);
     st.subscribe(action1, callback1);
     st.subscribe(action2, callback2);
     st.dispatch(actiond1);
     st.dispatch(actiond2);
     done();
     });

     it('addReducer()', function (done) {
     var spy1,
     spy2,
     newState,
     action1 = "actionone",
     action2 = "actiontwo",
     actiond1 = {
     type: "actionone",
     data: {
     myVar: "myVar"
     }
     },
     actiond2 = {
     type: "actiontwo",
     data: {
     myVar: "myVar"
     }
     },
     callback = function (actionInput, newSt) {
     expect(actionInput).to.be.equal(actiond1);
     expect(newSt[0]).to.be.equal(newState);
     expect(newSt).to.be.an('array');
     },
     callback2 = function (actionInput, newSt) {
     expect(actionInput).to.be.equal(actiond2);
     expect(newSt[0]).to.be.equal(newState);
     expect(newSt).to.be.an('array');
     };

     spy1 = sinon.spy(callback);
     spy2 = sinon.spy(callback2);
     st.subscribe(action1, spy1);
     st.addReducer(action1, function (actionInput, stateOld) {
     var newSt = {id: "testod"};
     expect(actionInput).to.be.equal(actiond1);
     expect(stateOld).to.be.an('array');
     newState = newSt;
     return newSt;
     });
     st.dispatch(actiond1);

     st.subscribe(action2, spy2);
     st.addReducer(action2, function (actionInput, stateOld) {
     var newSt = {id: "test"};
     expect(actionInput).to.be.equal(actiond2);
     expect(stateOld).to.be.an('array');
     newState = newSt;
     return newSt;
     });
     st.dispatch(actiond2);
     assert(spy1.calledOnce === true, 'Not call a listener');
     assert(spy2.calledOnce === true, 'Not call a listener');
     done();
     });*/
});