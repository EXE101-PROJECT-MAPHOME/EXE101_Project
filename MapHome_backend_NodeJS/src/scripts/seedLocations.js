const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Province, District, Ward } = require('../models/Location');
const path = require('path');
const axios = require('axios');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedLocations = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding locations...');

    console.log('Fetching data from provinces.open-api.vn...');
    const response = await axios.get('https://provinces.open-api.vn/api/?depth=3');
    // Chỉ lấy Thành phố Hồ Chí Minh (Code: 79)
    const data = response.data.filter(p => p.name.includes('Hồ Chí Minh'));

    console.log('Clearing old location data...');
    await Province.deleteMany();
    await District.deleteMany();
    await Ward.deleteMany();

    const provinces = [];
    const districts = [];
    const wards = [];

    data.forEach(p => {
      provinces.push({
        code: p.code,
        name: p.name,
        codename: p.codename,
        division_type: p.division_type,
        phone_code: p.phone_code
      });

      p.districts.forEach(d => {
        districts.push({
          code: d.code,
          name: d.name,
          codename: d.codename,
          division_type: d.division_type,
          province_code: p.code
        });

        d.wards.forEach(w => {
          wards.push({
            code: w.code,
            name: w.name,
            codename: w.codename,
            division_type: w.division_type,
            district_code: d.code
          });
        });
      });
    });

    console.log(`Inserting ${provinces.length} provinces...`);
    await Province.insertMany(provinces);
    
    console.log(`Inserting ${districts.length} districts...`);
    await District.insertMany(districts);
    
    console.log(`Inserting ${wards.length} wards...`);
    const batchSize = 1000;
    for (let i = 0; i < wards.length; i += batchSize) {
      await Ward.insertMany(wards.slice(i, i + batchSize));
    }

    console.log('Location seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding locations:', error);
    process.exit(1);
  }
};

seedLocations();
