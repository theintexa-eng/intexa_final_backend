const express = require('express');
const cors = require('cors');

const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const allowedOrigins = new Set([
	'https://www.intexa.in',
	'https://intexa.in'
]);

function normalizeOrigin(origin) {
	return typeof origin === 'string' ? origin.replace(/\/$/, '') : origin;
}

const corsOptions = {
	origin(origin, callback) {
		const normalizedOrigin = normalizeOrigin(origin);

		if (!normalizedOrigin || allowedOrigins.has(normalizedOrigin)) {
			return callback(null, true);
		}

		return callback(new Error('CORS policy does not allow access from this origin.'));
	},
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	credentials: true,
	optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

app.use('/api', apiRoutes);

app.use(errorHandler);

module.exports = app;