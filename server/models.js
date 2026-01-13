const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// User Schema
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String }, // Only for admins. Voters use Whitelist logic.
  role: { type: String, enum: ['MASTER', 'ADMIN', 'VOTER'], default: 'ADMIN' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Election Schema
const electionSchema = new Schema({
  title: { type: String, required: true },
  pollingDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['NOT_STARTED', 'CAMPAIGN', 'LIVE', 'COMPLETED', 'ANNOUNCED'], 
    default: 'NOT_STARTED' 
  },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

// Position Schema
const positionSchema = new Schema({
  electionId: { type: Schema.Types.ObjectId, ref: 'Election', required: true },
  title: { type: String, required: true },
  orderIndex: { type: Number, default: 0 }
});

// Candidate Schema
const candidateSchema = new Schema({
  electionId: { type: Schema.Types.ObjectId, ref: 'Election', required: true },
  positionId: { type: Schema.Types.ObjectId, ref: 'Position', required: true },
  fullName: { type: String, required: true },
  slogan: String,
  imageUrl: String,
  description: String,
  orderIndex: { type: Number, default: 0 }
});

// Whitelist Schema (Authorized Voters)
const whitelistSchema = new Schema({
  electionId: { type: Schema.Types.ObjectId, ref: 'Election', required: true },
  email: { type: String, required: true },
  isRegistered: { type: Boolean, default: false },
  passwordHash: { type: String }, 
  passwordPlain: { type: String }, // REQUIREMENT: Admin needs to see this.
  hasVoted: { type: Boolean, default: false },
  registeredAt: Date
});

// Vote Schema
const voteSchema = new Schema({
  electionId: { type: Schema.Types.ObjectId, ref: 'Election', required: true },
  positionId: { type: Schema.Types.ObjectId, ref: 'Position', required: true },
  candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
  voterEmail: { type: String }, // For audit if needed, though usually anonymous
  timestamp: { type: Date, default: Date.now }
});

// Audit Log
const auditLogSchema = new Schema({
  action: String,
  actor: String,
  target: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = {
  User: mongoose.model('User', userSchema),
  Election: mongoose.model('Election', electionSchema),
  Position: mongoose.model('Position', positionSchema),
  Candidate: mongoose.model('Candidate', candidateSchema),
  Whitelist: mongoose.model('Whitelist', whitelistSchema),
  Vote: mongoose.model('Vote', voteSchema),
  AuditLog: mongoose.model('AuditLog', auditLogSchema)
};