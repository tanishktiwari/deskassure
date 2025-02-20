const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');

// Route for uploading image
router.post('/upload', imageController.uploadImage);

// Route for getting all uploaded images
router.get('/images', imageController.getImages);

// Route for deleting an image
router.delete('/images/:id', imageController.deleteImage);

module.exports = router;
