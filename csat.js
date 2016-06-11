var did;
var DeptOperators = new Array();
var Operators = new Array();

$(document).ready(function() {
did = getURLParameter("did");
oid = getURLParameter("oid");

	$("#g-signout").hide();
	$("#csatTable").hide();
	$("#export").hide();
	$('#download').hide();

	socket.on('connection', function(data){
		console.log("Socket connected");
    });
	socket.on('connect_timeout', function(data){
		console.log("socket timeout at "+ new Date().toGMTString());
	});
	socket.on('error', function(data){
		console.log("socket error at "+ new Date().toGMTString());
	});
	socket.on('disconnect', function(data){
		console.log("socket error at "+ new Date().toGMTString());
	});
 	socket.on('errorResponse', function(data){
		$("#message1").text(data);
	});
	socket.on('deptOperators', function(data){
		DeptOperators = data[did];	// get dept operators
	});
	if(did != null)
	{
		socket.on('departmentStats', function(data){
			$("#ctime").text("Last refreshed: "+new Date().toLocaleString());
			for(var i in data)
			{
				if(did == data[i].did)		// only if this is the department
				{
					showCsatStats(data[i]);
				}
			}
		});	
	}
	else
	{
		socket.on('operatorStats', function(data){
			$("#ctime").text("Last refreshed: "+new Date().toLocaleString());
			for(var i in data)
			{
				if(oid == data[i].oid)		// only if this operator belongs to this dept
				{
					showCsatStats(data[i]);
				}
			}
		});
	}
	socket.on('authResponse', function(data){
		var profile = googleUser.getBasicProfile();
		$("#g-signout").show();
		$("#csatTable").show();
		$("#export").show();
		$('#download').hide();
		$("#gname").text(profile.getName());
		$("#gprofile-image").attr({src: profile.getImageUrl()});
		$("#error").text("");
		console.log("User successfully signed in");
	});
});

function showOperatorStats(data) {
	var rowid;
	var ttable = document.getElementById("deptTable");
	rowid = document.getElementById(data.name);
	if(rowid === null)		// row doesnt exist so create one
	{
		rowid = createOperatorRow(ttable, data.oid, data.name);
	}
	showOperatorMetrics(rowid,data);
}

function createOperatorRow(tableid, id, name) {
	
	row = tableid.insertRow();	// there is already a header row and top row
	row.id = name;
	var cols = tableid.rows[0].cells.length;
	for(var i=0; i < cols; i++)
	{
		row.insertCell(i);
	}
	row.cells[0].outerHTML = "<th>"+name+"</th>";
	return row;
}

/*function createDeptRow(tableid,index,sg,name) {

	var sgid = "SG"+sg.replace(/\s/g,"");		// prefix tbody element id with SG so doesnt clash with toplevelmetrics row
	var tb = document.getElementById(sgid);
	if(tb === null)
	{
		tb = tableid.appendChild(document.createElement('tbody'));
		tb.id = sgid;
	}
	row = tb.insertRow();
//	row = tableid.insertRow(index+1);
	row.id = name;
	var cols = tableid.rows[0].cells.length;
	for(var i=0; i < cols; i++)
	{
		row.insertCell(i);
	}
	row.cells[0].outerHTML = "<td onClick=\"showOperators('"+name+"')\">"+name+"</td>";
	$("#"+sgid).hide();		// start of hiding it
	ShowDept[sg] = false;
			
	return row;
}*/

function exportMetrics() {
	console.log("Exporting operator metrics");
	tableToCsvFile("deptTable");
}