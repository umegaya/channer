window.endpoint = "http://localhost:9999";
window.environment = "dev";
window.channer = {
	onResume: [],
	onPause: [],
	onPush: [],
	components: {
        active: {},
    },
    parts: {},
	rparts: {},
    category: {},
	mobile: document.URL.indexOf('http://') < 0 && document.URL.indexOf('https://') < 0,
    testtmp: {},
	chaos: false,
};

console.log("js loaded");

function initfs(quota, bootstrap) {
    if (navigator.webkitPersistentStorage) {
        navigator.webkitPersistentStorage.requestQuota(quota, function(grantedBytes) {
            window.requestFileSystem(window.PERSISTENT, grantedBytes, bootstrap);
        }, function (e) {
            console.log("initfs error:" + e);
            setTimeout(initfs.bind(quota, bootstrap), 1);
        }); 
    }
    else {
         window.requestFileSystem(window.PERSISTENT, quota, bootstrap);
    }
}

document.addEventListener("deviceready", function () {
	var env = document.URL.match(/env=([^&]+)/);
	if (env && env[1]) {
		console.log("set app environment = " + env[1]);
		window.environment = env[1];
		window.channer.chaos = window.environment.match(/chaos/);
	}
	document.addEventListener("resume", function () {
		window.channer.onResume.forEach(function (f){ f(); })	
	});
	document.addEventListener("pause", function () {
		window.channer.onPause.forEach(function (f){ f(); })			
	});
	initfs(50 * 1024 * 1024, function(fs) {
		window.channer.rawfs = fs;
		
		if (window.environment.match(/dev/) && 
            window.endpoint.match('http://localhost') && 
            window.location.hostname) {
			window.endpoint = window.endpoint.replace("localhost", window.location.hostname);
			console.log("replace endpoint to " + window.endpoint + " " + window.location.hostname);
		}

		var ft = new FileTransfer();
		function alert_bad_network(error) {
			try {
				throw new Error((error && error.message) ? error.message : "dummy");
			}
			catch (e) {
				console.log("env = " + window.environment + "|" + window.channer.app);
				alert("this device under bad network connection. " + 
					"go to the place where provides good connection, then retry. " + 
					"error at " + e.stack);
			}
		}
		function launch(error) {
			if (error) {
				alert_bad_network(error);
			}
		    var config_url = window.endpoint + "/assets/config.json";
			try {
				ft.download(encodeURI(config_url), fs.root.toURL() + "config.json.next", function(entry) {
					if (window.channer.chaos && Math.random() < 0.1) {
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
					console.log("download error:" + e.code + "|" + config_url);
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
		
		function execute_patcher(ev) {
			window.channer.patch(window.endpoint, function (config) {
				console.log("end patch");
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
		
		function load_script(url, cb) {
			var script = document.createElement("script");
			script.onload = cb;
			script.type = "text/javascript";
			script.src = url;
			document.head.appendChild(script);			
		}
		
		function load_or_dl_script(prev_ver, now_ver, cb) {
			if (prev_ver == null || prev_ver.hash != now_ver.hash) {
				var url = window.endpoint + "/assets/" + now_ver.name + "." + now_ver.hash + ".js";
				console.log("use new ver:" + url);
				load_script(url, cb);
			}
			else {
				var url = fs.root.toURL() + "assets/" + prev_ver.name + ".js";
				console.log("use cached ver:" + url);
				load_script(url, cb);
			}			
		}

		function check_patcher_version(config_next) {
			var new_cmns_ver = config_next.versions[0], new_patch_ver = config_next.versions[1];
			var cmns_ver = null, patch_ver = null;
			function load_patch_script() {
				load_or_dl_script(patch_ver, new_patch_ver, execute_patcher);
			}
			function load_commons_script() {
				load_or_dl_script(cmns_ver, new_cmns_ver, load_patch_script);
			}
			fs.root.getFile("config.json", null, function (entry) {
				entry.file(function (file) {    
					var reader = new FileReader();
					reader.onloadend = function (event) {
						var config_prev = null;
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
						cmns_ver = config_prev.versions[0], patch_ver = config_prev.versions[1];
						load_commons_script();
					}
					reader.readAsText(file);
				}, function (e) {
					console.log("fail to read config.json");
					remove_config(function () {
						console.log("err1:" + JSON.stringify(e));
						load_commons_script();
					})
				});				
			}, function (err) {
				console.log("err2:" + JSON.stringify(err));
				load_commons_script();
			});			
		}
		fs.root.getFile("pg_devapp_config.json", null, function (entry) {
			entry.file(function (file) {    
                console.log("entry file:" + entry.toURL());
				var reader = new FileReader();
				reader.onloadend = function (event) {
					try {
                        console.log("entry contents:" + reader.result);
						var devapp_config = JSON.parse(reader.result);
						if (devapp_config.address) {
							var m = devapp_config.address.match(/([^:]+):?[0-9]*/);
							if (m) {
                                console.log("pg settings: " + m[1]);
								window.endpoint = window.endpoint.replace("localhost", m[1]);
								console.log("use devapp config: replace endpoint to " + window.endpoint);
							}
						}
					}
					catch (e) {
					}
					launch();
				}
			    reader.readAsText(file);
			}, function (err) {
				launch();
			});
		}, function (err) {
			launch();
		});
	});
});

