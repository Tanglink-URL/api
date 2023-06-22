const app = require('express')()

const PORT = process.env.PORT || 8080



app.get('/ping', (req, res) =>{

    const apiKey = req.query.apiKey

    res.send({data: 'pong'})
})






app.listen(PORT, () => console.log(`Live on port ${PORT}`))


