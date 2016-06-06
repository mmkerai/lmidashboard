// utilities for use in dashboard 
var socket = new io.connect();
var ChatStatus = ["Logged Out","Away","Available"];
var GOOGLE_CLIENT_ID="817020760023-41aoervnm8ntf76poubf8nq57lp9ek7f.apps.googleusercontent.com";
var csvfile = null;
var googleUser;


function readCookie(name)
{
  name += '=';
  var parts = document.cookie.split(/;\s*/);
  for (var i = 0; i < parts.length; i++)
  {
    var part = parts[i];
    if (part.indexOf(name) == 0)
      return part.substring(name.length);
  }
  return null;
}

/*
 * Saves a cookie for delay time. If delay is blank then no expiry.
 * If delay is less than 100 then assumes it is days
 * otherwise assume it is in seconds
 */
function saveCookie(name, value, delay)
{
  var date, expires;
  if(delay)
  {
	  if(delay < 100)	// in days
		  delay = delay*24*60*60*1000;	// convert days to milliseconds
	  else
		  delay = delay*1000;	// seconds to milliseconds
	  
	  date = new Date();
	  date.setTime(date.getTime()+delay);	// delay must be in seconds
	  expires = "; expires=" + date.toGMTString();		// convert unix date to string
  }
  else
	  expires = "";
  
  document.cookie = name+"="+value+expires+"; path=/";
}

/*
 * Delete cookie by setting expiry to 1st Jan 1970
 */
function delCookie(name) 
{
	document.cookie = name + "=; expires=Thu, 01-Jan-70 00:00:01 GMT; path=/";
}

function toHHMMSS(seconds) {
    var sec_num = parseInt(seconds, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = hours+':'+minutes+':'+seconds;
    return time;
}

function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
}

function checksignedin(gauth2) {
	
//	gauth2 = gapi.auth2.getAuthInstance();
	if(gauth2.isSignedIn.get() == true)
	{
		console.log("geezer signed in");
		googleUser = gauth2.currentUser.get();
		console.log("Current user: "+googleUser.getBasicProfile().getEmail());
		onSignIn(googleUser);	// do app authentication
	
	}
	else
	{	
		console.log("geezer not signed in");
		var gPromise = gauth2.signIn(); 
		gauth2.isSignedIn.listen(signinListener);
	}
}

function signinListener() {
	console.log("Listener signed in");
	var gauth2 = gapi.auth2.getAuthInstance();
	googleUser = gauth2.currentUser.get();
	onSignIn(googleUser);	// do app authentication
}

function initGSignin() {
	console.log("gapi initialised");
	var gauth2 = gapi.auth2.getAuthInstance();
//    gapi.load('auth2', function() {
//        gapi.auth2.init("{'scope': 'profile'}");
//    });
	$('#rtaversion').text("Bold Dashboard v1.0");
	checksignedin(gauth2);
}
	
function onSignIn(googleUser) {
	var profile = googleUser.getBasicProfile();
//	console.log("ID: " + profile.getId()); // Don't send this directly to your server!
//	console.log("Name: " + profile.getName());
//	console.log("Image URL: " + profile.getImageUrl());
	console.log("Email: " + profile.getEmail());	
	var gid_token = googleUser.getAuthResponse().id_token;
	socket.emit('authenticate', {token: gid_token, email: profile.getEmail()});
}

function signOut() {
	var auth2 = gapi.auth2.getAuthInstance();
	auth2.signOut().then(function () {
		console.log('User signed out.');
		if(googleUser !== 'undefined')
		{
			var profile = googleUser.getBasicProfile();
			$("#g-signout").hide();
			$("#topTable").hide();
			$('#download').hide();
			$('#export').hide();	
			if(typeof profile !== 'undefined')
				socket.emit('un-authenticate', {token: googleUser.getAuthResponse().id_token, email: profile.getEmail()});
		}
	});
}

// print top level table with metrics
function showTopLevelStats(data) {
	var rowid;
	var ttable = document.getElementById("topTable");
	rowid = document.getElementById(data.name);
	if(rowid === null)		// row doesnt exist so create one
	{
		rowid = createTopRow(ttable, data.did, data.name);
	}
	showTopMetrics(rowid,data);
}

function createTopRow(tableid, id, name) {
	
	row = tableid.insertRow();	
	row.id = name;
	var cols = tableid.rows[0].cells.length;
	for(var i=0; i < cols; i++)
	{
		row.insertCell(i);
	}
	row.cells[0].outerHTML = "<th class='h3g_link' onClick=\"showSkillGroup('"+id+"','"+name+"')\">"+name+"</th>";

	return row;
}

function createDeptRow(tableid, id, name) {
	
	row = tableid.insertRow();	
	row.id = name;
	var cols = tableid.rows[0].cells.length;
	for(var i=0; i < cols; i++)
	{
		row.insertCell(i);
	}
	row.cells[0].outerHTML = "<th class='h3g_link' onClick=\"showDepartment('"+id+"','"+name+"')\">"+name+"</th>";

	return row;
}

