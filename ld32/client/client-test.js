//var wsUri = "ws://echo.websocket.org/";
//var wsUri = "ws://localhost:9999/";
var wsUri = "ws://localhost:8080/";
//var wsUri = "ws://192.168.1.44:8080/";

var output;
function init() {
    output = document.getElementById("output");
    testWebSocket();
}

function testWebSocket() {
    websocket = new WebSocket(wsUri);
    websocket.onopen = function(evt) { onOpen(evt) };
    websocket.onclose = function(evt) { onClose(evt) };
    websocket.onmessage = function(evt) { onMessage(evt) };
    websocket.onerror = function(evt) { onError(evt) };
}

function onOpen(evt) {
    writeToScreen("CONNECTED");
    doSend('{ "cmd" : "ping" }');
}

function onClose(evt) {
    writeToScreen("DISCONNECTED");
}
function onMessage(evt) {
    writeToScreen('<span style="color: blue;">RESPONSE: ' + evt.data+'</span>');
    //websocket.close();
}

function onError(evt) {
    writeToScreen('<span style="color: red;">ERROR:</span> ' + evt.data);
}

function doSend(message) {
    writeToScreen("SENT: " + message);
    websocket.send(message);
}

function writeToScreen(message) {
    var pre = document.createElement("p");
    pre.style.wordWrap = "break-word";
    pre.innerHTML = message;
    output.appendChild(pre);
}

window.addEventListener("load", init, false);
