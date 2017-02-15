var request = require('request');
var cheerio = require('cheerio');
var url_parse = require('url-parse');

var START_URL = "http://edition.cnn.com";
var SEARCH_WORD = "love";
var MAX_SITES_TO_VISIT = 30;

var sitesToVisit = [];
var sitesVisited = {};
var numSucceedToVisit = 0;
var result = [];

var url = new url_parse(START_URL);
var baseUrl = url.protocol + "//" + url.hostname;

var main = (function(){
    if (process.argv.length != 4) {
      console.log("WARNING: Please specify a keyword and sitesNum");
      process.exit(-1);
    }
    process.argv.forEach(function(val,index,array) {
      switch(index) {
        case 2:
          SEARCH_WORD = val;
          break;
        case 3:
          MAX_SITES_TO_VISIT = parseInt(val);
          break;
        default:
          break;
      }
    });

    console.log("===================================");
    console.log("|                                 |");
    console.log("|     The crawler is starting     |");
    console.log("|                                 |");
    console.log("===================================");
    console.log("|                                 |");
    console.log("|     Searching Word..." + SEARCH_WORD);
    console.log("|                                 |");
    console.log("===================================");

    sitesToVisit.push(START_URL);

    crawl();
})();

function crawl() {
  if(numSucceedToVisit >= MAX_SITES_TO_VISIT) {
    console.log("===================================");
    console.log("|                                 |");
    console.log("|             Result              |");
    console.log("|                                 |");
    console.log("===================================");
    console.log("After crawling max limit of number of pages,");
    console.log("We found " + result.length + " related articles!");
    console.log("The followings are the results");
    console.log(result.join('\r\n'));
    console.log("===================================");
    console.log("|                                 |");
    console.log("|            Finished             |");
    console.log("|                                 |");
    console.log("===================================");
    return;
  }
  var nextSite = sitesToVisit.pop();
  nextSite = nextSite.endsWith('/') ? nextSite.slice(0,-1) : nextSite;
  if(nextSite in sitesVisited) {
    crawl();
  } else {
    visitSite(nextSite);
  }
};

function visitSite(url) {
  // mark visted sites in the sitesVisited
  sitesVisited[url] = true;
  numSucceedToVisit++;

  // console.log("Visiting site ---> " + url);

  request({
    uri: url
  }, (err, response, body) => {
    if(response.statusCode !== 200) {
      // console.log("Fail to request, status: " + response.statusCode);
      numSucceedToVisit--;
    } else {
      var $ = cheerio.load(body);
      var isFound = searchKeyword($, SEARCH_WORD);
      if(isFound){
        console.log("Found!!! at the site --> " + url + "\n");
        result.push(url);
      }
      // append new sites to the sitesToVisit
      var sites = $("a[href^='/']");
      // console.log("Found " + sites.length + " new sites");
      sites.each(function(){
        sitesToVisit.push(baseUrl + $(this).attr("href"));
      });
    }
    crawl();
  });
}

function searchKeyword($, keyword) {
  var body = $("html").find("body").text().toLowerCase();
  return (body.indexOf(keyword.toLowerCase()) !== -1);
}
