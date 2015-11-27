window.endpoint = "http://localhost:9999";
window.channer = {};
document.addEventListener("deviceready", function () {
	window.requestFileSystem(window.PERSISTENT, 0, function(fs) {
		window.channer.rawfs = fs;

		function check_patcher_version(config_next) {
			var new_url = window.endpoint + "/assets/patch." + config_next.versions[0].hash + ".js";
			var config_prev = null;
			function load_patch_script(url) {
				var script = document.createElement("script");
				script.onload = function (ev) {
					window.channer.patch(window.endpoint, function (config) {
						window.channer.bootstrap(config);
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
						config_prev = JSON.parse(reader.result);
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
					console.log("use new ver:" + new_url);
					//TODO: remove config.json
					load_patch_script(new_url);
				});				
			}, function (err) {
				console.log("use new ver:" + new_url);
					//TODO: remove config.json
				load_patch_script(new_url);
			});			
		}
		
		var config_url = window.endpoint + "/assets/config.json";
		var ft = new FileTransfer();
        ft.download(encodeURI(config_url), fs.root.toURL() + "config.json.next", function(entry) {
			entry.file(function (file) {    
				var reader = new FileReader();
				reader.onloadend = function (event) {
					check_patcher_version(JSON.parse(reader.result));
				}
				reader.readAsText(file);
			}, function (e) {
				//TODO: retry
			});				
        }, function (e) {
			//TODO: retry
        });
	});
});

