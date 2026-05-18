const Notification = require("../models/Notification");
const catchAsync = require("../utils/catchAsync");

exports.getNotifications = catchAsync(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ success: true, notifications });
});

exports.markRead = catchAsync(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, _id: { $in: req.body.ids || [] } },
    { read: true }
  );
  if (req.params.id) {
    await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true });
  }
  res.json({ success: true });
});

exports.markAllRead = catchAsync(async (req, res) => {
  await Notification.updateMany({ user: req.user._id }, { read: true });
  res.json({ success: true });
});
