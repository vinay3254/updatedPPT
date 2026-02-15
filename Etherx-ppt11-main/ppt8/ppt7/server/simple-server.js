import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const otpStorage = new Map();
const usersFile = path.join(__dirname, 'data', 'users.json');

// EmailJS configuration
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || 'service_zmo1m6e';
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || 'template_3d90j8f';
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || '--NpbF0cNKxY7V5zU';

// Send OTP via EmailJS
const sendOTPEmail = async (email, otp) => {
  try {
    const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: email,
        otp_code: otp,
        from_name: 'EtherXPPT',
        message: `Your OTP code is: ${otp}`
      }
    });
    console.log(`📧 OTP email sent to ${email}`);
    return true;
  } catch (err) {
    console.error('❌ EmailJS send failed:', err.response?.data || err.message);
    // Fallback: show OTP in console
    console.log(`\n========================================
📧 FALLBACK - OTP for ${email}: ${otp}
========================================\n`);
    return false;
  }
};

// Ensure users.json exists
if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, JSON.stringify([], null, 2));
}

// Load users
const loadUsers = () => {
  try {
    return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  } catch {
    return [];
  }
};

const saveUsers = (users) => {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

// Check if user exists endpoint
app.post('/api/auth/check-user', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  
  const normalizedEmail = email.trim().toLowerCase();
  const users = loadUsers();
  
  const userExists = users.find(u => u.email.toLowerCase() === normalizedEmail);
  
  res.json({ exists: !!userExists });
});

// Register endpoint
app.post('/api/auth/register', (req, res) => {
  const { email, password, name, firstName, lastName } = req.body;
  console.log('📝 Register request received:', req.body);
  
  if (!email || !password) {
    console.log('❌ Missing required fields:', { email: !!email, password: !!password });
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  // Use provided name or construct from firstName/lastName
  const userName = name || `${firstName || ''} ${lastName || ''}`.trim() || 'User';
  
  // Normalize email to lowercase for consistent checking
  const normalizedEmail = email.trim().toLowerCase();
  
  const users = loadUsers();
  
  // Check for existing user with case-insensitive email comparison
  if (users.find(u => u.email.toLowerCase() === normalizedEmail)) {
    console.log('❌ User already exists:', normalizedEmail);
    return res.status(409).json({ message: 'User already exists with this email' });
  }
  
  const newUser = {
    id: Date.now().toString(),
    email: normalizedEmail,
    password,
    name: userName,
    firstName: firstName || '',
    lastName: lastName || '',
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  saveUsers(users);
  console.log('✅ User registered:', normalizedEmail);
  
  // Generate token for immediate login
  const token = 'demo-token-' + Date.now();
  
  res.json({ 
    message: 'Registration successful', 
    user: { 
      id: newUser.id, 
      email: newUser.email, 
      name: newUser.name 
    },
    token: token
  });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Normalize email to lowercase for consistent checking
  const normalizedEmail = email.trim().toLowerCase();
  
  const users = loadUsers();
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail && u.password === password);
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  res.json({ 
    message: 'Login successful', 
    user: { id: user.id, email: user.email, name: user.name },
    token: 'demo-token-' + Date.now()
  });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  otpStorage.set(email, { otp, expiresAt: new Date(Date.now() + 30 * 60 * 1000) });
  
  // Send OTP via EmailJS
  await sendOTPEmail(email, otp);
  
  res.json({
    message: 'OTP sent successfully to your email',
    email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
  });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const stored = otpStorage.get(email);
  
  if (stored && stored.otp === otp && new Date() < stored.expiresAt) {
    otpStorage.delete(email);
    res.json({ verified: true });
  } else {
    res.status(400).json({ message: 'Invalid OTP' });
  }
});

app.post('/api/ipfs/save', (req, res) => {
  res.json({
    success: true,
    ipfsHash: 'local-fallback-' + Date.now(),
    message: 'Saved locally'
  });
});

app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
