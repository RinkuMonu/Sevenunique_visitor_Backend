const express = require("express");
const router = express.Router();
const auth = require("../midleware/authMiddleware");
const User = require("../models/Users");
const Visitor = require("../models/Visitors");

/*
================================================
ADMIN DASHBOARD COUNTS (MVP)
GET /api/admin/dashboard/counts
================================================
*/
router.get("/counts", auth, async (req, res) => {
  try {

    /* ======================
       USER COUNTS (ALL TIME)
    ====================== */
    const [
      totalUsers,
      adminUsers,
      receptionUsers,
      securityUsers,
      employeeUsers,
      activeUsers,
      deactivatedUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "ADMIN" }),
      User.countDocuments({ role: "RECEPTION" }),
      User.countDocuments({ role: "SECURITY" }),
      User.countDocuments({ role: "EMPLOYEE" }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
    ]);

    /* ======================
       ALL TIME VISITOR COUNTS
    ====================== */
    const [
      totalVisitorsAll,
      completedAll,
      waitingAll,
      inMeetingAll
    ] = await Promise.all([
      Visitor.countDocuments(),
      Visitor.countDocuments({ status: "COMPLETED" }),
      Visitor.countDocuments({ status: "WAITING" }),
      Visitor.countDocuments({ status: "IN_MEETING" }),
    ]);

    /* ======================
       TODAY FILTER
    ====================== */
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    /* ======================
       TODAY VISITOR COUNTS
    ====================== */
    const [
      totalVisitorsToday,
      completedToday,
      waitingToday,
      inMeetingToday
    ] = await Promise.all([
      Visitor.countDocuments({ createdAt: { $gte: today } }),
      Visitor.countDocuments({ status: "COMPLETED", createdAt: { $gte: today } }),
      Visitor.countDocuments({ status: "WAITING", createdAt: { $gte: today } }),
      Visitor.countDocuments({ status: "IN_MEETING", createdAt: { $gte: today } }),
    ]);

    /* ======================
       ALL VISITOR LIST (with employee details)
    ====================== */
    const allVisitors = await Visitor.find()
      .populate("employeeToMeet", "name email role")
      .sort({ createdAt: -1 });

    /* ======================
       TODAY VISITOR LIST
    ====================== */
    const todayVisitors = await Visitor.find({
      createdAt: { $gte: today }
    })
      .populate("employeeToMeet", "name email role")
      .sort({ createdAt: -1 });

    /* ======================
       RESPONSE
    ====================== */
    res.json({
      users: {
        total: totalUsers,
        roles: {
          admin: adminUsers,
          reception: receptionUsers,
          security: securityUsers,
          employee: employeeUsers,
        },
        active: activeUsers,
        deactivated: deactivatedUsers,
      },

      visitors: {

        allTime: {
          total: totalVisitorsAll,
          completed: completedAll,
          waiting: waitingAll,
          inMeeting: inMeetingAll,
          list: allVisitors
        },

        today: {
          total: totalVisitorsToday,
          completed: completedToday,
          waiting: waitingToday,
          inMeeting: inMeetingToday,
          list: todayVisitors
        }

      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});



module.exports = router;