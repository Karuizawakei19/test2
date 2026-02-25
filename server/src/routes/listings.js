
// Placeholders 

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Get listings route works — fake' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Post listing route works — fake' });
});

router.post('/:id/reserve', (req, res) => {
  res.json({ message: 'Reserve route works — fake' });
});

router.patch('/:id/confirm', (req, res) => {
  res.json({ message: 'Confirm pickup route works - fake' });
});

module.exports = router;