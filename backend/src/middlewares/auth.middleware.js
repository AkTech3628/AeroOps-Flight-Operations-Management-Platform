const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Token Missing"
    });
  }

  const token = authHeader.split(" ")[1];

try {

  req.user = jwt.verify(
    token,
    process.env.JWT_SECRET
  );

  next();

} catch (err) {
  console.log(err);
  return res.status(401).json({
    error: "Invalid Token"
  });
}
};