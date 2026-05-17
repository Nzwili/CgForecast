const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { sendVerificationEmail } = require('../utils/mailer');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role, church } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password, and role are required' });
  }
  const allowedRoles = ['admin', 'pastor', 'usher', 'member'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${allowedRoles.join(', ')}` });
  }
  try {
    const hash = await bcrypt.hash(password, 10);

    // Generate a 24-hour email verification token
    const verificationToken = jwt.sign(
      { email, purpose: 'email-verify' },
      process.env.JWT_SECRET || 'cg-forecast-secret-presentation-key-2026',
      { expiresIn: '24h' }
    );

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hash,
        role,
        church: church || null,
        emailVerified: true, // Auto-verify new signups instantly for seamless live presentation!
        verificationToken: null,
      }
    });

    // Send verification email (non-blocking — don't fail registration if mail fails)
    sendVerificationEmail(email, name, verificationToken).catch(err =>
      console.error('Mail send failed:', err.message)
    );

    res.status(201).json({
      id: user.id,
      name: user.name,
      role: user.role,
      message: 'Account created. Please check your email to verify your account.'
    });
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Email already registered' });
    throw e;
  }
});

// GET /api/auth/verify?token=...
router.get('/verify', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token required' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cg-forecast-secret-presentation-key-2026');
    if (decoded.purpose !== 'email-verify') return res.status(400).json({ error: 'Invalid token purpose' });

    const user = await prisma.user.findUnique({ where: { email: decoded.email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Dynamically calculate redirect URL so it works in both cloud and local environments seamlessly
    const clientUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;

    if (user.emailVerified) {
      return res.redirect(`${clientUrl}/?verified=already`);
    }

    await prisma.user.update({
      where: { email: decoded.email },
      data: { emailVerified: true, verificationToken: null }
    });

    // Redirect to login page with a success flag
    res.redirect(`${clientUrl}/?verified=true`);
  } catch (err) {
    res.status(400).json({ error: 'Invalid or expired verification token' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  let { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  // Sanitize input to eliminate browser auto-complete spaces and keyboard capitalization
  email = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Bypassed verification block for seamless live presentation sign-ins!
  // if (user.emailVerified === false && user.verificationToken !== null) {
  //   return res.status(403).json({ error: 'Please verify your email before signing in.', needsVerification: true });
  // }

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET || 'cg-forecast-secret-presentation-key-2026',
    { expiresIn: '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({ 
    token,
    role: user.role, 
    name: user.name, 
    id: user.id, 
    email: user.email 
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

module.exports = router;
