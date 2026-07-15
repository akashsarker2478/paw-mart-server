
require("dotenv").config()
const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const cors = require('cors');
const port =process.env.PORT||4000


//middleware
app.use(cors())
app.use(express.json())

const uri = process.env.DB_URI;
console.log("Connecting to the new MongoDB Cluster...")
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
    //await client.connect();
    const db = client.db('paw_db')
    const listingsCollection = db.collection('product')
    const ordersCollection = db.collection('orders')
    const userCollection = db.collection('user')

    //user
    app.post('/user',async(req,res)=>{
      const newUser = req.body;
      const email = req.body.email;
      const query ={email:email}
      const existingUser = await userCollection.findOne(query)
      if(existingUser){
        res.send('user already exists do not need to insert again')
      }
      else{
        const result = await userCollection.insertOne(newUser)
        res.send(result)
      }
    })
    //post api
    app.post('/product',async(req,res)=>{
        const newProduct = req.body;
        const result = await listingsCollection.insertOne(newProduct)
        res.send(result)
    })

// All products with pagination + category filter
app.get('/product', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 9;
  const category = req.query.category; 
  const skip = (page - 1) * limit;

  
  let query = {};
  if (category) {
    query.category = { $regex: category, $options: "i" };
  }

  try {

    const total = await listingsCollection.countDocuments(query);
    const products = await listingsCollection
      .find(query)  
      .skip(skip)
      .limit(limit)
      .toArray();

    res.send({
      products,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send({ error: "Failed to fetch products" });
  }
});

// My Listings 
app.get('/my-products', async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).send({ error: "Email is required" });
  }

  try {
    const products = await listingsCollection.find({ email }).toArray();
    res.send(products);
  } catch (error) {
    res.status(500).send({ error: "Failed to fetch my products" });
  }
});
    //update Product

    app.patch('/product/:id',async(req,res)=>{
      const id = req.params.id;
       const query = {_id: new ObjectId(id)}
       const updateProduct = req.body;
       const update ={
        $set:{
          name:updateProduct.name,
          category:updateProduct.category,
          price:updateProduct.price,
          location:updateProduct.location,
          description:updateProduct.description,
          image:updateProduct.image,
          date:updateProduct.date
        }
       }
        const result = await listingsCollection.updateOne(query,update)
        res.send(result)
    })


    //delete product
    app.delete('/product/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await listingsCollection.deleteOne(query)
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

    // Dashboard Stats API 
app.get('/api/dashboard-stats', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).send({ error: "Email is required" });
    }

    
    const userListings = await listingsCollection.find({ email }).toArray();

   
    const userOrders = await ordersCollection.find({ email }).toArray();

    // stats calculate
    const totalListings = userListings.length;
    const totalOrders = userOrders.length;
    const pendingOrders = userOrders.filter(order => order.status !== 'completed').length; 
    const adoptedPets = userOrders.filter(order => order.category === 'Pets' || order.price === 0).length;

    
    const categoryMap = {};
    userListings.forEach(listing => {
      const cat = listing.category || "Others";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    const categoryBreakdown = Object.keys(categoryMap).map(name => ({
      name,
      value: categoryMap[name]
    }));

    
    const recentOrders = userOrders
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map(order => ({
        _id: order._id,
        productName: order.productName || order.productListingName,
        buyerName: order.buyerName,
        price: order.price,
        date: order.date,
        status: order.status || 'pending'
      }));

    res.send({
      totalListings,
      totalOrders,
      pendingOrders,
      adoptedPets,
      categoryBreakdown,
      recentOrders
    });

  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).send({ error: "Failed to fetch dashboard stats" });
  }
});

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



    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
   
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`paw mart server is running on port ${port}`)
})