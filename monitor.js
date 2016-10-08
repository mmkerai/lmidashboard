var socket = io('', {
	'reconnection': true,
    'reconnectionDelay': 1000,
    'reconnectionAttempts': 50
});

function downloadChats()
{
	var data = new Object();
	$("#message").text("Creating csv file");
	socket.emit('downloadChats', data);
}

$(document).ready(function() {
		
 	socket.on('errorResponse', function(data){
		$("#message1").text(data);
	});

	socket.on('authResponse', function(data){
		var profile = googleUser.getBasicProfile();
		$("#g-signout").show();
		$("#export").show();
		$('#download').hide();
		$("#gname").text(profile.getName());
		$("#gprofile-image").attr({src: profile.getImageUrl()});
		$("#error").text("");
		console.log("User successfully signed in");
	});
	
	socket.on('consoleLogs', function(data){
		$('#conlog').append(data+"\r\n");
		document.getElementById("conlog").scrollTop = document.getElementById("conlog").scrollHeight	
	});

	socket.on('exceptions', function(data){
		var str = "";
		for(var key in data)
		{
			str = str + key + ":" + data[key] +"<br/>";
		}
		$('#exp').html(str+"<br/>");
	});

	// this gives list of socket ids to user names. Remove duplicate user name first before
	// showing who's logged on
	socket.on('usersLoggedIn', function(data){
		var str = "Users logged in:\r\n";
		var uniqNames = new Object();
		for(var key in data)
		{
			if(uniqNames[data[key]] === undefined)
				uniqNames[data[key]] = data[key];
		}
		for(var i in uniqNames)
		{
			str = str + i +"\r\n";
		}
		$('#lusers').text(str);
	});

	socket.on('chatsCsvResponse', function(data){
		var csvfile;
		
		$("#result").text("Download csv file");
		var filedata = new Blob([data],{type: 'text/plain'});
		// If we are replacing a previously generated file we need to
		// manually revoke the object URL to avoid memory leaks.
		if (csvfile !== null)
		{
			window.URL.revokeObjectURL(csvfile);
		}
		csvfile = window.URL.createObjectURL(filedata);
		$('#link2').attr('href', csvfile);
		$('#link2').html("Download file");
	});

});

$(window).on('beforeunload',function () {
	socket.close();
});