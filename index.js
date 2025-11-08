const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const cors = require('cors');
const port =process.env.PORT||3000


//middleware
app.use(cors())
app.use(express.json())

const uri = "mongodb+srv://pawDB:sJ09bF4AIhx80mHi@cluster0.yh13yvx.mongodb.net/?appName=Cluster0";

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