const express = require('express')
const router = express.Router()
const request = require('request')
// use .env file
const dotenv = require('dotenv');
dotenv.config();
// random name generator
const random_name = require('node-random-name');

 const APP_ID_CLIENT_ID = process.env.APP_ID_CLIENT_ID
 const APP_ID_CLIENT_SECRET = process.env.APP_ID_CLIENT_SECRET
 const APP_ID_TOKEN_URL = process.env.APP_ID_TOKEN_URL

// Will likely need these to both be new secrets
const RHSSO_BASE_URL = APP_ID_TOKEN_URL.split("/auth/")[0]
const BANK_REALM = "banksso"

router.get('/random_user', function (req, res) {
	console.log("/random_user")
	res.send(random_name())
})

router.post('/login', function (req, res) {
	console.log("/login")
	getAppIdToken(req.body.username, req.body.password, (err, response, body) => {
		if (err) {
			console.log(err)
			console.log(response)
			console.log(body)
			res.send(err)
		} else {
			let jsonBody = JSON.parse(body)
			if (jsonBody.error) {
				console.log(jsonBody)
				res.status('404').send(body)
			} else {
				if (response.statusCode == 200) {
					let expiry = jsonBody.expires_in || 1
					let cookieOptions = {
						maxAge: expiry * 1000
					}
					res.cookie('access_token', jsonBody.access_token, cookieOptions)
					res.cookie('id_token', jsonBody.id_token, cookieOptions)
					res.send(body)
				} else {
					res.status(response.statusCode).send(body)
				}
			}
		}
	})
})

router.post('/create_account', function (req, res) {
	console.log("/create_account")
	let requestBody = req.body

	const options = {
		method: 'POST',
		url: RHSSO_BASE_URL + '/auth/realms/' + BANK_REALM + '/protocol/openid-connect/token',
		headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		form: {
		  grant_type: 'client_credentials',
		  client_id: APP_ID_CLIENT_ID,
		  client_secret: APP_ID_CLIENT_SECRET
		},
	  };
	  
	  request(options, function (error, response, body) {
		if (error) throw new Error(error)
		let jsonBody = JSON.parse(body)
		if (jsonBody.error) {
			console.log(jsonBody)
			res.status('404').send(body)
		} else {
			if (response.statusCode == 200) {
				let token = jsonBody.access_token
				const accountOptions = {
					method: 'POST',
					url: RHSSO_BASE_URL + '/auth/admin/realms/' + BANK_REALM + '/users',
					headers: {
					  'Content-Type': 'application/json',
					  Authorization: 'Bearer ' + token
					},
					body: {
					  firstName: requestBody.firstName,
					  lastName: requestBody.lastName,
					  email: requestBody.email,
					  enabled: 'true',
					  username: requestBody.firstName + requestBody.lastName,
					  credentials: [{
						  type: "password",
						  value: requestBody.password
					  }]
					},
					json: true,
				  };
				  console.log(">>>> ", accountOptions)
				  request(accountOptions, function (error, response, body) {
					if (error) console.log(err)
					if (response.statusCode != 201) console.log(response.statusCode)
					res.send({status: "user created successfully"})
					console.log("User created in Keycloak")
				  });				  
			} else {
				res.status(response.statusCode).send(body)
			}
		}
	  });
})

router.get("/get_all_users", function (req, res) {
	console.log("/get_all_users")
	res.send(["alice"])
});

function getAppIdToken(username, password, callback) {
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
			scope: 'openid'
		}
	}

	request(options, function (err, response, body) {
		callback(err, response, body)
	})
}


module.exports = router
