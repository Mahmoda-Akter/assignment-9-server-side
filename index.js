const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express')
const dontenv = require('dotenv')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
dontenv.config()
const uri = process.env.MONGO_URI
const app = express()



const PORT = process.env.PORT
app.use(cors())
app.use(express.json())

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)

const varyfitoken = async(req, res, next) => {
  const authheader = req?.headers.authorization

  if (!authheader) {
    return res.status(401).json({ message: "Unauthorize" })
  }
  const token = authheader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Unauthorize" })
  }

  try {
    const { payload } = await jwtVerify(token, JWKS)
    console.log(payload)
    next()
  }catch(error){
    console.log(error)
    return res.status(403).json({ message: "Forbidden" })
  }

 

      
  
}


async function run() {
  try {

    // await client.connect();

    const db = client.db("Docappoinment")
    const doctorcollection = db.collection("Doctors")
    const bookingcollection = db.collection("Bookingsystem")


    app.get('/feauterd', async (req, res) => {
      const result = await doctorcollection.find().sort({rating: -1}).limit(3).toArray()
      res.json(result)
    })

    app.get('/appoinment', async (req, res) => {
      const result = await doctorcollection.find().sort({rating: -1}).toArray()
      res.json(result)
    })

    app.post('/appoinment', async (req, res) => {
      const appoinmentdata = req.body
      console.log(appoinmentdata)
      const result = await doctorcollection.insertOne(appoinmentdata)

      res.json(result)
    })



    app.get('/appoinment/:id', varyfitoken, async (req, res) => {
      const { id } = req.params

      const result = await doctorcollection.findOne({ _id: new ObjectId(id) })
      res.json(result)
    })

    app.patch('/appoinment/:id', async (req, res) => {
      const { id } = req.params
      const updatedata = req.body

      const result = await doctorcollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedata }
      )
      res.json(result)
    })

    app.delete('/appoinment/:id', async (req, res) => {
      const { id } = req.params

      const result = await doctorcollection.deleteOne({ _id: new ObjectId(id) })
      res.json(result)
    })

    // Bookingsystem database 

    app.get('/booking/:userid', varyfitoken, async (req, res) => {
      const { userid } = req.params

      const result = await bookingcollection.find({ userid: userid }).toArray()
      res.json(result)
    })

    app.post('/booking', varyfitoken,  async (req, res) => {
      const bookingdata = req.body
      // console.log(appoinmentdata)
      const result = await bookingcollection.insertOne(bookingdata)

      res.json(result)
    })

    app.patch('/booking/:id', varyfitoken, async (req, res) => {
      const { id } = req.params
      const updatedata = req.body

      const result = await bookingcollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedata }
      )
      res.json(result)
    })

    app.delete('/booking/:bookingid', varyfitoken, async (req, res) => {
      const { bookingid } = req.params

      const result = await bookingcollection.deleteOne({ _id: new ObjectId(bookingid) })
      res.json(result)
    })





    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
})


app.listen(PORT, () => {
  console.log(`Server is running on this port ${PORT}`)
})