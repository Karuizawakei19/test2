

const admin = require('../firebase');

const verifyToken = async (req, res, next) => {


  // Authorization: Bearer eyJhbGci...
  const authHeader = req.headers.authorization;

  //  reject immediately if no token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not logged in. Please log in first.' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // token verification
    const decodedToken = await admin.auth().verifyIdToken(token);



    req.user = decodedToken;

    
    next();

  } catch (error) {
    // Token is fake or expired
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
};

module.exports = verifyToken;