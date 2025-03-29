const app = require('./src/app');
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} `);
  console.log(`🚀 http://localhost:${PORT} `);
});

module.exports = app;
