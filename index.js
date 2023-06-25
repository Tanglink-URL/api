const dotenv = require('dotenv');
dotenv.config();

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://" + process.env.MONGOUSERNAME + ":" + process.env.MONGOPASSWORD + "@tanglink.pqrecr6.mongodb.net/?retryWrites=true&w=majority";
const mongoose = require('mongoose')

const app = require('express')()

const PORT = process.env.PORT || 8080



app.get('/ping', (req, res) =>{

    const apiKey = req.query.apiKey

    res.send({data: 'pong'})
})



app.listen(PORT, () => console.log(`Live on port ${PORT}`))
connectMongo()


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectMongo(){
    try{
        await mongoose.connect(uri)
        console.log("Connected to MongoDB")
    }catch(e){
        console.error(e)
    }
}

// async function run() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();
//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   }catch(e){
//     console.log(e)
//   } finally {
//     // Ensures that the client will close when you finish/error
//     await client.close();
//   }
// }
// run().catch(console.dir);



