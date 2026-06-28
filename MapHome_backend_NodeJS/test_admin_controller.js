const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const { getDashboardStats, getChartStats } = require("./src/controllers/adminController");

async function run() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/maphome";
  await mongoose.connect(uri);

  const req = {
    query: {
      month: 6,
      year: 2026,
      range: "week"
    }
  };

  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      console.log("Response Status:", this.statusCode || 200);
      console.log("Response JSON:", JSON.stringify(data, null, 2));
    }
  };

  console.log("--- Calling getDashboardStats ---");
  await getDashboardStats(req, res);

  console.log("\n--- Calling getChartStats ---");
  await getChartStats(req, res);

  mongoose.connection.close();
}

run().catch(console.error);
