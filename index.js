const dotenv = require('dotenv');
dotenv.config();

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://" + process.env.MONGOUSERNAME + ":" + process.env.MONGOPASSWORD + "@tanglink.pqrecr6.mongodb.net/?retryWrites=true&w=majority";
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const redis = require('redis')

const redisClient = redis.createClient({
    url: process.env.REDIS_URL
})

const express = require('express')
const app = express()

const cors = require('cors')

const PORT = process.env.PORT || 8080

app.use(express.json())

app.use(cors())

app.get('/ping', (req, res) =>{
    res.send({data: 'pong'})
})

// to create a new URL send a POST request to /create with two query params:
// shortURL is the new shortURL
// longURL is the originalURL
// when someone sends a GET request to a shortURL they'll be redirected to the longURL related to that shortURL
app.post('/create', (req, res) =>{
    let shortURL = req.query.shortURL
    let longURL = req.query.longURL

    const newDoc = new linkModel({_id: shortURL, longURL: longURL, clickCount: 0})

    linkModel.find({_id: shortURL}).then((data) =>{
        if(data.length == 0){
            try{
                newDoc.save().then((newDoc) => {
                    res.status(201).send('SAVED!')
                    })
                }catch(e){
                    res.status(400).send(e)
            }
        }else{
            res.status(400).send('Short URL is already taken, please choose another name.')
        }
    })
})

// to acess a shortURL
app.get('/:shortURL', async (req, res) => {
    let shortURL = req.params.shortURL

    let result = await redisGet('Tanglink', shortURL)

    let longURL

    if(result == null){
        linkModel.find({_id: shortURL}).then( async (data) =>{
            if(data.length == 0){
                res.status(400).send('URL does not exist')
            }

            res.redirect(data[0].longURL)

            longURL = data[0].longURL

            await redisSet('Tanglink', shortURL, longURL)
            
        })
    }else{
        res.redirect(result)
    }

})


app.listen(PORT, () => console.log(`Live on port ${PORT}`))
connectMongo()
redisClient.connect()


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

const linkSchema = new Schema({
    _id: {type: String, required: true}, //this is the short URL
    longURL: {type: String, required: true},
    clickCount: {type: Number, required: false},
    creationDate: { type: Date, default: Date.now, required: true },
})

const linkModel =  mongoose.model('Link', linkSchema)



//set a value in redis
async function redisSet(key, field, value){

    let result = await redisClient.hSet(key, field, value)

    return result
}

//get a value in redis
async function redisGet(key, field){

    let result = await redisClient.hGet(key, field)

    return result
}



