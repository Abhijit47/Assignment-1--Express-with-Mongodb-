/**
 * Write API for Registration adn Login page of the application.
1.create a registration 
name
email 
age
password:


2.create a sigin and verify that if user is there database login to website

3.create an enpoint to display
name,email and age but not password.
 */
import dotenv from "dotenv";
dotenv.config();
import express from 'express';
import cors from 'express';
import { MongoClient } from "mongodb";

// Initiate app with express top level function.
const app = express();
const PORT = process.env.PORT || 9999;
const MONGO_URL = process.env.DATABASE_URI;
const MONGO_PASSWORD = process.env.DATABASE_PASSWORD;

// parse the request to JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Implement cors
app.use(cors());

// Create a DB Connection with MongoClient
const createConnection = async () => {
  try {
    // create a new client instance with MongoClient
    const client = new MongoClient(MONGO_URL.replace("<password>", MONGO_PASSWORD));

    // Connect the client to the server
    await client.connect();

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // 3. print a message
    console.log("Connection Successful ✔");
    return client;

  } catch (err) {
    console.log(err.message);
  }
};
// calling the createConnection function to connect with DB
const client = await createConnection();

// Default route
app.get('/', (req, res) => {
  res.status(200).json({ "message": "Welcome to Login-Registration API." });
});

// Create a registration route
app.post('/api/v1/signup', async (req, res) => {
  // 1. retrive tha data from req.body
  const reqData = req.body;
  const { email } = req.body;

  // 2. check if user is exist or not
  const existingUser = await client
    .db('authentication')
    .collection('auth')
    .findOne(
      { "email": email },
      { projection: { _id: 0, "age": 0, "password": 0 } }
    );

  if (existingUser) {
    return res.status(400).json(
      { "message": "User is already exist. Try to login.", data: existingUser }
    );
  }

  // 3. create a user
  const user = await client
    .db('authentication')
    .collection('auth')
    .insertOne(reqData);

  // 4. send a response to the user
  if (user.acknowledged) {
    return res.status(201).json({ user: user.insertedId });
  } else {
    return res.status(400).json({ "message": "Something went wrong.Please try again." });
  }
});

// create a login router
app.post('/api/v1/signin', async (req, res) => {
  // 1. retrive the data from req.body
  const { email, password } = req.body;

  // 2. check the user have valid credentials or not
  const existingUser = await client
    .db('authentication')
    .collection('auth')
    .findOne(
      { "email": email, "password": password },
      { projection: { _id: 1, "age": 0, "password": 0 } }
    );

  if (existingUser === null || undefined) {
    return res.status(400).json({ "message": "Email or password is not valid!!!" });
  } else {

    // 3. login the user
    const { _id: id } = existingUser;
    const loginUser = await client
      .db('authentication')
      .collection('auth')
      .findOneAndUpdate(
        { _id: id },
        { $set: { "loginStatus": true } },
        { projection: { _id: 0, "password": 0 } },
        { returnNewDocument: true }
      );

    // 4. send a respone to the user
    if (loginUser) {
      res.status(200).json({ user: loginUser.value });
    } else {
      res.status(400).json({ "message": "Something went wrong!!!" });
    }
  }
});

// get user info/details
app.get('/api/v1/users', async (req, res) => {

  // get the user details from the database
  const users = await client
    .db('authentication')
    .collection('auth')
    .find({}, { projection: { _id: 0, "password": 0 } })
    .toArray();

  // send back to the user
  if (users) {
    res.status(200).json({ "message": "Success", users: users });
  } else {
    res.status(400).json({ "message": "Something went wrong. Please try again" });
  }

});

// Wildcard route
app.all("*", (req, res) => {
  res.status(404).json(`Cannot ${req.method} on this ${req.originalUrl} URL.`);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});