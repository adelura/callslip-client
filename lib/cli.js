var http = require('http'),
	prompt = require('prompt'),
	nconf = require('nconf'),
	nomnom = require('nomnom'),
	request = require('request');

var host, port, serverURI;

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
		setUp();
		defaultAction();
	});

nomnom.command('play')
	.callback(function () {
		checkConfig();
		setUp();
		defaultAction(defaultAction);
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

function setUp() {
	host = nconf.get('host');
	port = nconf.get('port');

	serverURI = 'http://' + host + ':' + port;

	prompt.message = '';
	prompt.start();
}

function defaultAction(cb) {
	request.get(serverURI + '/records/random')
		.on('response', function (res) {
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
					console.log('Answer: ' + record.sense);

					prompt.get({
						properties: {
							known: {
								description: 'Did you know this one(y/N)?'
							}
						}
					}, function (err, res) {
						if (!res) {
							process.exit(0);
						}
						var known = res.known;
						known = (known === 'y' || known === 't' || known === 'yes');

						request
							.post(serverURI + '/guesses')
							.form({
								recordId: record.id,
								known: known,
								timestamp: Date.now()
							});

						cb && cb(cb);
					});
				});
			});
		});
}

module.exports.run = function () {
	nomnom.parse();
};
