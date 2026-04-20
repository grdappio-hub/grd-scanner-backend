document.title = "GRD NEW UI TEST";
console.log("NEW FRONTEND LOADED");
const app = document.querySelector("#app");


app.innerHTML = `
<div style="font-family: Arial, sans-serif; max-width: 960px; margin: 32px auto; padding: 0 16px;">    <h1>GRD Scanner</h1>


  <input
 id="address"
 placeholder="Enter Solana address"
 style="width: 100%; padding: 14px 16px; margin-bottom: 10px; font-size: 16px; border: 1px solid #d9d9d9; border-radius: 10px; outline: none;"
/>


   <button id="scanBtn" style="padding: 14px 16px; width: 100%; font-size: 16px; font-weight: 700; border: 0; border-radius: 10px; background: #111827; color: #fff; cursor: pointer;">
 Scan
</button>


   <div id="result" style="margin-top: 18px;"></div>
</div>
`;


function renderResult(data) {
 const riskColor =
   data.risk.level === "HIGH"
     ? "#ff4d4f"
     : data.risk.level === "MEDIUM"
     ? "#faad14"
     : data.risk.level === "LOW"
     ? "#52c41a"
     : "#8c8c8c";


 const concentrationText = data.concentration || "Not available";


 const marketHtml = data.marketData
   ? `
     <div style="margin-top: 18px;">
       <div style="font-size: 13px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 10px;">
         Market Context
       </div>


       <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px;">
         <div style="padding: 12px; border: 1px solid #eee; border-radius: 10px; background: #fafafa;">
           <div style="font-size: 12px; color: #777; margin-bottom: 4px;">Price</div>
           <div style="font-size: 15px; font-weight: 700;">${data.marketData.priceUsdFormatted || "N/A"}</div>
         </div>


         <div style="padding: 12px; border: 1px solid #eee; border-radius: 10px; background: #fafafa;">
           <div style="font-size: 12px; color: #777; margin-bottom: 4px;">Liquidity</div>
           <div style="font-size: 15px; font-weight: 700;">${data.marketData.liquidityUsdFormatted || "N/A"}</div>
         </div>


         <div style="padding: 12px; border: 1px solid #eee; border-radius: 10px; background: #fafafa;">
           <div style="font-size: 12px; color: #777; margin-bottom: 4px;">24h Volume</div>
           <div style="font-size: 15px; font-weight: 700;">${data.marketData.volume24hFormatted || "N/A"}</div>
         </div>


         <div style="padding: 12px; border: 1px solid #eee; border-radius: 10px; background: #fafafa;">
           <div style="font-size: 12px; color: #777; margin-bottom: 4px;">24h Change</div>
           <div style="font-size: 15px; font-weight: 700;">${
             data.marketData.priceChange24h !== null && data.marketData.priceChange24h !== undefined
               ? `${data.marketData.priceChange24h}%`
               : "N/A"
           }</div>
         </div>
       </div>
     </div>
   `
   : "";


 return `
   <div style="border: 1px solid #e5e7eb; border-radius: 14px; padding: 18px; background: #fff; box-shadow: 0 4px 18px rgba(0,0,0,0.04);">
     <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px;">
       <div>
         <h2 style="margin: 0 0 6px; font-size: 22px;">${data.token.symbol || "Unknown Token"}</h2>
         <div style="font-size: 14px; color: #666; margin-bottom: 4px;">${data.token.name || "Unknown Name"}</div>
         <div style="font-size: 12px; color: #888; word-break: break-all;">${data.token.address}</div>
       </div>


       <div style="text-align: right; min-width: 120px;">
         <div style="font-size: 12px; color: #777; margin-bottom: 4px;">Risk Score</div>
         <div style="font-size: 28px; font-weight: 800; color: ${riskColor}; line-height: 1;">${data.risk.score}</div>
         <div style="font-size: 12px; color: ${riskColor}; font-weight: 700; margin-top: 4px;">
           ${data.risk.level}
         </div>
       </div>
     </div>


     <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-bottom: 18px;">
       <div style="padding: 12px; border: 1px solid #eee; border-radius: 10px; background: #fafafa;">
         <div style="font-size: 12px; color: #777; margin-bottom: 4px;">Chain</div>
         <div style="font-size: 14px; font-weight: 700;">${data.token.chain}</div>
       </div>


       <div style="padding: 12px; border: 1px solid #eee; border-radius: 10px; background: #fafafa;">
         <div style="font-size: 12px; color: #777; margin-bottom: 4px;">Type</div>
         <div style="font-size: 14px; font-weight: 700;">${data.scanType}</div>
       </div>


       <div style="padding: 12px; border: 1px solid #eee; border-radius: 10px; background: #fafafa;">
         <div style="font-size: 12px; color: #777; margin-bottom: 4px;">Confidence</div>
         <div style="font-size: 14px; font-weight: 700;">${data.risk.confidence}</div>
       </div>


       <div style="padding: 12px; border: 1px solid #eee; border-radius: 10px; background: #fafafa;">
         <div style="font-size: 12px; color: #777; margin-bottom: 4px;">Verified</div>
         <div style="font-size: 14px; font-weight: 700;">${data.token.verified ? "Yes" : "No"}</div>
       </div>
     </div>


     <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px;">
       <div style="padding: 12px; border: 1px solid #eee; border-radius: 10px;">
         <div style="font-size: 12px; color: #777; margin-bottom: 4px;">Concentration</div>
         <div style="font-size: 14px; font-weight: 700;">${concentrationText}</div>
       </div>


       <div style="padding: 12px; border: 1px solid #eee; border-radius: 10px;">
         <div style="font-size: 12px; color: #777; margin-bottom: 4px;">Top Owners</div>
         <div style="font-size: 14px; font-weight: 700;">${data.topOwnersCount}</div>
       </div>
     </div>


     ${marketHtml}


     ${
       data.largestAccountsError
         ? `
       <div style="margin-top: 18px; padding: 12px 14px; border-radius: 10px; background: #fff7e6; color: #ad6800; border: 1px solid #ffe7ba; font-size: 14px;">
         <strong>Notice:</strong> Large token detected — holder distribution unavailable.
       </div>
     `
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

