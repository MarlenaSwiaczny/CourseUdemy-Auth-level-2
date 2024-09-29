import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import env from "dotenv";

const app = express();
const port = 3000;
env.config();

//ustalamy ilość szyfrowań z "solą" w bcrypt
const saltRounds = 10;

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      res.send("Email already exists. Try logging in.");
    } else {
      // szyfrowanie:
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.log("Password hashing error: ", err);
        } else {
        const result = await db.query(
          "INSERT INTO users (email, password) VALUES ($1, $2)",
          [email, hash]
        );
        // ------- 
        console.log(result);
        res.render("secrets.ejs");
      }
      })
      
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", async (req, res) => {
  const email = req.body.username;
  const inputPassword = req.body.password;

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedHashedPassword = user.password;
      // porównywanie z przechowywanym w db hashem:
      bcrypt.compare(inputPassword, storedHashedPassword, async (err, isCorrect) => {
        if (err) {
          console.log("Comparing passwords error: ", err)
        } else {
          if (isCorrect){
            res.render("secrets.ejs");
          } else {
            res.send("Incorrect Password");
          };
        }
      });
      
    } else {
      res.send("User not found");
    }
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});