//DB_USER=power-hacks
//DB_PASS=3XqtSWpZSJxA80nw

//https://bloc-sorry-93997.herokuapp.com


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const app = express();
var jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a3nrz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJWT = (req, res, next) => {
    // const authorization=req.headers.authorization;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}


const run = async () => {
    try {
        await client.connect();
        console.log('db connected successfully');
        const userCollection = client.db('power-hacks').collection('users');
        const billCollection = client.db('power-hacks').collection('bills');



        app.get('/api/login/:data', async (req, res) => {
            const data = req.body;
        })


        app.get('/api/billing-list', verifyJWT, async (req, res) => {

            console.log('query', req.query);
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);

            let result;
            if (page || size) {
                result = await billCollection.find().skip(page * size).limit(size).toArray();
            } else {
                result = await billCollection.find().toArray();
            }


            res.send(result);
        })

        app.get('/billCount', verifyJWT, async (req, res) => {
            const count = await billCollection.estimatedDocumentCount();
            res.send({ count });
        })


        app.get('/paid-amount', verifyJWT, async (req, res) => {
            const result = await billCollection.find().project({ paidAmount: 1 }).toArray();
            res.send(result);
        })

        app.post('/api/add-billing', async (req, res) => {
            const data = req.body;
            const result = await billCollection.insertOne(data);
            res.send(result);

        })

        app.put('/users/:email', async (req, res) => {
            const email = req.params.email;
            const userInfo = req.body;
            console.log(email);
            const filter = { email: email };
            const options = { upsert: true };
            const updatedDoc = {
                $set: userInfo
            };
            const result = await userCollection.updateOne(filter, updatedDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token });

        })

        app.delete('/api/delete-billing/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: ObjectId(id) }
            const result = await billCollection.deleteOne(filter);
            res.send(result);
        })
    }

    finally {

    }
}
run().catch(console.dir);

app.get('/', (res, req) => {
    res.send('running power hack server')
});

app.listen(port, () => {
    console.log('power hacks server is listening at', port);
})


