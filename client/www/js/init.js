window.endpoint = "http://localhost:9999";
window.environment = "dev";
window.channer = {
	onResume: [],
	onPause: [],
	onPush: [],
	components: {
        active: {},
    },
	mobile: document.URL.indexOf('http://') < 0 && document.URL.indexOf('https://') < 0,
    testtmp: {},
};

document.addEventListener("deviceready", function () {
	var env = document.URL.match(/env=([^&]+)/);
	if (env && env[1]) {
		console.log("set app environment = " + env[1]);
		window.environment = env[1];
	}
	document.addEventListener("resume", function () {
		window.channer.onResume.forEach(function (f){ f(); })	
	});
	document.addEventListener("pause", function () {
		window.channer.onPause.forEach(function (f){ f(); })			
	});
	window.requestFileSystem(window.PERSISTENT, 0, function(fs) {
		window.channer.rawfs = fs;
		
		if (window.environment.match(/dev/) && window.endpoint.match('http://localhost')) {
			window.endpoint = window.endpoint.replace("localhost", window.location.hostname);
			console.log("replace endpoint to " + window.endpoint + " " + window.location.hostname);
		}

		var config_url = window.endpoint + "/assets/config.json";
		var ft = new FileTransfer();
		function alert_bad_network(error) {
			try {
				throw new Error("dummy");
			}
			catch (e) {
				console.log("env = " + window.environment);
				alert("this device under bad network connection. " + 
					"go to the place where provides good connection, then retry. " + 
					"error at " + e.stack);
			}
		}
		function launch(error) {
			if (error) {
				alert_bad_network(error);
			}
			try {
				ft.download(encodeURI(config_url), fs.root.toURL() + "config.json.next", function(entry) {
					if (window.environment.match(/chaos/) && Math.random() < 0.1) {
						launch(new Error());
						return;
					}
					entry.file(function (file) {
						var reader = new FileReader();
						reader.onloadend = function (event) {
							check_patcher_version(JSON.parse(reader.result));
						}
						reader.readAsText(file);
					}, function (e) {
						//retry download
						launch(e);
					});				
				}, function (e) {
					//retry download
					console.log("download error:" + e.code + "|" + window.endpoint);
					launch(e);
				});
			}
			catch (e) {
				launch(e);				
			}
		}
		
		function remove_config(cb) {
			fs.root.getFile("config.json", null, function (entry) {
				entry.remove(cb);
			}, function (e) {
				if (e.name == "NotFoundError") {
					cb(); //already removed. ok.
				}
				else {
					throw e;
				}
			})
		}

		function check_patcher_version(config_next) {
			var new_url = window.endpoint + "/assets/patch." + config_next.versions[0].hash + ".js";
			var config_prev = null;
			function load_patch_script(url) {
				var script = document.createElement("script");
				script.onload = function (ev) {
					window.channer.patch(window.endpoint, function (config) {
						try {
							window.channer.bootstrap(config);
						}
						catch (e) {
							console.log("bootstrap error: " + e.message);
						}
					}, function (error) {
						console.log("bootstrap fails:" + JSON.stringify(error));
						//broken script?
						//remove config.json => retry from first
						remove_config(launch);
					});
				}
				script.type = "text/javascript";
				script.src = url;
				document.head.appendChild(script);
			}
			fs.root.getFile("config.json", null, function (entry) {
				entry.file(function (file) {    
					var reader = new FileReader();
					reader.onloadend = function (event) {
						try {
							config_prev = JSON.parse(reader.result);
						}
						catch (e) {
							console.log("broken config.json:" + reader.result + " error:" + e.message);
							remove_config(launch);
							return;							
						}
						if (!config_prev.versions || config_prev.versions.length <= 0) {
							console.log("broken config.json");
							remove_config(launch);
							return;
						}
						if (config_prev.versions[0].hash != config_next.versions[0].hash) {
							console.log("use new ver:" + new_url);
							load_patch_script(new_url);
						}
						else {
							var cache_url = fs.root.toURL() + "assets/patch.js";
							console.log("use cached ver:" + cache_url);
							load_patch_script(cache_url);
						}
					}
					reader.readAsText(file);
				}, function (e) {
					console.log("fail to read config.json");
					remove_config(function () {
						console.log("use new ver:" + new_url);
						load_patch_script(new_url);
					})
				});				
			}, function (err) {
				console.log("use new ver:" + new_url);
				load_patch_script(new_url);
			});			
		}
		launch();
	});
});

