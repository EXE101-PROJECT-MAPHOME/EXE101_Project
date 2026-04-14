const SystemSetting = require("../models/SystemSetting");

// @desc    Get system settings
// @route   GET /api/admin/settings
const getSettings = async (req, res) => {
  try {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = await SystemSetting.create({});
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update system settings
// @route   PUT /api/admin/settings
const updateSettings = async (req, res) => {
  try {
    const {
      siteName,
      contactPhone,
      contactEmail,
      maintenanceMode,
      pricing,
      broadcastMessage,
      isBroadcastEnabled,
      banners,
      seo,
      policies,
      automation,
    } = req.body;

    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = new SystemSetting();
    }

    if (siteName !== undefined) settings.siteName = siteName;
    if (contactPhone !== undefined) settings.contactPhone = contactPhone;
    if (contactEmail !== undefined) settings.contactEmail = contactEmail;
    if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
    if (pricing !== undefined) settings.pricing = pricing;
    if (broadcastMessage !== undefined) settings.broadcastMessage = broadcastMessage;
    if (isBroadcastEnabled !== undefined) settings.isBroadcastEnabled = isBroadcastEnabled;
    if (banners !== undefined) settings.banners = banners;
    if (seo !== undefined) settings.seo = seo;
    if (policies !== undefined) settings.policies = policies;
    if (automation !== undefined) settings.automation = automation;

    settings.updatedBy = req.user?._id;
    await settings.save();

    res.status(200).json({
      message: "System settings updated successfully",
      settings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
