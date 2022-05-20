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
  var tot_ids = the_ids.length; // total WGBS hits

  // IDs that will be displayed in the page
  var ids_start = Math.min(the_page*num_elems_per_page, the_ids.length - 1);
  var ids_end = Math.min((the_page + 1)*num_elems_per_page, the_ids.length);
  the_ids = the_ids.slice(ids_start, ids_end);

  // uses EFetch to get info on the IDs
  var fetch_ids = the_ids.join(',');
  var fetch = [];
  const the_query_url = process.env.EFETCH_URL  + '&id=' + fetch_ids;
  await axios.get(the_query_url).then((response) => {
    xml2js.parseString(response.data, (err, result) => {
      fetch = result.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE;
    })
  });

  num_pages = Math.ceil(tot_ids/num_elems_per_page);
  data = {
           title : 'GEO WGBS datasets',
           total_hits : tot_ids,
           the_ids : the_ids,
           fetch : fetch,
           the_page : the_page,
           num_pages : num_pages
         };
  res.render('geo', data);
});

function  good_url(url) {
  return(
    !url.includes("fq") &&
    !url.includes("fastq") &&
    !url.includes("bam") &&
    !url.includes("cram") &&
     url.includes("https") &&
     url.includes("sra"));
}

router.get('/id/:sraId', async function(req, res, next) {
  var the_id = req.params.sraId;
  console.log('fetching data for ' + the_id);

  /*****************  FETCH STUDY INFORMATION ***************/
  //get information from this SRX
  var ret;
  await axios.get(process.env.EFETCH_URL  + '&id=' + the_id).then((response) => {
    xml2js.parseString(response.data, (err, result) => {
      ret = result.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE[0];
    });
  });

  console.log(ret.STUDY[0].DESCRIPTOR[0].STUDY_TITLE[0]);

  // get study ID
  the_study = ret.EXPERIMENT[0].STUDY_REF[0].$.accession;

  // get PMID (if it exists)
  var PMID = 'NOTFOUND';
  var the_gse = 'GSE-NOT-FOUND';
  try {
    const tmp = ret.STUDY[0].$.alias;
    if (tmp.includes("GSE"))
      the_gse = tmp;
  }
  catch (e) {
    console.log('could not find GSE for this sample');
  }
  try {
    const the_geo_url = process.env.GEO_URL+the_gse;
    await axios.get(the_geo_url).then((response)  => {
      PMID = response.data.match('\/pubmed\/[0-9]+')[0].replace('\/pubmed\/', '');
    });
  }
  catch (e) {
    console.log('could not find PMID for this study');
    console.log(e);
  }
  console.log('study: ' + the_study);
  console.log('GSE: ' + the_gse);
  console.log('PMID: ' + PMID);

  /*************** FETCH SAMPLE INFORMATION **************/
  // Get IDs of same study
  var same_study_ids;
  search_url = process.env.ESEARCH_URL_STUDY + '(' + the_study + '[Study] AND Bisulfite-Seq[Strategy])';
  await axios.get(search_url).then((response) => {
    xml2js.parseString(response.data, (err, result) => {
      same_study_ids = result.eSearchResult.IdList[0].Id;
      same_study_ids = same_study_ids.join(',');
    });
  });

  // get all SRR URLs from the same study
  var srr_urls = []
  var srrs = []
  const fetch_url = process.env.EFETCH_URL  + '&id=' + same_study_ids;
  await axios.get(fetch_url).then((response) => {
    xml2js.parseString(response.data, (err, result) => {
      try {
      result.EXPERIMENT_PACKAGE_SET
            .EXPERIMENT_PACKAGE.forEach((experiment) => {
        experiment.RUN_SET[0].RUN.forEach((the_run) => {
          the_run.SRAFiles[0].SRAFile.forEach((the_file) => {
            var found = false;
            try {
              const the_url = the_file.$.url;
              if (typeof the_url !== "undefined") {
                if (!found && good_url(the_url)) {
                  srr_urls.push(the_url);
                  srrs.push(the_file.$.filename);
                  found = true;
                }
              }

              else if (typeof the_file.Alternatives !== "undefined") {
                the_file.Alternatives.forEach((alternative) => {
                  const the_alt_url = alternative.$.url;
                  if (!found && good_url(the_alt_url)) {
                    srr_urls.push(the_alt_url);
                    srrs.push(the_file.$.filename);
                    found = true;
                  }
                });
              }
            }
            catch (e) {
              console.log('Could not fetch URL!');
              console.log('Error: ' + e);
            }
          });
        });
      });
      }
      catch (e) {
        console.log('Failed getting data for experiment!');
      }
    });
  });

  console.log(srrs);
  data = {title : 'GEO query ' + the_id,
          id : the_id,
          GSE : the_gse,
          PMID : PMID,
          project_name : 'FILLME',
          organism: 'FINDTHEORGANISM',
          ret : ret,
          srrs : srrs,
          srr_urls : srr_urls};
  res.render('geodataset', data);
});

module.exports = router;
