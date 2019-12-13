const Nightmare = require("nightmare");
require("nightmare-download-manager")(Nightmare);
const nightmare = Nightmare({ show: true });

const csvtojson = require("csvtojson");
var mongoose = require("mongoose");

runNightmare = async () => {
  nightmare.on("download", function(state, downloadItem) {
    if (state == "started") {
      nightmare.emit("download", "./file.csv", downloadItem);
    }
  });

  await nightmare
    .downloadManager()
    .goto("https://hts.usitc.gov/export")
    .wait(3000)
    .type("body", "\u000d") // press enter
    .type(`input[name="from"]`, "0000")
    .type(`input[name="to"]`, "9999")
    .click("input#Submit.btn.btn-primary")
    .wait(10000)
    .waitDownloadsComplete()
    .then(() => {
      console.log("done");
      return 1;
    });
};

test = async () => {
  // await runNightmare();
  var serverAdr = "localhost:27018";
  var dbName = "hscode";

  mongoose.connect(`mongodb://${serverAdr}/${dbName}`, {
    useNewUrlParser: true
  });
  mongoose.connection.on("error", function(err) {
    if (err) {
      console.log(err);
    }
    throw err;
  });

  var data = await convertCSV();
  console.log(data);
  // console.log(data[3]);
  var hsCodeSchema = new mongoose.Schema({
    0: String,
    1: String,
    2: String,
    3: [String],
    4: String,
    5: String,
    6: String,
    7: String,
    8: String,
    9: [String]
  });

  var hsCodeTable = mongoose.model("hsCodeTable", hsCodeSchema); //Table name and schema as paramaters
  // console.log(data[4]);
  // let r = new hsCodeTable(data[4]);
  // r.save();

  hsCodeTable.collection.insert(data[5], function(err, docs) {
    console.log(data[5]);
    if (err) {
      return console.error(err);
    } else {
      console.log("Multiple documents inserted to Collection");
    }
  });
};

convertCSV = async () => {
  data = await csvtojson().fromFile("modified.csv");
  return data;
};
test();
