require('dotenv').config();

const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 3000;
const cors = require('cors');
const { ObjectId } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    const usersCollection = client.db('HumBird').collection('users');
    const postsCollection = client.db('HumBird').collection('posts');

    app.post('/users', async (req, res) => {
      const { body } = req;

      const alreadyExists = await usersCollection.findOne({
        email: body.email,
      });

      if (alreadyExists) return;

      try {
        const result = await usersCollection.insertOne(body);
        return res.status(201).json(result);
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }
    });

    app.get('/users/:email', async (req, res) => {
      const { params } = req;

      try {
        const result = await usersCollection.findOne({ email: params.email });

        if (!result) {
          return res.status(404).json({ message: 'No user found.' });
        }

        return res.status(200).json(result);
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }
    });

    app.get('/posts', async (req, res) => {
      try {
        const result = await postsCollection.find({}).toArray();

        if (!result.length) {
          return res.status(404).json({ message: 'No posts found.' });
        }

        return res.status(200).json(result);
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }
    });

    app.get('/posts/:id', async (req, res) => {
      const { params } = req;

      try {
        const result = await postsCollection.findOne({
          _id: new ObjectId(params.id),
        });

        if (!result) {
          return res.status(404).json({ message: 'No post found.' });
        }

        return res.status(200).json(result);
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }
    });

    app.post('/posts', async (req, res) => {
      const { body } = req;

      try {
        const result = await postsCollection.insertOne(body);
        return res.status(201).json(result);
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }
    });

    app.delete('/posts', async (req, res) => {
      const { query } = req;

      try {
        const result = await postsCollection.deleteOne({
          _id: new ObjectId(query.id),
        });

        return res.status(200).json(result);
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }
    });

    app.patch('/posts', async (req, res) => {
      const { query } = req;
      let updatedReacts;

      const post = await postsCollection.findOne({
        _id: new ObjectId(query.id),
      });

      if (!post) {
        return res.status(404).json({ message: 'Post not found.' });
      }

      if (post.reacts.includes(query.email)) {
        updatedReacts = post.reacts.filter((react) => react !== query.email);
      } else {
        updatedReacts = [...post.reacts, query.email];
      }

      try {
        const result = await postsCollection.updateOne(
          { _id: new ObjectId(query.id) },
          { $set: { reacts: updatedReacts } },
          { upsert: true }
        );

        return res.status(200).json(result);
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }
    });

    app.put('/posts/:id', async (req, res) => {
      const { params, body } = req;

      try {
        const result = await postsCollection.updateOne(
          { _id: new ObjectId(params.id) },
          { $set: { post: body.updatedPost } },
          { upsert: true }
        );

        return res.status(200).json(result);
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }
    });
  } catch (error) {
    console.log(error);
  }
};

run().catch((error) => console.log(error));

app.get('/', (req, res) => {
  res.json({ msg: 'Server is running...' });
});

app.listen(port);
