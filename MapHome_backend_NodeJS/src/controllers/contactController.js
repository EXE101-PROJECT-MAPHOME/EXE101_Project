const Contact = require('../models/Contact');
const { sendEmail } = require('../utils/mailHelper');

// Submit a contact message
exports.submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const newMessage = new Contact({ name, email, subject, message });
    const savedMessage = await newMessage.save();

    // Notify Admin via Email if possible
    if (process.env.EMAIL_USER) {
      try {
        await sendEmail(
          process.env.EMAIL_USER,
          `[MapHome Support] ${subject}`,
          `
            <h3>Yêu cầu hỗ trợ mới từ MapHome</h3>
            <p><strong>Người gửi:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Tiêu đề:</strong> ${subject}</p>
            <p><strong>Nội dung:</strong></p>
            <div style="padding: 15px; background: #f5f5f5; border-radius: 5px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          `
        );
      } catch (mailErr) {
        console.error("Failed to notify admin via email:", mailErr);
        // Don't fail the request if only email notification fails
      }
    }

    res.status(201).json({ message: 'Message sent successfully', data: savedMessage });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all messages (Admin only)
exports.getMessages = async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a message (Admin only)
exports.deleteMessage = async (req, res) => {
  try {
    const deletedMessage = await Contact.findByIdAndDelete(req.params.id);
    if (!deletedMessage) return res.status(404).json({ message: 'Message not found' });
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reply to a message (mark as responded) (Admin only)
exports.replyContact = async (req, res) => {
  try {
    const message = await Contact.findByIdAndUpdate(
      req.params.id,
      { status: 'responded' },
      { new: true }
    );
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json({ message: 'Message marked as responded', data: message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
