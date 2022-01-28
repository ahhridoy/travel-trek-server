const express = require("express");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const cors = require("cors");
const app = express();
require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());

const port = 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.s1xse.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

async function run() {
    try {
        await client.connect();
        console.log("database connected");
        const database = client.db("travel_trek");
        const blogsCollection = database.collection("blogs");
        const usersCollection = database.collection("users");

        // get all blogs
        app.get("/blogs", async (req, res) => {
            const cursor = blogsCollection.find({});
            const page = req.query.page;
            const size = parseInt(req.query.size);
            let blogs;
            const count = await cursor.count();
            if (page) {
                blogs = await cursor
                    .skip(page * size)
                    .limit(size)
                    .toArray();
            } else {
                blogs = await cursor.toArray();
            }
            res.send({
                count,
                blogs,
            });
        });

        // get one blog
        app.get("/blogDetails/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const blogs = await blogsCollection.findOne(query);
            res.send(blogs);
        });

        // admin can post blogs
        app.post("/blogs", async (req, res) => {
            const blogs = req.body;
            const result = await blogsCollection.insertOne(blogs);
            res.json(result);
        });

        // admin can delete blogs
        app.delete("/blogs/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await blogsCollection.deleteOne(query);
            res.json(result);
        });

        // post users information
        app.post("/users", async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });

        // filter users information for register or login
        app.put("/users", async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(
                filter,
                updateDoc,
                options
            );
            res.json(result);
        });

        // add role to users information
        app.put("/users/admin", async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: "admin" } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        });

        // check admin in users information
        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === "admin") {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });
    } finally {
        // await client.close()
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("I am node js");
});

app.listen(port, () => {
    console.log("listening to port", port);
});
