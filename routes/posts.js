var express = require('express');
var axios = require('axios');
var router = express.Router();

/* GET users listing. */
router.get('/', async function(req, res, next) {
  var posts;
  await axios.get('http://localhost:5000/posts')
       .then((response) => {
         posts = response.data;
       });
  data = {title : 'the posts', posts : posts}
  res.render('posts', data);
});

module.exports = router;
