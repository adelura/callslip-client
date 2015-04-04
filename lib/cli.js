var http = require('http'),
	prompt = require('prompt'),
	nconf = require('nconf'),
	nomnom = require('nomnom');

nconf.file({file: 'config/default.json'});

nomnom.command('set')
	.option('host', {
		help: 'Sets the server host.'
	})
	.option('port', {
		help: 'Sets the server port.'
	})
	.callback(function (opts) {
		if (opts.port) {
			nconf.set('port', opts.port);
		}

		if (opts.host) {
			nconf.set('host', opts.host);
		}

		nconf.save(function () {
			console.log('Config option(s) successfully saved.');
		});
	});

nomnom.command('')
	.callback(function () {
		checkConfig();
		defaultAction();
	});

function checkConfig() {
	var err = 0;

	if (!nconf.get('host')) {
		console.log('You should define "host" in config.');
		console.log('Run `callslip set --host 127.0.0.1`.\n');
		err++;
	}

	if (!nconf.get('host')) {
		console.log('You should define "port" in config.');
		console.log('Run `callslip set --port 3000`.\n');
		err++;
	}

	err && process.exit(1);
}

function defaultAction() {
	var host = nconf.get('host'),
		port = nconf.get('port');

	var serverURI = 'http://' + host + ':' + port;

	prompt.message = '';
	prompt.start();

	http.get(serverURI + '/records/random', function (res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			var record = JSON.parse(chunk);

			var props = {
				properties: {
					known: {
						description: ('Word to guess: "' + record.from + '".')
					}
				}
			};
			prompt.get(props, function (err) {
				console.log('Answer:\n\t' + record.sense);

				prompt.get({
					properties: {
						known: {
							description: 'Did you know this one(y / n - default)?'
						}
					}
				}, function (err, res) {
					var known = res.known === 'y';

					var content = JSON.stringify({
						recordId: record.id,
						known: known
					});
					var options = {
						host: host,
						port: port,
						path: '/guesses',
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Content-Length': content.length
						}
					};

					var req = http.request(options, function (res) {
						res.setEncoding('utf-8');

						res.on('end', function () {
							console.log('end');
						});
					});

					req.write(content);
					req.end();
				});
			});
		});
	});
}

module.exports.run = function () {
	nomnom.parse();
};
