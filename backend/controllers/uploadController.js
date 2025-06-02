
const { Upload, User, Plan } = require('../models');
const { uploadToBlob, processOCR } = require('../services/azureService');
const { validateUpload } = require('../utils/validation');

const getUploads = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const uploads = await Upload.findAndCountAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: uploads.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: uploads.count,
        totalPages: Math.ceil(uploads.count / limit)
      }
    });
  } catch (error) {
    console.error('Get uploads error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const uploadReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Get user with plan to check upload limits
    const user = await User.findByPk(req.userId, {
      include: [{ model: Plan, as: 'plan' }]
    });

    // Check daily upload limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayUploads = await Upload.count({
      where: {
        userId: req.userId,
        createdAt: {
          [require('sequelize').Op.gte]: today
        }
      }
    });

    const uploadLimit = user.plan?.uploadLimit || 4; // Free plan default
    if (uploadLimit !== -1 && todayUploads >= uploadLimit) {
      return res.status(429).json({
        success: false,
        error: `Daily upload limit (${uploadLimit}) exceeded`
      });
    }

    // Validate file
    const { error } = validateUpload(req.file);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Create upload record
    const upload = await Upload.create({
      userId: req.userId,
      filename: `${Date.now()}-${req.file.originalname}`,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      status: 'processing'
    });

    // Upload to Azure Blob Storage
    try {
      const blobUrl = await uploadToBlob(req.file.buffer, upload.filename);
      await upload.update({ blobUrl });

      // Process OCR asynchronously
      processOCR(upload.id, blobUrl).catch(error => {
        console.error(`OCR processing failed for upload ${upload.id}:`, error);
      });

      res.status(201).json({
        success: true,
        data: upload
      });
    } catch (uploadError) {
      await upload.update({
        status: 'failed',
        errorMessage: 'File upload failed'
      });
      
      res.status(500).json({
        success: false,
        error: 'File upload failed'
      });
    }
  } catch (error) {
    console.error('Upload receipt error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const updateOcrData = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, litres, fuelType, pumpId } = req.body;

    const upload = await Upload.findOne({
      where: { id, userId: req.userId }
    });

    if (!upload) {
      return res.status(404).json({
        success: false,
        error: 'Upload not found'
      });
    }

    await upload.update({
      amount: parseFloat(amount),
      litres: parseFloat(litres),
      fuelType,
      ocrData: {
        amount: parseFloat(amount),
        litres: parseFloat(litres),
        fuelType,
        pumpId,
        timestamp: new Date().toISOString(),
        editedManually: true
      }
    });

    res.json({
      success: true,
      data: upload
    });
  } catch (error) {
    console.error('Update OCR data error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const deleteUpload = async (req, res) => {
  try {
    const { id } = req.params;

    const upload = await Upload.findOne({
      where: { id, userId: req.userId }
    });

    if (!upload) {
      return res.status(404).json({
        success: false,
        error: 'Upload not found'
      });
    }

    await upload.destroy();

    res.json({
      success: true,
      message: 'Upload deleted successfully'
    });
  } catch (error) {
    console.error('Delete upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getUploads,
  uploadReceipt,
  updateOcrData,
  deleteUpload
};
