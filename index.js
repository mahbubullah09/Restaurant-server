const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
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
    const paymentCollection = client.db("ResturantDB").collection("payments")



    // APIs

    //jwt APIs

    // jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.S_Token, { expiresIn: '1h' });
      res.send({ token });
    })





    // middlwere

    const verifyToken = (req, res, next) => {

      console.log("indide verify token: ", req.headers.authorization);

      if (!req.headers.authorization) {
        return res.status(401).send({ message: "forbidden Access" })
      }

      const token = req.headers.authorization.split(' ')[1]
      console.log("token: ", token);

      jwt.verify(token, process.env.S_Token, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "forbidden access" })
        }
        req.decoded = decoded
        next()
      })

    }


    // use verify admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }
    //User APIs
    //get user

    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {

      const result = await usersCollection.find().toArray()
      res.send(result)
    })

    //admin api
    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })
    //post user

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existUser = await usersCollection.findOne(query)
      if (existUser) {
        return res.send({ message: "user already exist" })
      }
      const result = await usersCollection.insertOne(user)
      res.send(result)
    })

    //delete user



    app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {

      const id = req.params.id
      const query = { _id: new ObjectId(id) }

      const result = await usersCollection.deleteOne(query)
      res.send(result)
    })

    //update user as admin

    app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id
      console.log(id);
      const query = { _id: new ObjectId(id) }

      const updatedDoc = {
        $set: {
          role: "admin"
        }
      }
      const result = await usersCollection.updateOne(query, updatedDoc)
      res.send(result)

    })






    // menu APIS

    //get menu
    app.get("/menu", async (req, res) => {
      const menu = await menuCollection.find().toArray();
      res.send(menu)
    })
    app.get('/menu/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await menuCollection.findOne(query);
      res.send(result);
    })

    app.post('/menu', verifyToken, verifyAdmin, async (req, res) => {

      const menu = req.body;
      const result = await menuCollection.insertOne(menu);
      res.send(result)

    })

    app.delete('/menu/:id', verifyToken, async (req, res) => {

      const id = req.params.id
      const query = { _id: new ObjectId(id) }

      const result = await menuCollection.deleteOne(query)
      res.send(result)
    })

    app.patch('/menu/:id', verifyToken, verifyAdmin, async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          name: item.name,
          category: item.category,
          price: item.price,
          recipe: item.recipe,
          image: item.image
        }
      }

      const result = await menuCollection.updateOne(filter, updatedDoc)
      res.send(result);
    })






    //review APIs

    // get reviews

    app.get('/reviews', async (req, res) => {
      const reviews = await reviewsCollction.find().toArray()
      res.send(reviews)
    })

    // post review 

// Post review - Add a new review
app.post('/reviews', verifyToken, async (req, res) => {
  const { name, email, phone, details, rating } = req.body;

  // Basic validation
  if (!name || !email || !phone || !details || !rating) {
    return res.status(400).send({ message: 'All fields are required' });
  }

  const newReview = {
    name,
    email,
    phone,
    details,
    rating: parseInt(rating),  
    
  };

  const result = await reviewsCollction.insertOne(newReview);
  res.status(201).send({ message: 'Review added successfully', reviewId: result.insertedId });
});



    // Cart APIs

    //get carts
    app.get('/carts', verifyToken, async (req, res) => {

      const email = req.query.email;
      const query = { email: email }
      const result = await cartsCollction.find(query).toArray()
      res.send(result)
    })

    //post carts
    app.post('/carts', verifyToken, async (req, res) => {

      const cartItem = req.body;
      const result = await cartsCollction.insertOne(cartItem);
      res.send(result)

    })

    //delete Cart

    app.delete('/carts/:id', verifyToken, async (req, res) => {

      const id = req.params.id
      const query = { _id: new ObjectId(id) }

      const result = await cartsCollction.deleteOne(query)
      res.send(result)
    })


    //delete all cart by email


    app.delete('/carts', verifyToken, async (req, res) => {
      const userEmail = req.query.email; 
      const query = { userEmail: userEmail };
    
      const result = await cartsCollction.deleteMany(query);
      res.send(result);
    });





    //payments

    app.post('/payments', async (req, res) => {
      console.log("Received payment request:", req.body); // Add this line
      const payment = req.body;
      const result = await paymentCollection.insertOne(payment);
      res.send(result);
  });

  // Get payment history by user email
app.get('/payments/:email',verifyToken, async (req, res) => {
  const userEmail = req.params.email;
  try {
      const payments = await paymentCollection.find({ email: userEmail }).toArray();
      res.send(payments);
  } catch (error) {
      console.error("Error fetching payment history:", error);
      res.status(500).send({ message: "Failed to fetch payment history" });
  }
});




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