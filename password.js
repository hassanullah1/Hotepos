// gen-hash.mjs
import bcrypt from "bcryptjs";

const password = "MyNewPassword123!";
const rounds = 12;

const hash = await bcrypt.hash(password, rounds);
console.log(hash);
// → $2b$12$Xy8... (60 chars)
