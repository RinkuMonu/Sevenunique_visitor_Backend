const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema(
  {
    name: String,
    mobile: String,
    email: String,
    company: String,
    purpose: String,
    visitorIdNumber: String,
    visitorIdPhoto: {
      type: String,
      required: true,
    },
    employeeToMeet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    photo: String,      // S3 / URL
    idProof: String,    // S3 / URL

    visitDateTime: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ["WAITING", "IN_MEETING", "COMPLETED"],
      default: "WAITING",
    },

    inTime: { type: Date, default: Date.now },
    outTime: Date,

    meetingStartTime: Date,
    meetingEndTime: Date,
    meetingDuration: String, // e.g. "1h 25m"

  },
  { timestamps: true }
);

module.exports = mongoose.model("Visitor", visitorSchema);