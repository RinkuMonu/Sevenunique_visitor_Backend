const axios = require("axios");

/* ================= EMAIL SEND (MSG91) ================= */
exports.sendEmailNotification = async (employee, visitor) => {
  // console.log("emp", employee);
  // console.log("visitor", visitor);

  const imageUrl = `${process.env.BASE_URL}${visitor.photo}`;

  console.log("iamgeee", imageUrl);

  const payload = {
    recipients: [
      {
        to: [
          {
            name: employee?.name || "Employee",
            email: employee?.email,
          },
        ],
        variables: {
          Host_Name: employee?.name || "",
          // companyName: visitor?.company || "N/A",
          // Entry_Time: new Date(visitor?.inTime).toLocaleString(),
          Entry_Time: new Date(visitor?.visitDateTime).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          }),

          Year: new Date().getFullYear(),
          Visitor_Name: visitor?.name || "",
          Visitor_Mobile: visitor?.mobile || "",
          Purpose: visitor?.purpose || "Meeting",
          Visitor_Image: imageUrl,

        },
      },
    ],
    from: {
      name: "Sevenunique tech solutions Private Limited",
      email: "info@sevenunique.com",
    },
    domain: "mail.sevenunique.com",
    template_id: process.env.MSG91_EMAIL_TEMPLATE_ID,
  };

  try {
    const response = await axios.post(
      "https://control.msg91.com/api/v5/email/send",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          authkey: process.env.MSG91_AUTH_KEY,
        },
      }
    );

    // console.log("✅ Visitor email sent:", response.data);
  } catch (error) {
    console.error(
      "❌ Error sending visitor email:",
      error.response?.data || error.message
    );
  }
};


exports.sendThanksEmailNotification = async (visitor, employee) => {
  try {
    // console.log("visitor", visitor);

    /* ================= IMAGE ================= */

    const imageUrl = visitor?.photo
      ? `${process.env.BASE_URL}${visitor.photo}`
      : `${process.env.BASE_URL}/default-user.png`;

    /* ================= DATE FORMATTERS ================= */

    const format = (date) =>
      date
        ? new Date(date).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        : "";

    const meetingDate = visitor?.visitDateTime
      ? new Date(visitor.visitDateTime).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      : "";

    const meetingStart = format(visitor?.meetingStartTime || visitor?.inTime);
    const meetingEnd = format(visitor?.meetingEndTime);

    /* ================= DURATION CALC ================= */

    let duration = "";

    if (visitor?.meetingStartTime && visitor?.meetingEndTime) {
      const diffMs =
        new Date(visitor.meetingEndTime) -
        new Date(visitor.meetingStartTime);

      const minutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      duration =
        hours > 0
          ? `${hours}h ${remainingMinutes}m`
          : `${remainingMinutes} minutes`;
    }

    /* ================= PAYLOAD ================= */

    const payload = {
      recipients: [
        {
          to: [
            {
              name: visitor?.name || "Visitor",
              email: visitor?.email,
            },
          ],

          variables: {
            Visitor_Name: visitor?.name || "",
            Host_Name: employee?.name || "",
            Purpose: visitor?.purpose || "Meeting",

            Meeting_Date: meetingDate,
            Meeting_Start: meetingStart,
            Meeting_End: meetingEnd,
            Meeting_Duration: duration,

            Visitor_Image: imageUrl,

            companyName: "Sevenunique Tech Solutions",
            Year: new Date().getFullYear(),
          },
        },
      ],

      from: {
        name: "Sevenunique Tech Solutions Pvt. Ltd.",
        email: "info@sevenunique.com",
      },

      domain: "mail.sevenunique.com",

      template_id: process.env.MSG91_EMAIL_TEMPLATE_ID_THANKYOU,
    };

    /* ================= API CALL ================= */

    const response = await axios.post(
      "https://control.msg91.com/api/v5/email/send",
      payload,
      {
        headers: {
          authkey: process.env.MSG91_AUTH_KEY,
          "Content-Type": "application/json",
          accept: "application/json",
        },
      }
    );

    // console.log("✅ Thank you email sent:", response.data);
  } catch (error) {
    console.error(
      "❌ Error sending thank you email:",
      error.response?.data || error.message
    );
  }
};





/* ================= THANK YOU SMS TO VISITOR ================= */
exports.sendVisitorThankYouSMS = async (visitor) => {
  try {
    await axios.post(
      "https://control.msg91.com/api/v5/flow/",
      {
        template_id: process.env.MSG91_VISITOR_THANKYOU_TEMPLATE_ID,
        short_url: "0",
        recipients: [
          {
            mobiles: visitor.mobile,
            VAR1: visitor.name,
            VAR2: "Sevenunique Tech Solutions",
            VAR3: process.env.APP_REVIEW_LINK
          },
        ],
      },
      {
        headers: {
          authkey: process.env.MSG91_AUTH_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Thank you SMS sent to visitor");
  } catch (err) {
    console.log("❌ Thank you SMS failed:", err.response?.data || err.message);
  }
};


/* ================= SMS SEND (MSG91) ================= */
exports.sendSMSNotification = async (employee, visitor) => {
  try {
    const ressss = await axios.post(
      "https://control.msg91.com/api/v5/flow/",
      {
        template_id: process.env.MSG91_SMS_TEMPLATE_ID,
        short_url: "0",
        recipients: [
          {
            mobiles: employee.phone,
            VAR1: employee.name,
            VAR2: visitor.name,
          },
        ],
      },
      {
        headers: {
          authkey: process.env.MSG91_AUTH_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("resssssss smsss", ressss.data)
  } catch (err) {
    console.log("SMS send failed:", err.response?.data || err.message);
  }
};
