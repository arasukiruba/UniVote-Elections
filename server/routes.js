const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Election, Position, Candidate, Whitelist, Vote, AuditLog } = require('./models');

// Middleware
const auth = (roles) => (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).send('Access Denied');
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (roles && !roles.includes(verified.role)) return res.status(403).send('Forbidden');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send('Invalid Token');
  }
};

// --- Auth Routes ---
router.post('/auth/admin/login', async (req, res) => {
  const { email, password } = req.body;
  if(email === 'admin' && password === 'admin') {
     const token = jwt.sign({ id: 'master', role: 'MASTER' }, process.env.JWT_SECRET);
     return res.json({ token, user: { role: 'MASTER', name: 'Master' } });
  }
  const user = await User.findOne({ email });
  if (!user || !user.isActive) return res.status(400).send('Invalid');
  const validPass = await bcrypt.compare(password, user.passwordHash);
  if (!validPass) return res.status(400).send('Invalid');
  
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
  res.json({ token, user });
});

router.post('/auth/voter/register', async (req, res) => {
  const { email, password } = req.body;
  const whitelistEntry = await Whitelist.findOne({ email }); // Check globally or per election logic
  if (!whitelistEntry) return res.status(400).send('Not authorized');
  if (whitelistEntry.isRegistered) return res.status(400).send('Already registered');

  const salt = await bcrypt.genSalt(10);
  whitelistEntry.passwordHash = await bcrypt.hash(password, salt);
  whitelistEntry.passwordPlain = password; // Storing plain as requested
  whitelistEntry.isRegistered = true;
  whitelistEntry.registeredAt = new Date();
  await whitelistEntry.save();
  
  res.send('Registered');
});

// --- Master Routes ---
router.get('/master/admins', auth(['MASTER']), async (req, res) => {
  const admins = await User.find({ role: 'ADMIN' });
  res.json(admins);
});

router.post('/master/admins', auth(['MASTER']), async (req, res) => {
  const { name, email } = req.body;
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('default123', salt);
  const user = new User({ name, email, passwordHash: hash, role: 'ADMIN' });
  await user.save();
  await new AuditLog({ action: 'Create Admin', actor: 'MASTER', target: email }).save();
  res.json(user);
});

// --- Admin Election Routes ---
router.post('/admin/elections', auth(['ADMIN']), async (req, res) => {
  const election = new Election({ ...req.body, createdBy: req.user.id });
  await election.save();
  res.json(election);
});

router.get('/admin/elections', auth(['ADMIN']), async (req, res) => {
  const elections = await Election.find({ createdBy: req.user.id });
  res.json(elections);
});

router.get('/admin/elections/:id', auth(['ADMIN']), async (req, res) => {
  const election = await Election.findOne({ _id: req.params.id, createdBy: req.user.id });
  if(!election) return res.status(404).send('Not Found');
  res.json(election);
});

router.post('/admin/elections/:id/whitelist', auth(['ADMIN']), async (req, res) => {
  const { email } = req.body;
  // Ensure admin owns election
  const election = await Election.findOne({ _id: req.params.id, createdBy: req.user.id });
  if(!election) return res.status(403).send('Forbidden');

  const entry = new Whitelist({ electionId: req.params.id, email });
  await entry.save();
  res.json(entry);
});

router.get('/admin/elections/:id/results', auth(['ADMIN', 'VOTER']), async (req, res) => {
  const election = await Election.findById(req.params.id);
  // Voter access check
  if (req.user.role === 'VOTER' && election.status !== 'ANNOUNCED') return res.status(403).send();
  // Admin access check (if not voter)
  if (req.user.role === 'ADMIN' && String(election.createdBy) !== req.user.id) return res.status(403).send();
  
  // Aggregate results logic here
  res.json({ message: "Aggregation logic here" }); 
});

// --- Voter Routes ---
router.post('/voter/vote', auth(['VOTER']), async (req, res) => {
  const { electionId, selections } = req.body; // selections: { posId: candId }
  const email = req.user.email; 
  
  const whitelist = await Whitelist.findOne({ email, electionId });
  if (!whitelist || whitelist.hasVoted) return res.status(400).send('Invalid');

  const votes = Object.entries(selections).map(([posId, candId]) => ({
    electionId, positionId: posId, candidateId: candId, voterEmail: email
  }));
  
  await Vote.insertMany(votes);
  whitelist.hasVoted = true;
  await whitelist.save();
  
  res.send('Success');
});

module.exports = router;