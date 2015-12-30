var UI = require('ui');
var ajax = require('ajax');
var Settings = require('settings');

var ips = ['192.168.1.230', '192.168.1.231']
//Used to keep a list of all wemo switches
var LiveRemotes = [];

//Setup Screen to start App
var main = new UI.Card({
	title: 'Webble',
	body: 'Please Wait...'
});
setupWemos();
main.show();
main.on('click', 'select', function() {
	
		console.log('SIZE'+ LiveRemotes.length);
		var menu = new UI.Menu({
			sections: [{
				title: 'Wemo',
				items: LiveRemotes
			}]
		});
		
		menu.on('select', function(e) {
			var toggle = -1;
				WemoRequest(
				ips[e.item.itemIndex],
				makeSOAPDataObject(
					"getbinarystate",
					"GetBinaryState",
					"/upnp/control/basicevent1",
					"urn:Belkin:service:basicevent:1#GetBinaryState",
					"<u:GetBinaryState xmlns:u=\"urn:Belkin:service:basicevent:1\"></u:GetBinaryState>"
				),
				function (request, SOAPData) {
					console.log('IO REQUEST!');
					toggle = parseInt(request.responseText);//.match(/<BinaryState>([0-9]+?)<\/BinaryState>/m)[1]
				}
			);
			
			console.log("Current I/O is "+ toggle);
			
			//Setup Menu & execute 
			if(toggle != -1){
				if(toggle == 1){
					// Turn OFF
						WemoRequest(ips[e.item.index], makeSOAPDataObject(
						"setbinarystate",
						"SetBinaryState",
						"/upnp/control/basicevent1",
						"urn:Belkin:serviceId:basicevent:1#SetBinaryState",
						"<u:SetBinaryState xmlns:u=\"urn:Belkin:service:basicevent:1\"><BinaryState>0</BinaryState></u:SetBinaryState>"
					));
				} else if(toggle === 0){
					//Turn ON
						WemoRequest(ips[e.item.index], makeSOAPDataObject(
						"setbinarystate",
						"SetBinaryState",
						"/upnp/control/basicevent1",
							"urn:Belkin:serviceId:basicevent:1#SetBinaryState",
						"<u:SetBinaryState xmlns:u=\"urn:Belkin:service:basicevent:1\"><BinaryState>1</BinaryState></u:SetBinaryState>"
					));
				}
			}else{ console.log('Error Parsing Things!');}
		});
	
	menu.show();
});

function setupWemos(){
	for(var i=0; i < ips.length; i++) {
	var ip = ips[i];
	ajax({ url: 'http://'+ ip +':49153/setup.xml'}, function(data){
	var body = data.match(/<friendlyName>(.*?)<\/friendlyName>/)[1];
	var	model = data.match(/<modelName>(.*?)<\/modelName>/)[1];
			 	if(model == "Socket" || model == "LightSwitch"){
					LiveRemotes.push({title: body});
				}
		main.body("Press Select Now");
	});
		
}
}



//'Borrowed' from Pebbos
// Half-inched from https://github.com/owlandgiraffe/Sobble
function makeSOAPDataObject(eventType, cmdType, uriType, actionType, bodyData) {
	var bodyText = "<?xml version=\"1.0\" encoding=\"utf-8\"?><s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\"><s:Body>" + bodyData + "</s:Body></s:Envelope>";

	return (
		{
			type : eventType,
			uri : uriType || "/upnp/control/basicevent1",
			action : actionType || "urn:Belkin:service:basicevent:1#" + cmdType,
			body : bodyText
		}
	);
}

//'Borrowed' from Pebbos
// Half-inched from https://github.com/owlandgiraffe/Sobble
function WemoRequest(ip, SOAPData, callback) {
	if (SOAPData === false || SOAPData === undefined) {
		console.log("Invalid SOAP data: " + JSON.stringify(SOAPData));
		return;
	}

	var url = "http://192.168.1.230:49153/upnp/control/basicevent1";

	try {
		var request = new XMLHttpRequest();
		request.open("POST","http://192.168.1.230:49153/upnp/control/basicevent1", true);
		request.setRequestHeader("Content-Type",  "text/xml");
		request.setRequestHeader("SOAPAction", "urn:Belkin:service:basicevent:1#GetBinaryState");

		request.onreadystatechange = function() {
  	    if (request.readyState == 4 && request.status === 200 && callback) {
    			callback(request, SOAPData);
				}else{console.log("Status: "+request.status + " State: "+request.readyState+" Callback: "+callback);}
		};
		var packet = '<?xml version="1.0" encoding="utf-8"?>'+
				'<s:Envelope xmls:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">'+
			'<s:Body>'+
				'<u:GetBinaryState xmlns:u="urn:Belkin:service:basicevent:1"></u:GetBinaryState>'+
			'</s:Body>'+
		'</s:Envelope>';


		request.send(packet);
		/*request.open("POST", url, false);
		request.setRequestHeader("SOAPAction", SOAPData.action);
		request.setRequestHeader("Content-Type", "text/xml");
		request.onload = function (e) {
			if (request.readyState === 4) {
				if (request.status === 200) {
					if (callback) {
						callback(request, SOAPData);
					}
				} else {
					console.log("Request returned error code " + request.status.toString());
				}
			}
		};
		request.send(SOAPData.body);*/

	} catch (error) {
		console.log("Error in XMLHttpRequest: " + error);
	}
}
/**
var page = new XMLHttpRequest();
console.log('starting');
page.open("GET", "http://192.168.1.230:49153/setup.xml", false);
console.log('sending');
page.send();
console.log(page.responseXML.match(/<friendlyName>(.*?)<\/friendlyName>/)[1]);
*/
