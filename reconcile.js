// Payment reconciliation.
// Reads payments.jsonl and works out how much money we actually collected.
// Run: node reconcile.js

const fs = require("fs");

let total = 0;
let count = 0;
const statusCounts = {}; // Helpful for debugging unexpected statuses

const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n").filter((l) => l.length > 0);

for (const line of lines) {
    const event = JSON.parse(line);
    const status = (event.status || "").toLowerCase().trim();
    
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    if (status === "success" || status === "successful") {
        total += Number(event.amount);
        count += 1;
    }
}

const expectedRaw = fs.readFileSync("expected.txt", "utf8").trim();
const expected = parseInt(expectedRaw, 10);

if (count !== expected) {
    console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
    console.log("Status breakdown found in file:", statusCounts);
    console.log("Something in the data isn't being handled the way the README describes.");
} else {
    console.log(`Check passed: ${count} successful payments.`);
    console.log(`Your code: KOYA-${Math.round(total)}`);
}
