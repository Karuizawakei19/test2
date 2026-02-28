

const admin = require('../firebase');

const verifyToken = async (req, res, next) => {

  // sends the token like this in every request:
  // Authorization: Bearer eyJhbGci...
  const authHeader = req.headers.authorization;

  //  reject immediately if no token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not logged in. Please log in first.' });
  }

  // Cut off the "Bearer " part
  const token = authHeader.split('Bearer ')[1];

  try {
    // token verification
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach the user info to req so the next function can use it

    req.user = decodedToken;

    
    next();

  } catch (error) {
    // Token is fake or expired
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
};

module.exports = verifyToken;