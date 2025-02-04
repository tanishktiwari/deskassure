const fs = require('fs');
const path = require('path');
const Image = require('../models/imageModel');
const multer = require('multer');

// Set up storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');  // Path where the uploaded files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Save with timestamp to avoid name conflicts
  },
});

const upload = multer({ storage: storage });

// Image upload function
exports.uploadImage = [
  upload.single('image'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    try {
      const image = new Image({
        filename: req.file.filename,
        path: req.file.path,
        url: `http://localhost:5174/${req.file.path}`, // URL for access to the image
      });

      await image.save();
      res.status(200).json(image);
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload image', error });
    }
  },
];

// Fetch images function
exports.getImages = async (req, res) => {
  try {
    const images = await Image.find();
    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch images', error });
  }
};

// Delete image function
exports.deleteImage = async (req, res) => {
  const imageId = req.params.id;

  try {
    // Find the image in the database
    const image = await Image.findById(imageId);
    if (!image) {
      return res.status(404).send('Image not found');
    }

    // Remove the image from the database
    await Image.findByIdAndDelete(imageId);

    // Delete the image file from the filesystem
    const filePath = path.join(__dirname, '..', image.path); // Get full path of the file
    fs.unlink(filePath, (err) => {
      if (err) {
        return res.status(500).send('Failed to delete image file');
      }
      res.status(200).send('Image deleted successfully');
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete image', error });
  }
};
