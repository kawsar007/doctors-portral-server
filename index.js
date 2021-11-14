const express = require('express')
const app = express()
const cors = require('cors');
const { MongoClient } = require('mongodb');
const port = process.env.port || 5000;
require('dotenv').config()

// Middelwere
app.use(cors());
app.use(express.json());

// Connect Database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gjlbc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run(){
   try {
    await client.connect();
    const database = client.db('doctors_portal');
    const appoinmentsCollections = database.collection('appoinments');
    const usersCollections = database.collection('users');

    app.get('/appoinments', async(req, res) => {
      const email = req.query.email;
      const date = new Date(req.query.date).toLocaleDateString();
      console.log(date);
      const query = {email: email, date: date};
      console.log(query);
      const cursor = appoinmentsCollections.find(query);
      const appoinments = await cursor.toArray();
      res.json(appoinments);
    })

    app.post('/appoinments', async (req, res) => {
       const appoinment = req.body;
       const result = await appoinmentsCollections.insertOne(appoinment);
       console.log(result);
       res.json(result);
    })

    app.post('/users', async (req, res) =>{
      const user = req.body;
      const result = await usersCollections.insertOne(user);
      console.log(result);
      res.json(result);
    });

    app.put('/users', async (req, res) =>{
      const user = req.body;
      console.log('PUT', user);
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollections.updateOne(filter, updateDoc, options);
      res.json(result);
    })
   }
   finally {
    // client.close(); 
   }
}

run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello Doctors Portral!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})