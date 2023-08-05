const express = require('express');
const cors = require('cors');
// jwt
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

// middleware 
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2a9l2qr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// jwt verify start 
const verifyJwt = (req, res, next)=>{
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({error: true, message: 'unauthorized access'})
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    if (err) {
      return res.status(403).send({error: true, message: 'unauthorized access'})
    }
    req.decoded = decoded;
    next();
  })
}
// jwt verify end

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // server link start
    const serverCollection = client.db('carDoctor').collection('allCar');
    const bookingCollection = client.db('carDoctor').collection('carBooking');
    // server link end 


    // jwt localhost start
      app.post('/jwt', (req, res)=>{
        const user = req.body;
        console.log(user);
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn:'2h'});
        res.send({token});
      })
    // jwt localhost end


    app.get('/server', async(req, res)=>{
      const cursor = serverCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/server/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await serverCollection.findOne(query)
      res.send(result)
    })


    // // bookings data server start
    // app.get('/bookings', async(req, res)=>{
    //   let query = {};
    //   if (req.query?.email) {
    //     query = {email: req.query.email}
    //   }
    //   const result = await bookingCollection.find(query).toArray();
    //   res.send(result);
    // })

    // jwt add bookings parts start 
    app.get('/bookings', verifyJwt, async(req, res)=>{
      const decoded= req.decoded;
      if (decoded.email !== req.query.email) {
        return res.status(403).send({error: 1, message: 'forbidden access'})
      }


      let query = {};
      if (req.query?.email) {
        query = {email: req.query.email}
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    })
    // jwt add bookings parts end 
    
    app.post('/bookings', async(req, res) => {
      const newBooking = req.body;
      const result = await bookingCollection.insertOne(newBooking)
      res.send(result);
    });

    app.patch('/bookings/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updatedBooking = req.body;
      console.log(updatedBooking);
      const updateDoc ={
        $set:{
          status: updatedBooking.status
        },
      };
      const result = await bookingCollection.updateOne(filter, updateDoc)
      res.send(result);
    })

    app.delete('/bookings/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    })
    // bookings data server end

    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
     res.send('Car Doctor server running')
})

app.listen(port, ()=>{
     console.log(`server is running on port: ${port}`);
})


module.exports = app;
