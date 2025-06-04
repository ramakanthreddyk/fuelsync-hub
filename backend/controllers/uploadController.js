
const { Upload, User, Plan } = require('../models');
const { getEffectiveLimits } = require('../middleware/planLimits');
const { uploadToBlob, processOCR } = require('../services/azureService');

const getUploads = async (req, res) => {
  try {
    console.log('📋 Fetching uploads for user:', req.userId);
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    
    // Role-based access control
    if (req.user.role === 'Employee') {
      whereClause.userId = req.userId;
    } else if (req.user.role === 'Pump Owner') {
      // Get uploads from own station only
      const stationUsers = await User.findAll({
        where: { stationId: req.user.stationId },
        attributes: ['id']
      });
      whereClause.userId = stationUsers.map(u => u.id);
    }
    // Super Admin sees all uploads

    const uploads = await Upload.findAndCountAll({
      where: whereClause,
      include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    console.log('✅ Found', uploads.count, 'uploads');

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
    console.error('❌ Get uploads error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch uploads'
    });
  }
};

const uploadReceipt = async (req, res) => {
  try {
    console.log('📤 Processing receipt upload for user:', req.userId);
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    console.log('📄 File details:', {
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Check daily upload limit using effective limits
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

    const user = await User.findByPk(req.userId, {
      include: [{ model: Plan, as: 'plan' }]
    });

    const effectiveLimits = getEffectiveLimits(user);
    if (effectiveLimits.maxUploadsPerDay !== -1 && todayUploads >= effectiveLimits.maxUploadsPerDay) {
      console.log('❌ Daily upload limit exceeded:', todayUploads, '>=', effectiveLimits.maxUploadsPerDay);
      return res.status(429).json({
        success: false,
        error: `Daily upload limit (${effectiveLimits.maxUploadsPerDay}) exceeded`,
        isCustomLimit: !!user.customLimits && user.customLimits.hasOwnProperty('maxUploadsPerDay')
      });
    }

    // Create upload record
    const filename = `${Date.now()}-${req.file.originalname}`;
    const upload = await Upload.create({
      userId: req.userId,
      filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      status: 'processing'
    });

    console.log('✅ Created upload record:', upload.id);

    // Upload to Azure Blob Storage
    try {
      const blobUrl = await uploadToBlob(req.file.buffer, filename);
      await upload.update({ blobUrl });
      console.log('✅ File uploaded to Azure Blob:', blobUrl);
    } catch (blobError) {
      console.error('❌ Blob upload failed:', blobError);
      await upload.update({
        status: 'failed',
        errorMessage: 'Failed to upload to cloud storage'
      });
      return res.status(500).json({
        success: false,
        error: 'Failed to upload file to cloud storage'
      });
    }

    // Process OCR asynchronously
    setImmediate(async () => {
      try {
        console.log('🔍 Starting async OCR processing for upload:', upload.id);
        await processOCR(upload.id, req.file.buffer);
      } catch (ocrError) {
        console.error('❌ OCR processing failed for upload:', upload.id, ocrError);
        // Error is already handled in processOCR function
      }
    });

    res.status(201).json({
      success: true,
      data: upload,
      message: 'File uploaded successfully. OCR processing in progress.'
    });

  } catch (error) {
    console.error('❌ Upload receipt error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload receipt'
    });
  }
};

const updateOcrData = async (req, res) => {
  try {
    console.log('✏️ Updating OCR data for upload:', req.params.id);
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

    const updatedUpload = await upload.update({
      amount: parseFloat(amount),
      litres: parseFloat(litres),
      fuelType,
      ocrData: {
        ...upload.ocrData,
        amount: parseFloat(amount),
        litres: parseFloat(litres),
        fuelType,
        pumpId,
        editedManually: true,
        updatedAt: new Date()
      }
    });

    console.log('✅ OCR data updated for upload:', id);

    res.json({
      success: true,
      data: updatedUpload
    });
  } catch (error) {
    console.error('❌ Update OCR data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update OCR data'
    });
  }
};

const deleteUpload = async (req, res) => {
  try {
    console.log('🗑️ Deleting upload:', req.params.id);
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
    console.log('✅ Upload deleted:', id);

    res.json({
      success: true,
      message: 'Upload deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete upload'
    });
  }
};

module.exports = {
  getUploads,
  uploadReceipt,
  updateOcrData,
  deleteUpload
};
