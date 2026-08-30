# config/

Placeholder for database configuration.

Upcoming: a `db.js` here will hold the MongoDB connection setup
(likely via `mongoose.connect(process.env.MONGODB_URI)`), read
from environment variables so credentials never get committed.
