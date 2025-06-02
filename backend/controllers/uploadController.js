
const { Upload, User, Plan } = require('../models');
const { uploadToBlob, processOCR } = require('../services/azureService');
const { validateUpload } = require('../utils/validation');

const getUploads = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Dummy data - remove when backend is ready
    const dummyUploads = [
      {
        id: '1',
        userId: req.userId,
        filename: 'receipt-001.jpg',
        originalName: 'receipt-001.jpg',
        status: 'success',
        amount: 2450.00,
        litres: 45.6,
        fuelType: 'Petrol',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        processedAt: new Date(Date.now() - 86300000).toISOString(),
        ocrData: {
          amount: 2450.00,
          litres: 45.6,
          fuelType: 'Petrol',
          pumpId: 'pump-1',
          timestamp: new Date(Date.now() - 86400000).toISOString()
        }
      },
      {
        id: '2',
        userId: req.userId,
        filename: 'receipt-002.jpg',
        originalName: 'receipt-002.jpg',
        status: 'processing',
        amount: 0,
        litres: 0,
        fuelType: 'Diesel',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        processedAt: null,
        ocrData: null
      },
      {
        id: '3',
        userId: req.userId,
        filename: 'receipt-003.jpg',
        originalName: 'receipt-003.jpg',
        status: 'success',
        amount: 1890.50,
        litres: 32.8,
        fuelType: 'Diesel',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        processedAt: new Date(Date.now() - 172700000).toISOString(),
        ocrData: {
          amount: 1890.50,
          litres: 32.8,
          fuelType: 'Diesel',
          pumpId: 'pump-2',
          timestamp: new Date(Date.now() - 172800000).toISOString()
        }
      }
    ];

    res.json({
      success: true,
      data: dummyUploads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: dummyUploads.length,
        totalPages: Math.ceil(dummyUploads.length / limit)
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

    // Check daily upload limit (dummy check for now)
    const todayUploads = 2; // Dummy count - replace with DB query later
    const uploadLimit = 10; // Dummy limit - get from user's plan

    if (uploadLimit !== 12 && todayUploads >= uploadLimit) {
      return res.status(429).json({
        success: false,
        error: `Daily upload limit (${uploadLimit}) exceeded`
      });
    }

    // Create dummy upload record
    const upload = {
      id: Date.now().toString(),
      userId: req.userId,
      filename: `${Date.now()}-${req.file.originalname}`,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      status: 'processing',
      createdAt: new Date().toISOString()
    };

    // Simulate processing delay
    setTimeout(() => {
      console.log(`Simulating OCR processing for upload ${upload.id}`);
      // In real implementation, this would call processOCR
    }, 2000);

    res.status(201).json({
      success: true,
      data: upload
    });
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

    // Dummy update - replace with DB query later
    const updatedUpload = {
      id,
      userId: req.userId,
      amount: parseFloat(amount),
      litres: parseFloat(litres),
      fuelType,
      updatedAt: new Date().toISOString(),
      ocrData: {
        amount: parseFloat(amount),
        litres: parseFloat(litres),
        fuelType,
        pumpId,
        timestamp: new Date().toISOString(),
        editedManually: true
      }
    };

    res.json({
      success: true,
      data: updatedUpload
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

    // Dummy deletion - replace with DB query later
    console.log(`Deleting upload ${id} for user ${req.userId}`);

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
