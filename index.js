const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const cors = require('cors');
require("dotenv").config()
const port =process.env.PORT||3000


//middleware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.yh13yvx.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.get('/', (req, res) => {
  res.send('paw mart is running...')
})

//mongodb

async function run() {
  try {
    await client.connect();
    const db = client.db('paw_db')
    const listingsCollection = db.collection('product')
    const ordersCollection = db.collection('orders')
    //post api
    app.post('/product',async(req,res)=>{
        const newProduct = req.body;
        const result = await listingsCollection.insertOne(newProduct)
        res.send(result)
    })

    //my product
    app.get('/product',async(req,res)=>{
      const email = req.query.email;
      let query = {}
      if (email){
        query = {email:email}
      }
      const cursor = listingsCollection.find(query);
      const result = await cursor.toArray()
      res.send(result)
    })

    //get api
    app.get('/product',async(req,res)=>{
        const cursor = listingsCollection.find()
        const result = await cursor.toArray()
        res.send(result)
    })

    //single listing
    app.get('/product/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id:new ObjectId(id)}
      const result = await listingsCollection.findOne(query)
      res.send(result)
    })

    //latest listing
    app.get('/latest-product',async(req,res)=>{
      const cursor = listingsCollection.find().sort({date:-1}).limit(6)
      const result = await cursor.toArray()
      res.send(result)
    })

    //search listing
    app.get('/search',async(req,res)=>{
      const search_text = req.query.search;
      const result = await listingsCollection.find({name:{$regex:search_text,$options:'i'}}).toArray()
      res.send(result)
    })

    //orders related apis here
    app.post('/orders',async(req,res)=>{
      const newOrders = req.body;
      const result = await ordersCollection.insertOne(newOrders)
      res.send(result)
    })

    //myOrder
    app.get('/orders',async(req,res)=>{
      const email = req.query.email;
      let query = {}
      if(email){
        query = {email:email}
      }
      const cursor = ordersCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })



    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
   
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`paw mart server is running on port ${port}`)
})