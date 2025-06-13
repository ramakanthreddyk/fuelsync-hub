import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// Azure OCR Logic
async function parseWithAzureOCR(imageBuffer) {
  const AZURE_VISION_ENDPOINT = Deno.env.get("AZURE_VISION_ENDPOINT");
  const AZURE_VISION_KEY = Deno.env.get("AZURE_VISION_KEY");

  const analyzeRes = await fetch(`${AZURE_VISION_ENDPOINT}/vision/v3.2/read/analyze`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": AZURE_VISION_KEY,
      "Content-Type": "application/octet-stream"
    },
    body: imageBuffer
  });

  const operationLocation = analyzeRes.headers.get("operation-location");
  if (!operationLocation) throw new Error("No operation-location returned from Azure OCR");

  for (let i = 0; i < 10; i++) {
    await new Promise((res) => setTimeout(res, 2000));
    const result = await fetch(operationLocation, {
      headers: {
        "Ocp-Apim-Subscription-Key": AZURE_VISION_KEY
      }
    });
    const json = await result.json();
    if (json.status === "succeeded") return json;
  }

  throw new Error("Azure OCR timeout: No result after polling");
}

// Text Extraction Logic
function extractDataFromOCR(ocrJson) {
  const lines = ocrJson.analyzeResult.readResults.flatMap((page) =>
    page.lines.map((line) => line.text)
  );

  console.log("🔍 OCR Lines:", lines);

  let pump_sno = "";
  const nozzles = [];

  for (const line of lines) {
    if (line.toLowerCase().includes("pump") && line.toLowerCase().includes("p00")) {
      pump_sno = line.trim().split(" ").pop() ?? "";
    }

    const nozzleMatch = line.match(/Nozzle\s*(\d+):\s*(\d+(\.\d+)?)/i);
    if (nozzleMatch) {
      const nozzle_id = nozzleMatch[1];
      const cumulative_volume = parseFloat(nozzleMatch[2]);
      nozzles.push({ nozzle_id, cumulative_volume });
    }
  }

  return {
    pump_sno,
    reading_date: new Date().toISOString().split("T")[0],
    reading_time: new Date().toTimeString().slice(0, 5),
    nozzles
  };
}

// Request Handler
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    const formData = await req.formData();
    const file = formData.get("file");
    const pumpSnoOverride = formData.get("pump_sno");

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());

    const ocrRaw = await parseWithAzureOCR(buffer);
    console.log("📄 Raw Azure OCR response:", JSON.stringify(ocrRaw, null, 2));

    const ocrData = extractDataFromOCR(ocrRaw);
    if (pumpSnoOverride) ocrData.pump_sno = pumpSnoOverride;

    console.log("🧩 Mapped OCR data:", JSON.stringify(ocrData, null, 2));

    const { data: pump, error: pumpError } = await supabase
      .from("pumps")
      .select("id, station_id")
      .eq("pump_sno", ocrData.pump_sno)
      .single();

    if (pumpError || !pump) {
      console.error("❌ Pump not found or error:", pumpError);
      return new Response(
        JSON.stringify({ error: `Pump not found for sno: ${ocrData.pump_sno}` }),
        { status: 404, headers: corsHeaders }
      );
    }

    const inserted = [];

    for (const nozzle of ocrData.nozzles) {
      const { data: nozzleRow, error: nozzleError } = await supabase
        .from("nozzles")
        .select("id")
        .eq("id", nozzle.nozzle_id)
        .eq("pump_id", pump.id)
        .maybeSingle();

      if (nozzleError || !nozzleRow) {
        console.warn(`⚠️ Skipping nozzle ${nozzle.nozzle_id}:`, nozzleError);
        continue;
      }

      const insertRes = await supabase
        .from("ocr_readings")
        .insert({
          station_id: pump.station_id,
          nozzle_id: nozzle.nozzle_id,
          pump_sno: ocrData.pump_sno,
          reading_date: ocrData.reading_date,
          reading_time: ocrData.reading_time,
          cumulative_vol: Number(nozzle.cumulative_volume),
          source: "ocr",
          ocr_json: nozzle
        })
        .select()
        .single();

      if (!insertRes.error) {
        inserted.push(insertRes.data);
      } else {
        console.error("❌ Insert error for nozzle", nozzle.nozzle_id, ":", insertRes.error);
      }
    }

    return new Response(
      JSON.stringify({ success: true, inserted: inserted.length, ocr: ocrData }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (err) {
    console.error("💥 OCR Edge Function Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
