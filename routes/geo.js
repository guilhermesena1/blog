var express = require('express');
var axios = require('axios');
var xml2js = require('xml2js');
var router = express.Router();

/* GET users listing. */
router.get('/', async function(req, res, next) {
  // fetch most recent datasets
  var search;
  await axios.get(process.env.ESEARCH_URL).then((response) => {
    xml2js.parseString(response.data, (err, result) => {
      search = result.eSearchResult;
    })
  });

  // join all IDs by comma
  const all_ids = search.IdList[0].Id.join(',');

  // fetch info on most recent ids
  var fetch;
  const the_query_url = process.env.EFETCH_URL  + '&id=' + all_ids;
  console.log(the_query_url);
  await axios.get(the_query_url).then((response) => {
    xml2js.parseString(response.data, (err, result) => {
      fetch = result.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE;
    })
  });

  console.log(search);
  console.log(fetch[0].Pool[0]);
  console.log('search size: ' + search.IdList[0].Id.length);
  console.log('fetch size: ' + fetch.length);
  data = {title : 'GEO WGBS datasets', search : search, fetch : fetch};
  res.render('geo', data);
});

router.get('/:sraId', async function(req, res, next) {
  var ret;
  var the_id = req.params.sraId;

  console.log('trying to access ID ' + the_id);
  await axios.get(process.env.EFETCH_URL  + '&id=' + the_id).then((response) => {
    xml2js.parseString(response.data, (err, result) => {
      ret = result.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE[0];
    })
  });

  console.log(ret.EXPERIMENT[0].DESIGN[0]);
  data = {title : 'GEO query ' + the_id, id : the_id, ret : ret};
  res.render('geodataset', data);
});

module.exports = router;
