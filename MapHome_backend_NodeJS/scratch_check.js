const mongoose = require("mongoose");
const Property = require("./src/models/Property");

async function test() {
  await mongoose.connect("mongodb://127.0.0.1:27017/maphome", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const p = await Property.findOne().sort({ createdAt: -1 });
  console.log("Latest property:", p.name);
  console.log("Amenities from DB:", p.amenities);
  console.log("Amenities as JSON:", p.toJSON().amenities);

  mongoose.connection.close();
}

test();
