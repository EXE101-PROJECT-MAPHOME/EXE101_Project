const ChatSession = require('../models/ChatSession');

exports.getSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.user.id })
      .select('-messages') // Don't fetch messages for the list to save bandwidth
      .sort({ updatedAt: -1 });
    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách chat' });
  }
};

exports.getSession = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, user: req.user.id });
    if (!session) {
      return res.status(404).json({ message: 'Không tìm thấy phiên chat' });
    }
    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi lấy chi tiết chat' });
  }
};

exports.createOrUpdateSession = async (req, res) => {
  try {
    const { sessionId, title, messages } = req.body;

    let session;
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, user: req.user.id });
      if (!session) {
        return res.status(404).json({ message: 'Không tìm thấy phiên chat' });
      }
      
      if (title && title !== 'Cuộc trò chuyện mới') {
        session.title = title;
      }
      if (messages) {
        session.messages = messages;
      }
      await session.save();
    } else {
      session = new ChatSession({
        user: req.user.id,
        title: title || 'Cuộc trò chuyện mới',
        messages: messages || []
      });
      await session.save();
    }

    res.status(201).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi lưu chat' });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const session = await ChatSession.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!session) {
      return res.status(404).json({ message: 'Không tìm thấy phiên chat' });
    }
    res.json({ message: 'Xoá thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi xoá chat' });
  }
};
