const User = require("../models/User.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const refreshToken = async (refreshToken) => {
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id);

  if (!user || !user.refreshTokens.some((t) => t.token === refreshToken)) {
    throw new Error("Refresh token geçersiz");
  }
  user.refreshTokens = user.refreshTokens.filter(
    (t) => t.token !== refreshToken
  );
  await user.save();
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(
    user._id
  );
  await saveRefreshToken(user._id, newRefreshToken);
  return { token: accessToken, refreshToken: newRefreshToken };
};

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
};

const saveRefreshToken = async (userId, refreshToken) => {
  const user = await User.findById(userId);
  user.refreshTokens.push({ token: refreshToken });
  await user.save();
};

const register = async ({ username, email, password }) => {
  email = email.toLowerCase();
  username = username.toLowerCase();
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existingUser) {
    throw new Error(
      "Bu istifadəçi adı və ya e-mail ünvanı artıq sistemdə mövcuddur."
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, email, password: hashedPassword });
  await user.save();
  return user;
};

const login = async ({ username, password }) => {
  const user = await User.findOne({ username: username });
  if (!user) throw new Error("İstifadəçi adı və ya şifrə yanlışdır");

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error("İstifadəçi adı və ya şifrə yanlışdır");

  const { accessToken, refreshToken } = generateTokens(user._id);
  await saveRefreshToken(user._id, refreshToken);

  return { token: accessToken, refreshToken };
};

module.exports = {
  register,
  login,
  refreshToken,
};
