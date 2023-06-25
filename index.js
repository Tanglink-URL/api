const dotenv = require('dotenv');
dotenv.config();

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://" + process.env.MONGOUSERNAME + ":" + process.env.MONGOPASSWORD + "@tanglink.pqrecr6.mongodb.net/?retryWrites=true&w=majority";
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const express = require('express')
const app = express()

const PORT = process.env.PORT || 8080

app.use(express.json())

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
app.get('/:shortURL', (req, res) => {
    let shortURL = req.params.shortURL

    let longurl = linkModel.find({_id: shortURL}).then((data) =>{
        
        res.redirect(data[0].longURL)
    })

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

const linkSchema = new Schema({
    _id: {type: String, required: true}, //this is the short URL
    longURL: {type: String, required: true},
    clickCount: {type: Number, required: false},
    creationDate: { type: Date, default: Date.now, required: true },
})

const linkModel =  mongoose.model('Link', linkSchema)




