const axios = require("axios");

/* ================= EMAIL SEND (MSG91) ================= */
exports.sendEmailNotification = async (employee, visitor) => {
  console.log("emp", employee);
  console.log("visitor", visitor);

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

    console.log("✅ Visitor email sent:", response.data);
  } catch (error) {
    console.error(
      "❌ Error sending visitor email:",
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
    await axios.post(
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
  } catch (err) {
    console.log("SMS send failed:", err.response?.data || err.message);
  }
};
