// ocr-azure.ts
export async function parseWithAzureOCR(imageBuffer: Uint8Array) {
  const AZURE_VISION_ENDPOINT = Deno.env.get("AZURE_VISION_ENDPOINT")!;
  const AZURE_VISION_KEY = Deno.env.get("AZURE_VISION_KEY")!;

  const analyzeRes = await fetch(`${AZURE_VISION_ENDPOINT}/vision/v3.2/read/analyze`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": AZURE_VISION_KEY,
      "Content-Type": "application/octet-stream",
    },
    body: imageBuffer,
  });

  const operationLocation = analyzeRes.headers.get("operation-location");
  if (!operationLocation) throw new Error("No operation-location returned from Azure OCR");

  // Poll for result (max 10 tries)
  for (let i = 0; i < 10; i++) {
    await new Promise((res) => setTimeout(res, 2000));

    const result = await fetch(operationLocation, {
      headers: {
        "Ocp-Apim-Subscription-Key": AZURE_VISION_KEY,
      },
    });
    const json = await result.json();
    if (json.status === "succeeded") return json;
  }

  throw new Error("Azure OCR timeout: No result after polling");
}
