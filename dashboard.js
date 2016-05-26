var socket = new io.connect('', {
	'reconnection': true,
    'reconnectionDelay': 1000,
    'reconnectionAttempts': 50
});

var Overall = new Object();
var SkillGroups = new Array();
var auth2;
var Gid_token;
var profile;

function onSignIn(googleUser) {
	profile = googleUser.getBasicProfile();
//	console.log("ID: " + profile.getId()); // Don't send this directly to your server!
//	console.log("Name: " + profile.getName());
//	console.log("Image URL: " + profile.getImageUrl());
//	console.log("Email: " + profile.getEmail());

// The ID token to pass to backend
	Gid_token = googleUser.getAuthResponse().id_token;
	socket.emit('authenticate', {token: Gid_token, email: profile.getEmail()});
}

$(document).ready(function() {

  	$("#g-signout").hide();
  	$("#topTable").hide();
	
	if(DoUserAuth == false)
		socket.emit('authenticate', {});

	socket.on('connection', function(data){
		console.log("Socket connected");
    });
	socket.on('connect_timeout', function(data){
		console.log("socket timeout at "+ new Date().toGMTString());
	});

 	socket.on('errorResponse', function(data) {
		$("#message1").text(data);
	});

	socket.on('overallStats', function(data) {		
		$("#ctime").text("Last refreshed: "+new Date().toLocaleString());
		Overall = data;
		showTopLevelStats(data);
	});
	
	socket.on('departmentStats', function(ddata){
		for(var i in ddata)
		{
			showDeptLevelStats(ddata[i]);
		}
	});
	
	socket.on('authResponse', function(data){
		$("#g-signout").show();
		$("#topTable").show();
		if(DoUserAuth)
		{
			$("#gname").text(profile.getName());
			$("#gprofile-image").attr({src: profile.getImageUrl()});
		}
		$("#error").text("");
		console.log("User successfully signed in");
	});
});

function signOut() {
	auth2 = gapi.auth2.getAuthInstance();
	if(auth2 === 'undefined')
		console.log("auth2 is undefined");
	
	auth2.signOut().then(function () {
		console.log('User signed out.');
		$("#g-signout").hide();
		$("#topTable").hide();
		if(Gid_token !== 'undefined')
			socket.emit('un-authenticate', {token: Gid_token, email: profile.getEmail()});
	});
}

function showDeptLevelStats(data) {
	var rowid;
	var ttable = document.getElementById("topTable");
	rowid = document.getElementById(data.name);
	if(rowid === null)		// row doesnt exist so create one
	{
		rowid = createDeptRow(ttable, data.did, data.name);
	}
	showTopMetrics(rowid,data);
}

function showDepartment(did,dname) {
	window.open("department.html?did="+did, '_blank');
}

function exportMetrics() {
	console.log("Exporting top-level metrics");
	tableToCsvFile("topTable");
}