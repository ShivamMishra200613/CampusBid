import Notification from '../models/Notification.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { unreadOnly } = req.query;
    const query = { user: req.user.id };

    if (unreadOnly === 'true') {
      query.read = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }),
      Notification.countDocuments({ user: req.user.id, read: false })
    ]);

    res.json({
      success: true,
      unreadCount,
      notifications: notifications.map((n) => n.toJSON())
    });
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found.' }
      });
    }

    notification.read = true;
    await notification.save();

    res.json({
      success: true,
      notification: notification.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { $set: { read: true } }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (err) {
    next(err);
  }
};
