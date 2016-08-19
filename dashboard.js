var socket = io('', {
	'reconnection': true,
    'reconnectionDelay': 1000,
    'reconnectionAttempts': 50
});

$(document).ready(function() {

	$("#g-signout").hide();
	$("#topTable").hide();
	$("#export").hide();
	$('#download').hide();

	socket.on('connection', function(data){
		console.log("socket connected at "+ new Date().toGMTString());
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

$(window).on('beforeunload',function () {
	socket.close();
});
	
function exportMetrics() {
	console.log("Exporting top-level metrics");
	tableToCsvFile("topTable");
}