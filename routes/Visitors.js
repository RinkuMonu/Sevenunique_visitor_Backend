const express = require("express");
const Visitor = require("../models/Visitors");
const User = require("../models/Users");
const auth = require("../midleware/authMiddleware");
const upload = require("../midleware/uploadMiddleware");

const {
  sendEmailNotification,
  sendSMSNotification,
  sendVisitorThankYouSMS
} = require("../services/notificationService");



const router = express.Router();

/* ================= ROLE CHECK ================= */
const onlyReception = (req, res, next) => {
  if (req.user.role !== "RECEPTION") {
    return res.status(403).json({ message: "Only reception allowed" });
  }
  next();
};

/* =================================================
   ➕ CREATE VISITOR (WITH PHOTO UPLOAD)
================================================= */
// router.post(
//   "/",
//   // auth,
//   // onlyReception,
//   upload.single("photo"),
//   async (req, res) => {
//     try {
//       const employee = await User.findById(req.body.employeeToMeet);
//       if (!employee)
//         return res.status(404).json({ message: "Employee not found" });

//       const visitor = await Visitor.create({
//         ...req.body,
//         photo: req.file ? `/uploads/visitors/${req.file.filename}` : null,
//         status: "WAITING",
//         inTime: new Date(),
//       });

//       /* ================= NOTIFICATIONS ================= */

//       await sendEmailNotification(employee, visitor);
//       await sendSMSNotification(employee, visitor);

//       res.status(201).json(visitor);
//     } catch (err) {
//       res.status(500).json({ message: "Server error" });
//     }
//   }
// );



router.post(
  "/",
  upload.single("photo"),
  async (req, res) => {
    try {
      const employee = await User.findById(req.body.employeeToMeet);
      if (!employee)
        return res.status(404).json({ message: "Employee not found" });

      const visitor = await Visitor.create({
        ...req.body,
        visitDateTime: new Date(req.body.visitDateTime), // ✅ NEW
        photo: req.file ? `/uploads/visitors/${req.file.filename}` : null,
        status: "WAITING",
        inTime: new Date(),
      });

      await sendEmailNotification(employee, visitor);
      await sendSMSNotification(employee, visitor);

      res.status(201).json(visitor);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);


/* =================================================
   🔍 GET VISITOR BY ID
================================================= */
router.get("/:id", auth, async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id)
      .populate("employeeToMeet", "name email phone");

    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    res.json(visitor);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


/* =================================================
   ✏ UPDATE VISITOR
================================================= */
router.put("/:id", auth, upload.single("photo"), async (req, res) => {
  try {
    const updateData = {
      ...req.body,
    };

    if (req.body.visitDateTime) {
      updateData.visitDateTime = new Date(req.body.visitDateTime);
    }

    if (req.file) {
      updateData.photo = `/uploads/visitors/${req.file.filename}`;
    }

    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    res.json(visitor);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});



/* =================================================
   📋 GET ALL VISITORS
================================================= */
router.get("/", auth, async (req, res) => {
  const visitors = await Visitor.find()
    .populate("employeeToMeet", "name email phone")
    .sort({ createdAt: -1 });

  res.json(visitors);
});

/* =================================================
   📅 TODAY VISITORS
================================================= */
router.get("/today", auth, async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const visitors = await Visitor.find({
    createdAt: { $gte: today },
  })
    .populate("employeeToMeet", "name email phone")
    .sort({ createdAt: -1 });

  res.json(visitors);
});

/* =================================================
   🔁 UPDATE STATUS
================================================= */
// router.put("/:id/status", auth, async (req, res) => {
//   const allowedStatus = ["WAITING", "IN_MEETING", "COMPLETED"];
//   if (!allowedStatus.includes(req.body.status)) {
//     return res.status(400).json({ message: "Invalid status" });
//   }

//   const visitor = await Visitor.findByIdAndUpdate(
//     req.params.id,
//     { status: req.body.status },
//     { new: true }
//   );

//   res.json(visitor);
// });


router.put("/:id/status", auth, async (req, res) => {
  try {
    const allowedStatus = ["WAITING", "IN_MEETING", "COMPLETED"];
    if (!allowedStatus.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    // ✅ When meeting starts
    if (req.body.status === "IN_MEETING") {
      visitor.meetingStartTime = new Date();
    }

    // ✅ When meeting completes
    if (req.body.status === "COMPLETED") {
      visitor.meetingEndTime = new Date();
      visitor.outTime = new Date();

      if (visitor.meetingStartTime) {
        const diffMs =
          visitor.meetingEndTime - visitor.meetingStartTime;

        const minutes = Math.floor(diffMs / 60000);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        visitor.meetingDuration =
          hours > 0
            ? `${hours}h ${remainingMinutes}m`
            : `${remainingMinutes}m`;
      }

        await sendVisitorThankYouSMS(visitor);

    }

    visitor.status = req.body.status;
    await visitor.save();

    res.json(visitor);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});



/* =================================================
   🚪 EXIT VISITOR
================================================= */
router.put("/:id/exit", auth, async (req, res) => {
  const visitor = await Visitor.findByIdAndUpdate(
    req.params.id,
    {
      outTime: new Date(),
      status: "COMPLETED",
    },
    { new: true }
  );

  res.json({ message: "Visitor exit marked", visitor });
});

/* =================================================
   ❌ DELETE VISITOR
================================================= */
router.delete("/:id", auth, async (req, res) => {
  await Visitor.findByIdAndDelete(req.params.id);
  res.json({ message: "Visitor deleted" });
});

module.exports = router;
