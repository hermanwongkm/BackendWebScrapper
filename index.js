const cheerio = require("cheerio");
const Nightmare = require("nightmare");
const nightmare = Nightmare({ show: true });
cheerioTableparser = require("cheerio-tableparser");
var cors = require("cors");

var express = require("express");
var app = express();
app.use(cors());
const port = 3001;
app.listen(port, () =>
  console.log("The server is currently listening on: " + port)
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
    //loading html body to cheerio
    var $ = cheerio.load(body);
    cheerioTableparser($);
    var data = $("table.restable").parsetable(true, true, true);
    var heading = data[0];
    var suffix = data[1];
    var description = data[2];
    // the start of the table is 6
    // console.log(heading[6],suffix[6],description[6]);
    var i;
    var results = [];

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
    }
    return results;
  }
};

app.get("/test/:search", async function(req, res) {
  console.log(req.params.search);
  let query = req.params.search;
  var body = await getBody(query);
  extractedTable = extractTable(body);
  res.send(extractedTable);
});

// const cheerio = require("cheerio");
// const Nightmare = require("nightmare");
// const nightmare = Nightmare({ show: false });
// cheerioTableparser = require("cheerio-tableparser");
// var cors = require("cors");

// var express = require("express");
// var app = express();
// app.use(cors());
// const port = 3001;
// app.listen(port, () =>
//   console.log("The server is currently listening on: " + port)
// );

// function getInfo(parameter, res) {
//   nightmare
//     .goto("https://hts.usitc.gov/?query=" + parameter)
//     .wait(5000)
//     .evaluate(function() {
//       //here is where I want to return the html body
//       return document.body.innerHTML;
//     })
//     .then(function(body) {
//       //loading html body to cheerio
//       var $ = cheerio.load(body);
//       cheerioTableparser($);
//       var data = $("table.restable").parsetable(true, true, true);
//       var heading = data[0];
//       var suffix = data[1];
//       var description = data[2];
//       // the start of the table is 6
//       // console.log(heading[6],suffix[6],description[6]);
//       var i;
//       var results = [];

//       //[0.1] Replace empty string with parent or default "00" for suffix
//       let previous = "ERR";
//       for (i = 6; i < data[0].length; i++) {
//         if (suffix[i] == "") {
//           suffix[i] = "00";
//         }

//         if (heading[i] != "") {
//           previous = heading[i];
//         } else {
//           heading[i] = previous;
//         }
//         //[0.1] End
//         results.push({
//           data: heading[i],
//           suffix: suffix[i],
//           description: description[i]
//         });
//       }
//       res.send(results);
//       return;
//     });
// }

// app.get("/test/:search", function(req, res) {
//   console.log(req.params.search);
//   let query = req.params.search;
//   var results = getInfo(query, res);
// });
