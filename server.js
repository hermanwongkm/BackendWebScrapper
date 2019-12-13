const Nightmare = require("nightmare");
require("nightmare-download-manager")(Nightmare);
const nightmare = Nightmare({ show: true });
// Spawn is for python script for data preprocessing
const spawn = require("child_process").spawn;
const csvtojson = require("csvtojson");

/**
 * getUpdated calls for web automation tool to download the latest csv file.
 */
const filepath = "./database/csv/mined/file.csv";

convertCSV = async () => {
  data = await csvtojson().fromFile("./database/csv/modified/modified.csv");
  return data;
};

fetch = async () => {
  nightmare.on("download", function(state, downloadItem) {
    if (state == "started") {
      nightmare.emit("download", filepath, downloadItem);
    }
  });

  nightmare
    .downloadManager()
    .goto("https://hts.usitc.gov/export")
    .wait(1000)
    .type("body", "\u000d") // press enter
    .type(`input[name="from"]`, "0000")
    .type(`input[name="to"]`, "9999")
    .click("input#Submit.btn.btn-primary")
    .wait(10000)
    .waitDownloadsComplete()
    .then(() => {
      // now run python script
      console.log("[1] Successfully mined hts.usitc.gov/export");
      const pythonProcess = spawn("python3", ["./focus.py", filepath]);
      pythonProcess.stdout.on("data", async data => {
        console.log(String(data));
        converted = await convertCSV();
        console.log("[3] Successfully convert .csv to JSON");
        console.log(converted);
      });
    });
  return true;
};

console.log("[0] Nightmare is running... \n [0.1] Mining hts.usitc.gov ...");
fetch();
