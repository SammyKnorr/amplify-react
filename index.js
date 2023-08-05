const PORT = 8000
const express = require('express')
const cors = require('cors')
const axios = require('axios')
require('dotenv').config()

const app = express()

app.get('/', (req,res) => {
    res.json('hi')
})

app.get('/a', (req,res) => {
    const key = process.env.REACT_APP_SECRET_API_KEY;
    var text = "I am applying as a Software Engineer intern for Summer of 2024,"
        + "what companies do you recommend I look at? I have already applied to a few companies";
    const options = {
        method: 'POST',
        url: "https://api.openai.com/v1/chat/completions",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key, 
        },
        body: JSON.stringify({
          "model": "gpt-3.5-turbo",
          "messages": [
            {"role": "system", "content": "You are helping me find new software intern opportunities for the summer of 2024."}, 
            {"role": "user", "content": text}
          ]
        })  
    }

    axios.request(options).then((response) => {
        res.json(response.json.choices[0].message['content'])
    }).catch((error) => {
        console.error(error)
    })
    
    
})

app.listen(8000, () => console.log('Backend is running on 8000'))
