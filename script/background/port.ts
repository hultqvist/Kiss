"use strict";

var portFromCS: chrome.runtime.Port;

function connected(p: chrome.runtime.Port) {
    portFromCS = p;
    portFromCS.postMessage({ greeting: "hi there content script!" });
    portFromCS.onMessage.addListener(function (m) {
        console.log("In background script, received message from content script")
        console.log(m.greeting);
    });
}

chrome.runtime.onConnect.addListener(connected);

chrome.pageAction.onClicked.addListener(function () {
    portFromCS.postMessage({ greeting: "they clicked the button!" });
});