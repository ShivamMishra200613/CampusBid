export const getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      user: req.user.toJSON()
    });
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const allowedFields = [
      'fullName',
      'phone',
      'classBranch',
      'bio',
      'avatarUrl',
      'notificationPreferences'
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        req.user[field] = req.body[field];
      }
    });

    await req.user.save();

    res.json({
      success: true,
      user: req.user.toJSON()
    });
  } catch (err) {
    next(err);
  }
};
