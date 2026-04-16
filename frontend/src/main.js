const app = document.querySelector("#app");

app.innerHTML = `
  <div style="font-family: Arial; max-width: 700px; margin: 50px auto;">
    <h1>GRD Scanner</h1>

    <input 
      id="address"
      placeholder="Enter Solana address"
      style="width: 100%; padding: 12px; margin-bottom: 12px; font-size: 16px;"
    />

    <button id="scanBtn" style="padding: 12px; width: 100%; font-size: 16px;">
      Scan
    </button>

    <div id="result" style="margin-top: 24px;"></div>
  </div>
`;

function renderResult(data) {
  const riskColor =
    data.risk.level === "HIGH"
      ? "#ff4d4f"
      : data.risk.level === "MEDIUM"
      ? "#faad14"
      : "#52c41a";

  return `
    <div style="border: 1px solid #ddd; border-radius: 12px; padding: 20px; background: #fff;">
      <h2 style="margin-top: 0;">Scan Result</h2>

      <div style="margin-bottom: 10px;"><strong>Address:</strong> ${data.token.address}</div>
      <div style="margin-bottom: 10px;"><strong>Chain:</strong> ${data.token.chain}</div>
      <div style="margin-bottom: 10px;"><strong>Scan Type:</strong> ${data.scanType}</div>

      <div style="margin-bottom: 10px;">
       <strong>Score:</strong> ${data.risk.score}/100
      </div>

      <div style="margin-bottom: 10px;"><strong>Confidence:</strong> ${data.risk.confidence}</div>
      <div style="margin-bottom: 10px;"><strong>Balance:</strong> ${data.balance}</div>
${
  data.concentration
    ? `<div><strong>Concentration:</strong> ${data.concentration}</div>`
    : `<div><strong>Concentration:</strong> Not available</div>`
}      <strong>Top Token Accounts:</strong> ${data.largestAccountsCount}
       <strong>Top Owners:</strong> ${data.topOwnersCount}

      ${
        data.largestAccountsError
  ? `<div style="margin-top: 16px; padding: 12px; border-radius: 8px; background: #fff7e6; color: #ad6800;">
      <strong>Notice:</strong> Large token detected — holder distribution unavailable (potential hidden concentration risk)
    </div>`
  : ""
      }
    </div>
  `;
}

document.getElementById("scanBtn").onclick = async () => {
  const address = document.getElementById("address").value;
  const resultEl = document.getElementById("result");

  resultEl.innerHTML = "<p>Scanning...</p>";

  try {
    const res = await fetch("http://localhost:3001/api/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chain: "solana",
        address,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      resultEl.innerHTML = `
        <div style="color: #a8071a; background: #fff1f0; padding: 12px; border-radius: 8px;">
          <strong>Error:</strong> ${data.error || "Request failed"}
        </div>
      `;
      return;
    }

    resultEl.innerHTML = renderResult(data);
  } catch (error) {
    resultEl.innerHTML = `
      <div style="color: #a8071a; background: #fff1f0; padding: 12px; border-radius: 8px;">
        <strong>Error:</strong> Failed to connect to backend
      </div>
    `;
  }
};