function showTopMetrics(rowid, data) {
	var tcanpc = " (0%)";
	var tcunpc = " (0%)";
	
	if(data.tco != 0)
	{
		tcanpc = " ("+Math.round((data.tcan/data.tco)*100)+"%)";
		tcunpc = " ("+Math.round((data.tcun/(data.tcun+data.tco))*100) +"%)";
	}

	rowid.cells[1].outerHTML = NF.printConcurrency(data.cconc);
	rowid.cells[2].outerHTML = NF.printSL(data);
	rowid.cells[3].innerHTML = data.ciq;
	rowid.cells[4].innerHTML = toHHMMSS(data.lwt);
	rowid.cells[5].innerHTML = data.tco;
	rowid.cells[6].innerHTML = data.tac;
	rowid.cells[7].outerHTML = NF.printAnswered(data);
	rowid.cells[8].innerHTML = data.tcuq;
	rowid.cells[9].innerHTML = data.tcua;
	rowid.cells[10].innerHTML = data.tcun + tcunpc;
	rowid.cells[11].outerHTML = NF.printASA(data.asa);
	rowid.cells[12].outerHTML = NF.printACT(data.act);	
	rowid.cells[13].innerHTML = data.acc;
	rowid.cells[14].innerHTML = data.oaway;
	rowid.cells[15].innerHTML = data.oavail+data.oaway;	// total logged in
}

function showOperatorMetrics(rowid, data) {

	var act = 0;
	if(data.tct > 0)
		act = Math.round(data.tct/data.tcan);
	
	rowid.cells[1].innerHTML = ChatStatus[data.status]+":"+data.cstatus;
	rowid.cells[2].innerHTML = toHHMMSS(data.tcs);
	rowid.cells[3].innerHTML = data.ccap;
	rowid.cells[4].innerHTML = data.activeChats.length;
	rowid.cells[5].innerHTML = data.acc;
	rowid.cells[6].innerHTML = data.tcan;
	rowid.cells[7].innerHTML = data.cph;	
	rowid.cells[8].outerHTML = NF.printACT(act);	
	rowid.cells[9].outerHTML = NF.printConcurrency(data.cconc);
}

/* build csvfile from table to export snapshot
 */
function tableToCsvFile(dashtable) {
	var key, keys, j, i, k;
	var str = "";

	$('#download').hide();	
	$("#message1").text("Preparing file for export");
	var exportData = "Dashboard Metrics Export "+new Date().toUTCString()+"\r\n";
	exportData = exportData + "\r\n";
	var ttable = document.getElementById(dashtable);
	for(var x = 0; x < ttable.rows.length; x++)
	{
		row = ttable.rows[x];
		for (var j = 0, col; col = row.cells[j]; j++)
		{
			str = str +"\""+ col.innerHTML + "\",";
		} 
		str = str + "\r\n";
	}
	exportData = exportData + str +"\r\n";		
	prepareDownloadFile(exportData);
}

/* build csvfile to export snapshot
 * First param is an object and second is an array of same objects
 * e.g. Overall and Skillgroups or Skillgroup and Departments
 */
function buildCsvFile(fdata, sdata) {
	var key, keys, j, i, k;
	var str = "";

	$('#download').hide();	
	$("#message1").text("Preparing file for export");
	var exportData = "Dashboard Metrics Export "+new Date().toUTCString()+"\r\n";
	// add csv header using keys in first object
	exportData = exportData + "\r\n";
//	key = Object.keys(fdata);
//	keys = fdata[key];
	for(key in fdata)
	{
		exportData = exportData +key+ ",";
	}
	exportData = exportData + "\r\n";
	// now add the data
	for(i in fdata)
	{
		str = str + fdata[i] + ",";
	}
	str = str + "\r\n";
	for(j in sdata)
	{
		var obj = new Object();
		obj = sdata[j];
		for(k in obj)
		{
			str = str + obj[k] + ",";
		}
	str = str + "\r\n";
	}

	exportData = exportData + str +"\r\n";
	prepareDownloadFile(exportData);
}

/*
 *	This function makes data (typically csv format) available for download
 *  using the DOM id "download" which should be labelled "download file"
 */
function prepareDownloadFile(data)
{
	var filedata = new Blob([data], {type: 'text/plain'});
	// If we are replacing a previously generated file we need to
	// manually revoke the object URL to avoid memory leaks.
	if (csvfile !== null)
	{
		window.URL.revokeObjectURL(csvfile);
	}

    csvfile = window.URL.createObjectURL(filedata);
	$("#message1").text("Snapshot exported "+ new Date().toUTCString());
	$('#download').attr("href",csvfile);
	$('#download').show(300);
}

function checkUserAuth() {
	DoUserAuth = true;		// true of on Heroku but false of on local node.js platform
//	DoUserAuth = false;
}

