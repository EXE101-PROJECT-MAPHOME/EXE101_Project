const nodemailer = require("nodemailer");

/**
 * Send an email using nodemailer
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 */
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App Password from Google
      },
    });

    const mailOptions = {
      from: `"MapHome Team" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

/**
 * Generate a MapHome branded HTML template for new password
 * @param {string} username - User's name
 * @param {string} newPassword - The generated password
 */
const getNewPasswordTemplate = (username, newPassword) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mật khẩu mới từ MapHome</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          color: #334155;
          background: linear-gradient(135deg, #f0f9ff 0%, #f0fdf4 100%);
          padding: 20px;
        }
        .email-wrapper {
          max-width: 650px;
          margin: 0 auto;
        }
        .email-container {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #059669 0%, #0891b2 50%, #2563eb 100%);
          padding: 60px 30px;
          text-align: center;
          color: white;
          position: relative;
          overflow: hidden;
        }
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: float 20s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }
        .header-content {
          position: relative;
          z-index: 1;
        }
        .logo-box {
          display: inline-block;
          width: 70px;
          height: 70px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          font-size: 40px;
        }
        .header h1 {
          font-size: 36px;
          font-weight: 900;
          margin: 0 0 8px 0;
          letter-spacing: -1px;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }
        .header p {
          font-size: 16px;
          opacity: 0.95;
          margin: 0;
          font-weight: 500;
        }
        .content {
          padding: 50px 40px;
        }
        .greeting {
          font-size: 24px;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 20px;
          background: linear-gradient(135deg, #059669 0%, #2563eb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .description {
          font-size: 15px;
          color: #475569;
          line-height: 1.8;
          margin-bottom: 35px;
        }
        .section-title {
          font-size: 14px;
          font-weight: 800;
          color: #059669;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 30px 0 20px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .icon-dot {
          width: 8px;
          height: 8px;
          background: linear-gradient(135deg, #059669 0%, #2563eb 100%);
          border-radius: 50%;
        }
        .password-card {
          background: linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 100%);
          border: 2px solid #10b981;
          border-radius: 12px;
          padding: 30px;
          text-align: center;
          margin: 25px 0;
          position: relative;
          overflow: hidden;
        }
        .password-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #059669 0%, #0891b2 50%, #2563eb 100%);
        }
        .password-label {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 12px;
          font-weight: 700;
        }
        .password-value {
          font-family: 'Courier New', 'Monaco', monospace;
          font-size: 36px;
          font-weight: 900;
          color: #059669;
          letter-spacing: 4px;
          word-spacing: 8px;
          user-select: all;
          padding: 15px;
          background: white;
          border-radius: 8px;
          border: 1px dashed #10b981;
        }
        .password-note {
          font-size: 12px;
          color: #64748b;
          margin-top: 12px;
          font-style: italic;
        }
        .steps {
          background: #f8fafc;
          border-left: 4px solid #10b981;
          border-radius: 8px;
          padding: 25px;
          margin: 30px 0;
        }
        .steps h4 {
          font-size: 14px;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .steps ol {
          list-style: none;
          counter-reset: step-counter;
        }
        .steps li {
          margin-bottom: 15px;
          display: flex;
          gap: 15px;
          counter-increment: step-counter;
        }
        .steps li::before {
          content: counter(step-counter);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #059669 0%, #2563eb 100%);
          color: white;
          border-radius: 50%;
          font-weight: 800;
          font-size: 14px;
          flex-shrink: 0;
        }
        .steps li span {
          font-size: 14px;
          color: #475569;
          line-height: 1.6;
          padding-top: 5px;
        }
        .cta-button {
          display: inline-block;
          padding: 16px 40px;
          background: linear-gradient(135deg, #059669 0%, #2563eb 100%);
          color: white !important;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 800;
          font-size: 15px;
          margin: 30px 0;
          box-shadow: 0 8px 20px rgba(5, 150, 105, 0.3);
          transition: transform 0.2s, box-shadow 0.2s;
          display: inline-block;
          width: 100%;
          text-align: center;
          border: none;
          cursor: pointer;
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(5, 150, 105, 0.4);
        }
        .security-tips {
          background: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 12px;
          padding: 20px;
          margin: 30px 0;
          border-left: 4px solid #f59e0b;
        }
        .security-tips h5 {
          font-size: 13px;
          font-weight: 800;
          color: #92400e;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .security-tips ul {
          list-style: none;
          font-size: 13px;
          color: #78350f;
          line-height: 1.8;
        }
        .security-tips li {
          margin-bottom: 8px;
          display: flex;
          gap: 8px;
        }
        .security-tips li::before {
          content: '✓';
          font-weight: bold;
          color: #f59e0b;
          flex-shrink: 0;
        }
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
          margin: 40px 0;
        }
        .footer {
          background: #f8fafc;
          padding: 40px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        .footer-text {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 15px;
          line-height: 1.8;
        }
        .footer-links {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 15px;
          font-size: 12px;
        }
        .footer-links a {
          color: #059669;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }
        .footer-links a:hover {
          color: #2563eb;
        }
        .copyright {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          font-size: 12px;
          color: #94a3b8;
        }
        @media only screen and (max-width: 600px) {
          .content {
            padding: 30px 20px;
          }
          .header {
            padding: 40px 20px;
          }
          .header h1 {
            font-size: 28px;
          }
          .greeting {
            font-size: 20px;
          }
          .password-value {
            font-size: 24px;
            letter-spacing: 2px;
          }
          .footer-links {
            flex-direction: column;
            gap: 10px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="email-container">
          <!-- Header -->
          <div class="header">
            <div class="header-content">
              <div class="logo-box">🏠</div>
              <h1>MapHome</h1>
              <p>Tìm đúng trọ - Ở đúng nơi</p>
            </div>
          </div>

          <!-- Main Content -->
          <div class="content">
            <div class="greeting">Xin chào, ${username}!</div>
            
            <div class="description">
              Chúng tôi đã nhận được yêu cầu khôi phục mật khẩu của bạn. Để giúp bạn nhanh chóng trở lại sử dụng MapHome, chúng tôi đã tạo một mật khẩu tạm thời cho bạn.
            </div>

            <!-- Password Section -->
            <div class="section-title">
              <span class="icon-dot"></span>
              Mật khẩu tạm thời của bạn
            </div>
            
            <div class="password-card">
              <div class="password-label">🔐 Mật khẩu mới</div>
              <div class="password-value">${newPassword}</div>
              <div class="password-note">Nhấn Ctrl+C để sao chép mật khẩu</div>
            </div>

            <!-- Steps -->
            <div class="section-title">
              <span class="icon-dot"></span>
              Các bước tiếp theo
            </div>

            <div class="steps">
              <h4>Làm theo các bước này:</h4>
              <ol>
                <li>
                  <span><strong>Đăng nhập</strong> vào tài khoản MapHome bằng mật khẩu tạm thời ở trên</span>
                </li>
                <li>
                  <span>Vào <strong>Cài đặt > Bảo mật > Đổi mật khẩu</strong> để tạo mật khẩu mới riêng của bạn</span>
                </li>
                <li>
                  <span>Chọn một mật khẩu <strong>mạnh</strong> và <strong>khó đoán</strong></span>
                </li>
                <li>
                  <span>Lưu mật khẩu mới của bạn ở nơi an toàn</span>
                </li>
              </ol>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login" class="cta-button">
                ✨ Đăng nhập ngay
              </a>
            </div>

            <!-- Security Tips -->
            <div class="security-tips">
              <h5>🛡️ Mẹo bảo mật</h5>
              <ul>
                <li>Mật khẩu tạm thời này <strong>chỉ sử dụng một lần</strong></li>
                <li>Hãy <strong>thay đổi mật khẩu</strong> ngay sau khi đăng nhập</li>
                <li><strong>Không chia sẻ</strong> mật khẩu này với bất kỳ ai</li>
                <li>MapHome sẽ <strong>không bao giờ</strong> yêu cầu bạn tiết lộ mật khẩu qua email</li>
              </ul>
            </div>

            <div class="divider"></div>

            <!-- Additional Support -->
            <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; text-align: center;">
              <p style="font-size: 14px; color: #404040; margin: 0;">
                <strong>Gặp vấn đề?</strong><br>
                Nếu bạn không thực hiện yêu cầu khôi phục mật khẩu này, vui lòng <strong>bỏ qua email này</strong>. Tài khoản của bạn vẫn an toàn.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="footer-text">
              Đây là email tự động từ MapHome. Vui lòng không trả lời email này.
            </div>
            
            <div class="footer-links">
              <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/">Về MapHome</a>
              <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/contact">Liên hệ</a>
              <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/policy">Chính sách</a>
            </div>

            <div class="copyright">
              © 2024-2026 MapHome Project. Tất cả quyền được bảo lưu.<br>
              Đây là một dự án giáo dục. Bất kỳ liên lạc không xác thực nào xin vui lòng báo cáo.
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  sendEmail,
  getNewPasswordTemplate,
};
