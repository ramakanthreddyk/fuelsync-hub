
const { Upload, User, Plan } = require('../models');
const { getEffectiveLimits } = require('../middleware/planLimits');

const getUploads = async (req, res) => {
  try {
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
      error: 'Failed to fetch uploads'
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
      return res.status(429).json({
        success: false,
        error: `Daily upload limit (${effectiveLimits.maxUploadsPerDay}) exceeded`,
        isCustomLimit: !!user.customLimits && user.customLimits.hasOwnProperty('maxUploadsPerDay')
      });
    }

    const upload = await Upload.create({
      userId: req.userId,
      filename: `${Date.now()}-${req.file.originalname}`,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      status: 'processing'
    });

    // TODO: Implement actual OCR processing with Azure
    // For now, simulate processing
    setTimeout(async () => {
      try {
        await Upload.update({
          status: 'success',
          amount: Math.random() * 5000 + 500,
          litres: Math.random() * 50 + 10,
          fuelType: Math.random() > 0.5 ? 'Petrol' : 'Diesel',
          processedAt: new Date(),
          ocrData: {
            confidence: 0.95,
            processedAt: new Date()
          }
        }, {
          where: { id: upload.id }
        });
      } catch (error) {
        console.error('Error updating upload:', error);
      }
    }, 3000);

    res.status(201).json({
      success: true,
      data: upload
    });
  } catch (error) {
    console.error('Upload receipt error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload receipt'
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

    res.json({
      success: true,
      data: updatedUpload
    });
  } catch (error) {
    console.error('Update OCR data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update OCR data'
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
