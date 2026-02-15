import emailjs from '@emailjs/browser';
import api from '../utils/api';

class OTPService {
  // EmailJS configuration - replace with your actual values
  SERVICE_ID = 'service_zmo1m6e';
  TEMPLATE_ID = 'template_3d90j8f';
  PUBLIC_KEY = '--NpbF0cNKxY7V5zU';

  // Generate OTP code
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP via EmailJS from client side
  async sendOTP(email) {
    try {
      // Generate OTP
      const otp = this.generateOTP();
      
      // Store OTP locally for verification
      localStorage.setItem(`otp_${email}`, otp);
      localStorage.setItem(`otp_expires_${email}`, Date.now() + 30 * 60 * 1000); // 30 minutes
      
      // Send via EmailJS
      await emailjs.send(
        this.SERVICE_ID,
        this.TEMPLATE_ID,
        {
          to_email: email,
          otp_code: otp,
          from_name: 'EtherXPPT',
          message: `Your OTP code is: ${otp}`
        },
        this.PUBLIC_KEY
      );
      
      console.log('📧 OTP sent via EmailJS to:', email);
      return { success: true, message: 'OTP sent successfully to your email' };
    } catch (err) {
      console.error('EmailJS send error', err);
      
      // Fallback: show OTP in console for development
      const otp = this.generateOTP();
      localStorage.setItem(`otp_${email}`, otp);
      localStorage.setItem(`otp_expires_${email}`, Date.now() + 30 * 60 * 1000);
      
      console.log(`\n========================================
📧 DEVELOPMENT MODE - OTP for ${email}: ${otp}
========================================\n`);
      
      return { success: true, message: 'OTP sent (check console in dev mode)', devMode: true };
    }
  }

  // Verify OTP from local storage
  async verifyOTP(otp, email) {
    try {
      const storedOTP = localStorage.getItem(`otp_${email}`);
      const expiresAt = localStorage.getItem(`otp_expires_${email}`);
      
      if (!storedOTP || !expiresAt) {
        return { valid: false, message: 'OTP expired or not requested' };
      }
      
      if (Date.now() > parseInt(expiresAt)) {
        localStorage.removeItem(`otp_${email}`);
        localStorage.removeItem(`otp_expires_${email}`);
        return { valid: false, message: 'OTP expired' };
      }
      
      if (storedOTP === otp) {
        localStorage.removeItem(`otp_${email}`);
        localStorage.removeItem(`otp_expires_${email}`);
        return { valid: true, message: 'OTP verified successfully' };
      }
      
      return { valid: false, message: 'Invalid OTP' };
    } catch (err) {
      console.error('verifyOTP error', err);
      return { valid: false, message: 'Verification failed' };
    }
  }
}

export default new OTPService();
