const mongoose = require("mongoose");
const Transaction = require("./src/models/Transaction");
require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://maphomeuser:maphomepass@maphome.vzzx3.mongodb.net/maphome?retryWrites=true&w=majority");
  
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  
  console.log("Date Range:", sevenDaysAgo, "to", today);
  
  const allT = await Transaction.find({});
  console.log("Total Transactions in DB:", allT.length);
  
  const recentT = await Transaction.find({
    createdAt: { $gte: sevenDaysAgo, $lte: today }
  });
  console.log("Transactions in last 7 days:", recentT.length);
  if (recentT.length > 0) {
    console.log("First recent transaction:", recentT[0].createdAt);
  }
  
  process.exit(0);
}
run();
