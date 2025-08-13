const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello World' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

const port = 8002;
app.listen(port, () => {
  console.log(`Test server running on http://localhost:${port}`);
});
