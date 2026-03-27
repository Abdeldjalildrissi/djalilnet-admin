
import { generateResumePDF } from "./src/lib/latex-generator.js";
import fs from "fs";

async function test() {
    try {
        console.log("Starting test pdf generation...");
        const buffer = await generateResumePDF();
        console.log("Generation finished. Length:", buffer.length);
        console.log("Heads (first 20 bytes):", buffer.slice(0, 20).toString('hex'));
        console.log("Heads (as string):", buffer.slice(0, 5).toString());
        
        if (buffer.slice(0, 5).toString() === "%PDF-") {
            console.log("SUCCESS: Valid PDF header found.");
        } else {
            console.log("FAILURE: Invalid PDF header. Content might be an error message.");
            console.log("Full Content Snippet:", buffer.slice(0, 200).toString());
        }
    } catch (e) {
        console.error("Test failed with error:", e);
    }
}

test();
