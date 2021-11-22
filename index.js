const express = require('express')
const app = express()
const cors = require('cors');
const { MongoClient } = require('mongodb');
const admin = require("firebase-admin");
const port = process.env.port || 5000;
require('dotenv').config()

// doctor-portal-firebase-adminsdk.json
const serviceAccount = require('./doctor-portal-firebase-adminsdk.json');
// const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Middelwere
app.use(cors());
app.use(express.json());

// Connect Database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gjlbc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
  if(req.headers?.authorization?.startsWith('Bearer ')) {
    const token = req.headers.authorization.split(' ')[1];

    try{
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email;
    }
    catch{

    }
  }
   next();
}

async function run(){
   try {
    await client.connect();
    const database = client.db('doctors_portal');
    const appoinmentsCollections = database.collection('appoinments');
    const usersCollections = database.collection('users');

    app.get('/appoinments', verifyToken, async(req, res) => {
      const email = req.query.email;
      const date = req.query.date;
      const query = {email: email, date: date};
      console.log(date);
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

    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollections.findOne(query);
      let isAdmin = false;
      if(user?.role === 'admin') {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    })

    app.post('/users', async (req, res) =>{
      const user = req.body;
      const result = await usersCollections.insertOne(user);
      console.log(result);
      res.json(result);
    });

    app.put('/users', async (req, res) =>{
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollections.updateOne(filter, updateDoc, options);
      res.json(result);
    });

    app.put('/users/admin', verifyToken, async (req, res) =>{
      const user = req.body;
      const requester = req.decodedEmail;
      if(requester) {
        const requisterAccount = await usersCollections.findOne({email: requisterAccount.email});
        if(requisterAccount.role === 'admin') {
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollections.updateOne(filter, updateDoc);
            res.json(result);
        }
      }else{
        res.status(403).json({message: 'You do not have access to make admin.'})
      }

     
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