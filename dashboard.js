var Overall = new Object();
var SkillGroups = new Array();

$(document).ready(function() {

	$("#g-signout").hide();
	$("#topTable").hide();
	$("#export").hide();
	$('#download').hide();

	socket.on('connection', function(socket){		
		console.log("Socket connected");
	});
	socket.on('error', function(data){
		console.log("socket error at "+ new Date().toGMTString());
	});
	socket.on('disconnect', function(data){
		console.log("socket error at "+ new Date().toGMTString());
	});
	socket.on('connect_timeout', function(data){
		console.log("socket timeout at "+ new Date().toGMTString());
	});
	socket.on('errorResponse', function(data) {
		$("#error").text(data);
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
		var profile = googleUser.getBasicProfile();
		$("#g-signout").show();
		$("#topTable").show();
		$("#export").show();
		$('#download').hide();
		$("#gname").text(profile.getName());
		$("#gprofile-image").attr({src: profile.getImageUrl()});
		$("#error").text("");
		console.log("User successfully signed in");
	});
});

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