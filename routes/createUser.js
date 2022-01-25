const express = require('express')
const router = express.Router()
const request = require('request')
// use .env file
const dotenv = require('dotenv');
dotenv.config();
// random name generator
const random_name = require('node-random-name');

// Environment variables
const APP_ID_CLIENT_ID = process.env.APP_ID_CLIENT_ID // Name or id of the client
const APP_ID_CLIENT_SECRET = process.env.APP_ID_CLIENT_SECRET // Secret of the client
const APP_ID_TOKEN_URL = process.env.APP_ID_TOKEN_URL // OpenID endpoint for login token
const RHSSO_BANK_REALM = process.env.RHSSO_BANK_REALM || "banksso"
const RHSSO_BASE_URL = process.env.RHSSO_BASE_URL || APP_ID_TOKEN_URL.split("/auth/")[0]

/**
 * Provides a randomly generated name in the form of '<first> <last>' in plaintext
 */
router.get('/random_user', function (req, res) {
	console.log("/random_user")
	res.send(random_name())
})

/**
 * Login endpoint
 * Given a username and password via JSON, provide a login token (access and id) and place them in the cookie jar
 */
router.post('/login', function (req, res) {
	console.log("/login")
	getLoginTokens(req.body.username, req.body.password, (err, response, body) => {
		if (err) { // Failed to login
			console.log(err)
			console.log(response)
			console.log(body)
			res.send(err)
		} else {
			let jsonBody = JSON.parse(body)
			if (jsonBody.error) { // Can not parse json returned
				console.log(jsonBody)
				res.status('404').send(body)
			} else {
				if (response.statusCode == 200) { // Login successful
					let expiry = jsonBody.expires_in || 1
					let cookieOptions = {
						maxAge: expiry * 1000
					}
					res.cookie('access_token', jsonBody.access_token, cookieOptions)
					res.cookie('id_token', jsonBody.id_token, cookieOptions)
					res.send(body)
				} else {
					res.status(response.statusCode).send(body) // Other HTTP error caused by login
				}
			}
		}
	})
})


/**
 * Log in as the client used by the application. Provides auth tokens in callback
 */
function loginAsClient(callback) {
	const options = {
		method: 'POST',
		url: APP_ID_TOKEN_URL + "/token",
		headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		form: {
			grant_type: 'client_credentials',
			client_id: APP_ID_CLIENT_ID,
			client_secret: APP_ID_CLIENT_SECRET
		},
	};
	request(options, function (err, response, body) {
		callback(err, response, body)
	})
}


/**
 * Create user endpoint
 * Given a first name, last name, email and password, create a new user account in RHSSO
 */
router.post('/create_account', function (req, res) {
	console.log("/create_account")
	let requestBody = req.body
	  
	  // Sign into RHSSO as the client, which should have user creation privileges
	  loginAsClient(function (error, response, body) {
		if (error) console.log(error)
		let jsonBody = JSON.parse(body)
		if (jsonBody.error) {
			console.log(jsonBody)
			res.status('404').send(body)
		} else {
			if (response.statusCode == 200) {

				// User creation request body
				let token = jsonBody.access_token
				const accountOptions = {
					method: 'POST',
					url: RHSSO_BASE_URL + '/auth/admin/realms/' + RHSSO_BANK_REALM + '/users',
					headers: {
					  'Content-Type': 'application/json',
					  Authorization: 'Bearer ' + token
					},
					body: {
					  firstName: requestBody.firstName,
					  lastName: requestBody.lastName,
					  email: requestBody.email,
					  enabled: 'true',
					  username: requestBody.firstName + requestBody.lastName, // Username is generated from names
					  credentials: [{
						  type: "password",
						  value: requestBody.password
					  }]
					},
					json: true,
				  };

				  // Initiate request to create account in RHSSO using login tokens
				  request(accountOptions, function (error, response, body) {
					if (error) { 
						console.log(err) 
					} else if (response.statusCode != 201) {
						console.log("HTTP error:", response.statusCode, "while trying to create account")
					} else {
						res.send({status: "user created successfully"})
						console.log("User created in Keycloak")
					}
				  });				  
			} else {
				res.status(response.statusCode).send(body) // In unable to login as client
			}
		}
	  });
})

function getLoginTokens(username, password, callback) {
	let options = {
		url: APP_ID_TOKEN_URL + "/token",
		method: 'POST',
		headers: {
			'Authorization': 'Basic ' + new Buffer(APP_ID_CLIENT_ID + ":" + APP_ID_CLIENT_SECRET).toString('base64'),
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		form: {
			username,
			password,
			grant_type: 'password',
			scope: 'openid' // Required for Keycloak to provide the id_token
		}
	}

	request(options, function (err, response, body) {
		callback(err, response, body)
	})
}


module.exports = router
