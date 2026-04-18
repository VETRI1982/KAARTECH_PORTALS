const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const soap = require("soap");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

const LOGIN_WSDL = "http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/wsdl/flv_10002A111AD1/bndg_url/sap/bc/srt/rfc/sap/zws_cus_login_901926/100/customer_login_service_901926/customer_login_binding_901926?sap-client=100";
const PROFILE_WSDL = "http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/wsdl/flv_10002A111AD1/bndg_url/sap/bc/srt/rfc/sap/zws_cus_profile_901926/100/customer_profile_service_901926/customer_profile_binding_901926?sap-client=100";
const DASHBOARD_WSDL = "http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/wsdl/flv_10002A111AD1/bndg_url/sap/bc/srt/rfc/sap/zws_cus_dash_901926/100/customer_dash_service_901926/customer_dash_binding_901926?sap-client=100";
const FINANCE_WSDL = "http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/wsdl/flv_10002A111AD1/bndg_url/sap/bc/srt/rfc/sap/zws_cus_finance_901926/100/customer_finance_service_901926/customer_finance_binding_901926?sap-client=100";
const INVOICE_WSDL = "http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/wsdl/flv_10002A111AD1/bndg_url/sap/bc/srt/rfc/sap/zws_cus_invoice_pdf_901926/100/customer_invoice_pdf_901926/customer_invoice_pdf_binding_901926?sap-client=100";

async function getSoapClient(wsdlUrl) {
    const sapUser = (process.env.SAP_USER || "").trim();
    const sapPass = process.env.SAP_PASS || "";

    const client = await soap.createClientAsync(wsdlUrl, {
        wsdl_headers: {
            Authorization: "Basic " + Buffer.from(`${sapUser}:${sapPass}`).toString("base64")
        }
    });

    client.setSecurity(new soap.BasicAuthSecurity(sapUser, sapPass));
    return client;
}

//LOGIN
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

       const client = await getSoapClient(LOGIN_WSDL);

        const args = {
            I_CUST_ID: username,
            I_PASSWORD: password
        };
        const [result] = await client.ZFM_CUSTOMER_LOGIN_NEWAsync(args);

        res.json(result);

    } catch (error) {
        console.error("FULL ERROR:", error);
        res.status(500).json({ error: "SOAP call failed" });
    }
});

//PROFILE
app.get("/profile", async (req, res) => {
    try {
        const { customerId } = req.query;
        const client = await getSoapClient(PROFILE_WSDL);
        const [result] = await client.ZFM_CUSTOMER_PROFILEAsync({
            I_CUST_ID: customerId
        });
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Profile fetch failed" });
    }
});

//DASHBOARD
app.get("/dashboard", async (req, res) => {
    try {
        const { customerId } = req.query;

        const client = await getSoapClient(DASHBOARD_WSDL);
        const args = { I_CUST_ID: customerId };

        const [result] = await client.ZFM_CUSTOMER_DASHAsync(args);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Dashboard fetch failed" });
    }
});

//FINANCE
app.get("/finance", async (req, res) => {
    try {
        const { customerId } = req.query;

        const client = await getSoapClient(FINANCE_WSDL);
        const args = { I_CUST_ID: customerId };

        const [result] = await client.ZFM_CUST_FINANCIALAsync(args);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Finance data fetch failed" });
    }
});

//invoice
app.post("/get-invoice-pdf", async (req, res) => {
    try {
        const { invoiceNo } = req.body;

        // Use your existing helper function
        const client = await getSoapClient(INVOICE_WSDL);

        // Map the input to your FM's importing parameter
        const args = {
            IV_INV_NO: invoiceNo
        };

        // Call the SOAP method (Note the 'Async' suffix used by the soap library)
        const [result] = await client.ZFM_GET_INVOICE_PDF_901926Async(args);

        // Send the result back to Angular
        // result will contain { EV_PDF_BASE64: '...' }
        res.json(result);

    } catch (error) {
        console.error("PDF SOAP Error:", error);
        res.status(500).json({ error: "Failed to fetch PDF from SAP" });
    }
});


const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});