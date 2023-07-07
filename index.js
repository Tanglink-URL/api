// setup for using .env files (process.env.SOMETHING)
const dotenv = require('dotenv');
dotenv.config();

// setup for using mongoDB
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://" + process.env.MONGOUSERNAME + ":" + process.env.MONGOPASSWORD + "@tanglink.pqrecr6.mongodb.net/?retryWrites=true&w=majority";

// setup for using mongoose, a library that makes communicating with a mongoDB database easier
const mongoose = require('mongoose')
const Schema = mongoose.Schema

// setup for using redis
const redis = require('redis')
const redisClient = redis.createClient({
    url: process.env.REDIS_URL
})

// setup for using express, a JS library to make creating API's and other HTTP networks easier
const express = require('express')
const app = express()

// setup for using a library called CORS, it makes easier to configure CORS in expressJS
const cors = require('cors')

// this is the port the API will use, if a .env file with a PORT variable doesnt exist, the port will be set to 8080 
const PORT = process.env.PORT || 8080

// i dont really know what this does but it makes mongoDB work --@CodyKoInABox
app.use(express.json())

// this configs CORS to be acessible by everyone (CORS: *)
app.use(cors())

// a ping endpoint that returns pong
app.get('/ping', (req, res) =>{
    res.send({data: 'pong'})
})


// endpoint to create new short url's
// it takes two params:
// shortURL = this is the string of the short url | Example: tang
// longURL = this is the original url | Example: https://github.com/Tanglink-URL
// this will create a new item in the mongoDB database
// the item contains the shortURL (called _id), the longURL, a viewCount (that is not working yet) and a creationDate (that is also useless as of right now)
// when someone sends a GET request to /tang they will be redirected to https://github.com/Tanglink-URL
// this endpoint also handles errors like trying to use a shortURL that is already taken
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
            res.status(403).send('Short URL is already taken, please choose another name.')
        }
    })
})

// endpoint to acess short url's
// example: when someone sends a GET request to /tang
// it will look through the database to find and _id == "tang"
// if it does, it will redirect the user to the longURL related to that shortURL(_id)
// it alsos handles caching with REDIS
// before looking at the mongoDB, it will look through the redis cache
// if it does not find the URL in the redis caching, it will then look through the mongoDB
// if it then finds it in the mongoDB, it will create the URL in the caching
// keep in mind that the data stored in the caching is different from the data stored in the database
// mongoDB (database) saves -> short URL, long URL, view/acess count and creation date
// redis (caching) saves -> short URL and long URL
// because view/acess count and creation date are not being used right now, it does not matter
// but in the future, when both are being used, a system will have to be created to "sync" the data between caching and DB
// for information about that feel free to contact @CodyKoInABox on github
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

// this makes the API goes live
app.listen(PORT, () => console.log(`Live on port ${PORT}`))
// this connects to the mongoDB database
connectMongo()
// this connects to the redis database (caching)
redisClient.connect()


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// function that connects to mongoDB database
async function connectMongo(){
    try{
        await mongoose.connect(uri)
        console.log("Connected to MongoDB")
    }catch(e){
        console.error(e)
    }
}

// this is the schema for the data saved on mongoDB for each URL
const linkSchema = new Schema({
    _id: {type: String, required: true}, // this is the short URL
    longURL: {type: String, required: true}, // this is the original URL
    clickCount: {type: Number, required: false}, // this is a view/click/acess count for the short URL
    creationDate: { type: Date, default: Date.now, required: true }, // this is the creation date, automatically set to the day and time the entry in the DB was created
})

// this is a model based on the "linkSchema" schema
const linkModel =  mongoose.model('Link', linkSchema)



// function to write to redis database (caching)
async function redisSet(key, field, value){

    let result = await redisClient.hSet(key, field, value)

    return result
}

// function to read from redis database (caching)
async function redisGet(key, field){

    let result = await redisClient.hGet(key, field)

    return result
}