function showDashboardHeader() {
	var str = '<h2><center><img src="lmilogo.png"/>&nbsp;Dashboard</center></h2>'+
		'<div class="wrapper col-xs-12">'+
			'<span>&nbsp;</span>'+
		'</div>'+
		'<div class="wrapper col-xs-12">' +
		'<div class="col-xs-2">' +
			'<div class="g-signin2" data-onsuccess="onSignIn" data-theme="dark"></div>' +
		'</div>' +
		'<div id="g-signout" class="col-xs-4">' +
			'<img id="gprofile-image" class="img-circle" width="48" height="48" alt="Profile Image">' +
			'<span id="gname">Name</span>&nbsp;' +
			'<a href="#" class="btn btn-success" onClick="signOut();">Sign Out</a>' +
		'</div>' +
		'<div class="col-xs-4">' +
			'<button id="export" type="button" class="btn btn-info" onClick="exportMetrics()">Export</button>'+
			'<span class="col-xs-offset-1" id="message1"></span>' +
			'<a class="btn btn-success" download="RTAexport.csv" id="download">Download file</a>'+
		'</div>'+
		'<span id="rtaversion" class="pull-right"></span> '+
		'</div>'+
		'<div class="wrapper col-xs-12">'+
//			'<span>&nbsp;</span>'+
		'<div class="col-xs-4">' +
			'<p id="error"></p>' +
		'</div>'+
		'</div>';

document.write(str);
}

function showDashboardFooter() {
var str = '<hr size="4" noshade/>'+
	'<div class="wrapper col-xs-12">'+
		'<span id="ctime" class="pull-right"></span> '+
	'</div> ';
	
document.write(str);
}

//Threshold print functions
// ACT
NF.printACT = function(value) {
	
	if (value == 0)			// 0 so default colour
		return '<td>' + toHHMMSS(value) + '</td>';

	if(value >= this.thresholds.ACT.red) {
		return '<td class="nf-red">' + toHHMMSS(value) + '</td>';
	}
	
	if(value >= this.thresholds.ACT.amber) {
		return '<td class="nf-amber">' + toHHMMSS(value) + '</td>';
	}
	
	return '<td class="nf-green">' + toHHMMSS(value) + '</td>';
};


// ASA
NF.printASA = function(value) {
	
	if (value == 0)			// 0 so default colour
		return '<td>' + toHHMMSS(value) + '</td>';

	if(value >= this.thresholds.ASA.red)
		return '<td class="nf-red">' + toHHMMSS(value) + '</td>';
	
	if(value >= this.thresholds.ASA.amber)
		return '<td class="nf-amber">' + toHHMMSS(value) + '</td>';
	
	return '<td class="nf-green">' + toHHMMSS(value) + '</td>';
};

// SL
NF.printSL = function(data) {
	var slapc = 0;

	if(data.tcan != 0)
		slapc = Math.round((data.csla/data.tcan)*100);

	if (slapc == 0)			// 0 so default colour
		return '<td>' + slapc + '%</td>';

	if(slapc >= this.thresholds.SL.green)
		return '<td class="nf-green">' + slapc + '%</td>';
	
	if(slapc >= this.thresholds.SL.amber) 
		return '<td class="nf-amber">' + slapc + '%</td>';
	 
	return '<td class="nf-red">' + slapc + '%</td>';
};

// Concurrency
NF.printConcurrency = function(value) {
	
	if (value == 0)			// 0 so default colour
		return '<td>' + value + '</td>';

	if (value > this.thresholds.concurrency.green)
		return '<td class="nf-green">' + value + '</td>';
	
	else if ( value <= this.thresholds.concurrency.green && value >= this.thresholds.concurrency.amber )
		return '<td class="nf-amber">' + value + '</td>';
	
	else 
		return '<td class="nf-red">' + value + '</td>';
};

// Answered
NF.printAnswered = function(data) {
	var value = 0;

	if(data.tco != 0)
		value = Math.round((data.tcan/data.tco)*100);
		
	tcanpc = data.tcan+" ("+value+"%)";

	if(value == 0)			// 0 so default colour
		return '<td>' + tcanpc + '</td>';

	if(value >= this.thresholds.answered.green)
		return '<td class="nf-green">' + tcanpc + '</td>';
	
	if(value >= this.thresholds.answered.amber)
		return '<td class="nf-amber">' + tcanpc + '</td>';
	
	return '<td class="nf-red">' + tcanpc + '</td>';
};

// Unanswered
NF.printUnanswered = function(value) {
	
	if (value == 0)			// 0 so default colour
		return '<td>' + value + '</td>';

	if(value >= this.thresholds.unanswered.red)
		return '<td class="nf-red">' + value + '</td>';
		
	if(value >= this.thresholds.unanswered.amber)
		return '<td class="nf-amber">' + value + '</td>';
	
	else
		return '<td class="nf-green">' + value + '</td>';
};

