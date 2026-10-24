import { pbkdf2Sync, randomBytes } from "node:crypto";

async function readPasscode() {
  if (!process.stdin.isTTY) {
    let value = "";
    for await (const chunk of process.stdin) value += chunk;
    return value.trimEnd();
  }

  process.stdout.write("Admin passcode: ");
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  return new Promise((resolve) => {
    let value = "";
    process.stdin.on("data", (key) => {
      if (key === "\u0003") process.exit(130);
      if (key === "\r" || key === "\n") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write("\n");
        resolve(value);
      } else if (key === "\u007f") {
        value = value.slice(0, -1);
      } else if (!key.startsWith("\u001b")) {
        value += key;
      }
    });
  });
}

const passcode = await readPasscode();
if (!passcode || passcode.length < 12) {
  console.error("Passcode must be at least 12 characters.");
  process.exit(1);
}

const iterations = 310_000;
const salt = randomBytes(16);
const hash = pbkdf2Sync(passcode, salt, iterations, 32, "sha256");
console.log(`pbkdf2_sha256:${iterations}:${salt.toString("base64url")}:${hash.toString("base64url")}`);
