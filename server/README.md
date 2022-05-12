# Server configuration

This server connects to MongoDB and fetches blog posts. Install with
```
$ npm install
```

Create a file called `config.env` with the following content:
```
ATLAS_URI=mongodb+srv://username:password@yourmongodbserver.mongodb.net
```

then run
```
$ npm start
```

To have the server running at `https://localhost:5000`. Then you can
fetch posts from the `posts` directory.
