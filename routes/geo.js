var express = require('express');
var axios = require('axios');
var xml2js = require('xml2js');
var router = express.Router();

/* GET users listing. */
router.get('/', async function(req, res, next) {
  var ret;
  await axios.get('http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=sra&term=%22bisulfite%22+%22WGBS%22')
       .then((response) => {
         xml2js.parseString(response.data, (err, result) => {
           ret = result.eSearchResult;
         })
       });
  console.log(ret);
  console.log(ret.IdList[0].Id);
  data = {title : 'GEO WGBS datasets', ret : ret};
  res.render('geo', data);
});

router.get('/:sraId', async function(req, res, next) {
  var ret;
  var the_id = req.params.sraId;

  console.log('trying to access ID ' + the_id);
  await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=sra&id=' + the_id)
    .then((response) => {
      xml2js.parseString(response.data, (err, result) => {
        ret = result.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE;
      })
    });

  data = {title : 'GEO query ' + the_id, id : the_id, ret : ret};
  console.log(ret);
  res.render('geodataset', data);
});

module.exports = router;
