require('dotenv').config();
const app = require('./app');

const PORT = process.env.MONOLITH_PORT || 3000;

app.listen(PORT, () => {
  console.log(`Monolith listening on port ${PORT}`);
});
