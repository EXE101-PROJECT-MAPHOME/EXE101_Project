const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const Transaction = require("./src/models/Transaction");

async function check() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/maphome";
  await mongoose.connect(uri);
  
  const month = 6;
  const year = 2026;
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  const query = {
    createdAt: { $gte: startDate, $lte: endDate }
  };
  
  console.log("Query:", query);
  
  const totalRevenueData = await Transaction.aggregate([
    { $match: { status: "success", ...query } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  
  console.log("totalRevenueData:", totalRevenueData);
  
  const allTxs = await Transaction.find({ status: "success", ...query });
  console.log("All success txs in June 2026:");
  allTxs.forEach(t => {
    console.log(`- Amount: ${t.amount}, createdAt: ${t.createdAt}`);
  });
  
  mongoose.connection.close();
}

check();
