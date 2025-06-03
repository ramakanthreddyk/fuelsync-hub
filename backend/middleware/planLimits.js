
const { User, Plan } = require('../models');

// Plan limits configuration
const PLAN_LIMITS = {
  Basic: {
    maxEmployees: 2,
    maxPumps: 3,
    maxStations: 1,
    maxUploadsPerDay: 10
  },
  Premium: {
    maxEmployees: 5,
    maxPumps: 5,
    maxStations: 1,
    maxUploadsPerDay: 50
  },
  Enterprise: {
    maxEmployees: -1, // Unlimited
    maxPumps: -1, // Unlimited
    maxStations: -1, // Unlimited
    maxUploadsPerDay: -1 // Unlimited
  }
};

const checkPlanLimits = (limitType) => {
  return async (req, res, next) => {
    try {
      const user = await User.findByPk(req.userId, {
        include: [{ model: Plan, as: 'plan' }]
      });

      if (!user || !user.plan) {
        return res.status(400).json({
          success: false,
          error: 'User plan not found'
        });
      }

      const planName = user.plan.name;
      const limits = PLAN_LIMITS[planName];

      if (!limits) {
        return res.status(400).json({
          success: false,
          error: 'Invalid plan configuration'
        });
      }

      // Enterprise has unlimited access
      if (planName === 'Enterprise') {
        return next();
      }

      const limit = limits[limitType];
      if (limit === -1) {
        return next();
      }

      // Store limit info in request for controller use
      req.planLimit = {
        type: limitType,
        limit: limit,
        planName: planName
      };

      next();
    } catch (error) {
      console.error('Plan limit check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check plan limits'
      });
    }
  };
};

module.exports = {
  checkPlanLimits,
  PLAN_LIMITS
};
