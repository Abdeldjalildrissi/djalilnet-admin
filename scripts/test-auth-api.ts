import { config } from "dotenv";
config({ path: ".env.local" });
import { auth } from "../src/lib/auth";

async function test() {
  const req = new Request("http://localhost:3000/api/auth/sign-in/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@djalilnet.com", password: "admin123456" })
  });
  
  try {
    const res = await auth.handler(req);
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
  } catch (err) {
    console.error("CATCH:", err);
  }
}
test();
