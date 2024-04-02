const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;




// middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.NAME}:${process.env.PASS}@cluster0.ennn1mj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersCollection = client.db("ResturantDB").collection("users")
    const menuCollection = client.db("ResturantDB").collection("menu")
    const reviewsCollction = client.db("ResturantDB").collection("reviews")
    const cartsCollction = client.db("ResturantDB").collection("carts")



    // APIs

    //User APIs

    //get user

    app.get('/users', async(req,res)=>{

      const result = await usersCollection.find().toArray()
      res.send(result)
    })

    //post user

    app.post('/users', async(req,res)=>{
      const user = req.body;
      const query = {email: user.email}
      const existUser = await usersCollection.findOne(query)
      if(existUser){
        return res.send({message: "user already exist"})
      }
      const result = await usersCollection.insertOne(user)
      res.send(result)
    })

    //delete user



    app.delete('/users/:id', async (req,res)=>{

      const id = req.params.id
      const query = {_id: new ObjectId(id)}

      const result = await usersCollection.deleteOne(query)
      res.send(result)
    })
    
    //update user as admin

    app.patch('/users/admin/:id', async(req,res)=>{
      const id = req.params.id
      const query = {_id: new ObjectId(id)}

      const updatedDoc = {
        $set: {
          role: "admin"
        }
      }
      const result = await usersCollection.updateOne(query,updatedDoc)
      res.send(result)

    })




    // menu APIS

    //get menu
    app.get("/menu", async(req,res)=>{
        const menu = await menuCollection.find().toArray();
        res.send(menu)
    })



    //review APIs

    // get reviews

    app.get('/reviews', async(req,res)=>{
        const reviews = await reviewsCollction.find().toArray()
        res.send(reviews)
    })



    // Cart APIs

    //get carts
    app.get('/carts', async(req, res)=>{

      const email = req.query.email;
      const query = {email: email}
      const result = await cartsCollction.find(query).toArray()
      res.send(result)
    })

    //post carts
    app.post('/carts', async(req,res)=>{

      const cartItem = req.body;
      const result = await cartsCollction.insertOne(cartItem);
      res.send(result)

    })

    //delete Cart

    app.delete('/carts/:id', async (req,res)=>{

      const id = req.params.id
      const query = {_id: new ObjectId(id)}

      const result = await cartsCollction.deleteOne(query)
      res.send(result)
    })






    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Resturant server is running')
})

app.listen(port, () => {
    console.log(`Resturant Server is running on port: ${port}`)
})