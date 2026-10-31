// Payment reconciliation script
// Run: node reconcile.js

const fs = require("fs");
const readline = require("readline");

async function runReconciliation() {
    const fileStream = fs.createReadStream("payments.jsonl");

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const latestAttempts = new Map();

    for await (const line of rl) {
        if (!line.trim()) continue;

        let event;
        try {
            event = JSON.parse(line);
        } catch (e) {
            // Silently skip corrupted or malformed JSON lines
            continue;
        }

        // Ignore events without a txn_id or timestamp
        if (!event.txn_id || !event.ts) {
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
            // Safely parse amount, fallback to 0 if NaN/undefined
            const amount = parseFloat(event.amount);
            if (!isNaN(amount)) {
                total += amount;
            }
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
}

runReconciliation();
