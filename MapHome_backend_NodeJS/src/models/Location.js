const mongoose = require("mongoose");

const ProvinceSchema = new mongoose.Schema({
  code: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  codename: { type: String },
  division_type: { type: String },
  phone_code: { type: Number },
});

const DistrictSchema = new mongoose.Schema({
  code: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  codename: { type: String },
  division_type: { type: String },
  province_code: { type: Number, required: true, ref: 'Province' },
});

const WardSchema = new mongoose.Schema({
  code: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  codename: { type: String },
  division_type: { type: String },
  district_code: { type: Number, required: true, ref: 'District' },
});

const Province = mongoose.model("Province", ProvinceSchema);
const District = mongoose.model("District", DistrictSchema);
const Ward = mongoose.model("Ward", WardSchema);

module.exports = { Province, District, Ward };
