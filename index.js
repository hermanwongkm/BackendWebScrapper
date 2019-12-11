const cheerio = require("cheerio");
const Nightmare = require("nightmare");
const nightmare = Nightmare({ show: false });
cheerioTableparser = require("cheerio-tableparser");
var cors = require("cors");

var express = require("express");
var app = express();
app.use(cors());
const port = 3001;
app.listen(port, () =>
  console.log("The server is currently listening on: " + port + "new")
);

async function getBody(parameter) {
  var body;
  body = await nightmare
    .goto("https://hts.usitc.gov/?query=" + parameter)
    .wait(5000)
    .evaluate(function() {
      //here is where I want to return the html body
      return document.body.innerHTML;
    });
  return body;
}

extractTable = body => {
  {
    //[0.0] flag represents the state of the automation process.
    flag = 0;
    //loading html body to cheerio
    var $ = cheerio.load(body);
    cheerioTableparser($);
    var data = $("table.restable").parsetable(true, true, true);
    // if the search term returns an empty table
    if(typeof data == "undefined" || data == null || data.length == null
    || data.length == 0){
      data = [
        ["","","","","","","EMPTY",],
        ["","","","","","","EMPTY",],
        ["","","","","","","EMPTY",]
      ];
      flag = 1;
    };
    var heading = data[0];
    var suffix = data[1];
    var description = data[2];
    // the start of the table is 6
    // console.log(heading[6],suffix[6],description[6]);
    var i;
    var results = [];
    var csv = [];

    //[0.1] Replace empty string with parent or default "00" for suffix
    let previous = "ERR";
    for (i = 6; i < data[0].length; i++) {
      if (suffix[i] == "") {
        suffix[i] = "00";
      }

      if (heading[i] != "") {
        previous = heading[i];
      } else {
        heading[i] = previous;
      }
      //[0.1] End
      results.push({
        data: heading[i],
        suffix: suffix[i],
        description: description[i]
      });
      csv.push({
        hts_code: String(heading[i]) + "." + suffix[i],
        description: description[i]
      });
    }
    return { results, csv, flag};
  }
};

app.get("/test/:search", async function(req, res) {
  console.log(req.params.search);
  let query = req.params.search;
  var body = await getBody(query);
  const { results, csv ,flag  } = extractTable(body); //Object deconstruction
  res.send([results, csv, flag]);
});
