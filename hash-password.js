// hash-password.js
const bcrypt = require("bcryptjs");

const plainPassword = "hassan";
const hashedPassword = bcrypt.hashSync(plainPassword, 10);

console.log("Plain password:", plainPassword);
console.log("Hashed password:", hashedPassword);
