const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config({ path: __dirname + "/.env" });
const moment = require("moment");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5011;
const api = require("./api/routes");
const webApi = require("./web/routes");

app.use(cors());
app.use(express.static(__dirname + "/public"));
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  }),
);

app.use(express.json());
app.use("/api", api);
app.use("/web", webApi);

app.get("/model-sync", (req, res) => {
  let result = { success: false, data: null, message: "" };
  // Object.keys(models).forEach((key) => {
  // models[key].sync({ force: true });
  // });
  return res.status(200).json(JSON.stringify(result));
});

app.get("/", (req, res) => {
  return res.send("Car dealer Project");
});

app.listen(PORT, async () => {
  console.log("Car dealer start:", moment().format("YYYY-MM-DD HH:mm:ss"));
});
