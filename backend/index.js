const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { parse } = require('date-fns');
const Trade = require('./models/trade');

dotenv.config();

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.post('/upload-csv', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const results = [];
  const filePath = path.resolve(req.file.path);

  console.log(`Processing file: ${filePath}`);

  try {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        console.log('Parsing row:', data);
        const [base_coin, quote_coin] = data.Market.split('/');
        results.push({
          utc_time: new Date(data.UTC_Time),
          operation: data.Operation,
          base_coin,
          quote_coin,
          amount: parseFloat(data['Buy/Sell Amount']),
          price: parseFloat(data.Price)
        });
      })
      .on('end', async () => {
        console.log('CSV parsing completed. Inserting data into MongoDB:', results);
        try {
          await Trade.insertMany(results);
          res.status(200).json({ message: 'Data successfully uploaded' });
          fs.unlinkSync(filePath); // Remove file after processing
        } catch (err) {
          console.error('Error inserting data into MongoDB:', err);
          res.status(500).json({ error: err.message });
        }
      });
  } catch (err) {
    console.error('Error processing file:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/asset-balance', async (req, res) => {
  const { timestamp } = req.body;
  const date = parse(timestamp, 'dd-MM-yyyy HH:mm', new Date());

  console.log(`Parsed date from timestamp '${timestamp}': ${date}`);

  try {
    const trades = await Trade.find({ utc_time: { $lt: date } });
    console.log('Fetched trades:', trades);

    const balances = trades.reduce((acc, trade) => {
      if (!acc[trade.base_coin]) {
        acc[trade.base_coin] = 0;
      }
      acc[trade.base_coin] += trade.operation.toLowerCase() === 'buy' ? trade.amount : -trade.amount;
      return acc;
    }, {});

    console.log('Computed balances:', balances);
    res.status(200).json(balances);
  } catch (err) {
    console.error('Error fetching balances:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});
