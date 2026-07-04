

/**
 * Sends SMS via eSMS.vn API
 * @param {string} phone - Target phone number
 * @param {string} message - Message content
 */
const sendSMS = async (phone, message) => {
  try {
    // Normalize phone number to 0xxxxxxxxx format for eSMS
    let formattedPhone = phone;
    if (phone.startsWith("+84")) {
      formattedPhone = "0" + phone.substring(3);
    } else if (!phone.startsWith("0")) {
      formattedPhone = "0" + phone;
    }

    const apiKey = process.env.ESMS_API_KEY;
    const secretKey = process.env.ESMS_SECRET_KEY;
    const envBrandname = process.env.ESMS_BRANDNAME;

    // Fallback for development/demo
    if (!apiKey || !secretKey) {
      console.log("=========================================");
      console.log("SMS SIMULATION (eSMS credentials missing)");
      console.log(`TO: ${formattedPhone}`);
      console.log(`BODY: ${message}`);
      console.log("=========================================");
      return { CodeResult: "100", simulated: true };
    }

    // List of configurations to try automatically
    const configsToTry = [];

    // First priority: Try with configured Brandname (from .env)
    if (envBrandname) {
      configsToTry.push(
        { SmsType: 2, Brandname: envBrandname },
        { SmsType: 8, Brandname: envBrandname },
      );
    }

    // Primary: SmsType 1 (Marketing SMS) - Works without Brandname
    configsToTry.push({ SmsType: 1 });

    // Fallback: SmsType 8 - No Brandname required
    configsToTry.push({ SmsType: 8 });

    let lastError = null;

    // Try sending SMS with different configurations until one succeeds
    for (const config of configsToTry) {
      // Build params object - only include Brandname if it exists
      const params = {
        Phone: formattedPhone,
        Content: message,
        ApiKey: apiKey,
        SecretKey: secretKey,
        IsUnicode: 0,
        SmsType: config.SmsType,
      };

      // Only add Brandname to params if it's defined in config
      if (config.Brandname) {
        params.Brandname = config.Brandname;
      }

      const brandnameLog = config.Brandname
        ? `Brandname: "${config.Brandname}"`
        : "No Brandname";
      console.log(
        `[SMS] Attempting with SmsType: ${config.SmsType}, ${brandnameLog}...`,
      );

      try {
        const urlParams = new URLSearchParams(params);
        const res = await fetch(
          `http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_get?${urlParams.toString()}`
        );
        const responseData = await res.json();

        console.log(
          `📊 eSMS Response:`,
          JSON.stringify(responseData, null, 2),
        );

        // 100 is the success code for eSMS
        if (responseData.CodeResult === "100") {
          console.log(
            `✅ SMS sent successfully using SmsType ${config.SmsType} ${brandnameLog}`,
          );
          console.log(
            `   MessageID: ${responseData.MessageID || "N/A"}, RequestID: ${responseData.RequestID || "N/A"}`,
          );
          return responseData;
        } else {
          console.log(
            `⚠️ Attempt failed: ${responseData.ErrorMessage} (Code: ${responseData.CodeResult})`,
          );
          lastError = responseData;
        }
      } catch (e) {
        console.log(`⚠️ Request failed: ${e.message}`);
        lastError = { CodeResult: "99", ErrorMessage: e.message };
      }
    }

    // If all configurations failed, check if we're in development mode
    console.error(`❌ All eSMS configurations failed.`);

    // In development, allow SMS to be simulated for testing
    if (
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === "test"
    ) {
      console.log(
        "📧 [SMS FALLBACK] Development mode: Simulating SMS delivery",
      );
      return {
        CodeResult: "100",
        ErrorMessage: "",
        simulated: true,
        note: "SMS simulated in development mode. In production, ensure valid eSMS credentials.",
        phone: formattedPhone,
        message: message.substring(0, 50) + "...",
      };
    }

    return lastError || { CodeResult: "99", ErrorMessage: "Unknown error" };
  } catch (error) {
    console.error("[SMS Service Error]:", error.message);
    return { CodeResult: "99", ErrorMessage: error.message };
  }
};

module.exports = { sendSMS };
