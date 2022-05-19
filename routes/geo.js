var express = require('express');
var axios = require('axios');
var xml2js = require('xml2js');
var router = express.Router();

router.get('/', function(req, res) {
  res.redirect('/geo/0');
});

/* GET users listing. */
router.get('/:page', async function(req, res, next) {
  // fetch most recent datasets
  var search;
  await axios.get(process.env.ESEARCH_URL).then((response) => {
    xml2js.parseString(response.data, (err, result) => {
      search = result.eSearchResult;
    })
  });

  // fetch info on most recent ids

  var num_elems_per_page = 20;
  var the_page = Number(req.params.page);

  var the_ids = search.IdList[0].Id;
  var ids_start = Math.min(the_page*num_elems_per_page, the_ids.length - 1);
  var ids_end = Math.min((the_page + 1)*num_elems_per_page, the_ids.length);

  var fetch_ids = the_ids.slice(ids_start, ids_end).join(',');
  var fetch = [];

  const the_query_url = process.env.EFETCH_URL  + '&id=' + fetch_ids;
  await axios.get(the_query_url).then((response) => {
    xml2js.parseString(response.data, (err, result) => {
      fetch = result.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE;
    })
  });


  num_pages = Math.ceil(the_ids.length/num_elems_per_page);
  data = {
           title : 'GEO WGBS datasets',
           search : search,
           fetch : fetch,
           the_page : the_page,
           num_pages : num_pages
         };
  res.render('geo', data);
});

router.get('/id/:sraId', async function(req, res, next) {
  var ret;
  var the_id = req.params.sraId;

  await axios.get(process.env.EFETCH_URL  + '&id=' + the_id).then((response) => {
    xml2js.parseString(response.data, (err, result) => {
      ret = result.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE[0];
    })
  });

  data = {title : 'GEO query ' + the_id, id : the_id, ret : ret};
  res.render('geodataset', data);
});

module.exports = router;
