// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.// Payment reconciliation script
// Run: node reconcile.js

const fs = require("fs");

// 1. Read and parse the payments file safely
let lines;
try {
    lines = fs.readFileSync("payments.jsonl", "utf8").split("\n");
} catch (err) {
    console.error("Could not read payments.jsonl");
    process.exit(1);
}

// Map to store the latest attempt for each txn_id
const latestAttempts = new Map();

for (const line of lines) {
    if (!line.trim()) continue;

    let event;
    try {
        event = JSON.parse(line);
    } catch (e) {
        // Ignore lines that can't be read/parsed
        continue;
    }

    // Ignore events without a txn_id
    if (!event.txn_id) {
        continue;
    }

    const txnId = event.txn_id;
    const currentTs = new Date(event.ts).getTime();

    // Keep only the latest attempt based on timestamp (ts)
    if (!latestAttempts.has(txnId)) {
        latestAttempts.set(txnId, event);
    } else {
        const existingEvent = latestAttempts.get(txnId);
        const existingTs = new Date(existingEvent.ts).getTime();
        if (currentTs > existingTs) {
            latestAttempts.set(txnId, event);
        }
    }
}

let total = 0;
let count = 0;

// Evaluate the latest status of each unique transaction
for (const event of latestAttempts.values()) {
    const status = (event.status || "").toLowerCase().trim();
    if (status === "success") {
        total += Number(event.amount);
        count += 1;
    }
}

// Read expected count
let expected = 0;
try {
    const expectedRaw = fs.readFileSync("expected.txt", "utf8").trim();
    expected = parseInt(expectedRaw, 10);
} catch (e) {
    console.error("Could not read expected.txt");
    process.exit(1);
}

// Check and output results
if (count !== expected) {
    console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
} else {
    console.log(`Check passed: ${count} successful payments.`);
    console.log(`Your code: KOYA-${Math.round(total)}`);
}
// Run:  node reconcile.js

const fs = require("fs");

let total = 0;
let count = 0;

const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n").filter((l) => l.length > 0);
for (const line of lines) {
  const event = JSON.parse(line);
  if (event.status === "success") {
    total += Number(event.amount);
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
