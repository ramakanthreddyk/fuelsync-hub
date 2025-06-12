// Supabase Edge Function: ocr-upload/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AZURE_VISION_ENDPOINT = Deno.env.get("AZURE_VISION_ENDPOINT")!;
const AZURE_VISION_KEY = Deno.env.get("AZURE_VISION_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function parseWithAzureOCR(imageBuffer: Uint8Array) {
  const response = await fetch(`${AZURE_VISION_ENDPOINT}/vision/v3.2/read/analyze`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": AZURE_VISION_KEY,
      "Content-Type": "application/octet-stream",
    },
    body: imageBuffer,
  });

  const operationLocation = response.headers.get("operation-location");
  if (!operationLocation) throw new Error("Azure OCR did not return operation-location");

  for (let i = 0; i < 10; i++) {
    await new Promise(res => setTimeout(res, 2000));
    const resultRes = await fetch(operationLocation, {
      headers: { "Ocp-Apim-Subscription-Key": AZURE_VISION_KEY },
    });
    const resultJson = await resultRes.json();
    if (resultJson.status === "succeeded") {
      return resultJson;
    }
  }
  throw new Error("Azure OCR did not complete in time");
}

function extractDataFromOCR(ocrJson: any): {
  pump_sno: string,
  reading_date: string,
  reading_time: string,
  nozzles: { nozzle_id: string, cumulative_volume: number }[]
} {
  const lines = ocrJson.analyzeResult.readResults.flatMap((page: any) => page.lines.map((line: any) => line.text));
  let pump_sno = "";
  const nozzles: { nozzle_id: string, cumulative_volume: number }[] = [];

  for (const line of lines) {
    if (line.toLowerCase().includes("pump") && line.toLowerCase().includes("p00")) {
      pump_sno = line.trim().split(" ").pop() ?? "";
    }
    const nozzleMatch = line.match(/Nozzle\s*(\d+):\s*(\d+(\.\d+)?)/i);
    if (nozzleMatch) {
      const nozzle_id = nozzleMatch[1]; // You'd normally map this
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const pumpSnoOverride = formData.get("pump_sno") as string | null;

    if (!file) return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400, headers: corsHeaders });

    const buffer = new Uint8Array(await file.arrayBuffer());
    const ocrRaw = await parseWithAzureOCR(buffer);
    const ocrData = extractDataFromOCR(ocrRaw);

    if (pumpSnoOverride) ocrData.pump_sno = pumpSnoOverride;

    const { data: pump, error: pumpError } = await supabase
      .from("pumps")
      .select("id, station_id")
      .eq("pump_sno", ocrData.pump_sno)
      .single();

    if (pumpError || !pump) {
      return new Response(JSON.stringify({ error: `Pump not found for sno: ${ocrData.pump_sno}` }), { status: 404, headers: corsHeaders });
    }

    const inserted: any[] = [];
    for (const nozzle of ocrData.nozzles) {
      const { data: nozzleRow, error: nozzleError } = await supabase
        .from("nozzles")
        .select("id")
        .eq("id", nozzle.nozzle_id)
        .eq("pump_id", pump.id)
        .maybeSingle();

      if (nozzleError || !nozzleRow) continue;

      const insertRes = await supabase.from("ocr_readings").insert({
        station_id: pump.station_id,
        nozzle_id: nozzle.nozzle_id,
        pump_sno: ocrData.pump_sno,
        reading_date: ocrData.reading_date,
        reading_time: ocrData.reading_time,
        cumulative_vol: Number(nozzle.cumulative_volume),
        source: "ocr",
        ocr_json: nozzle,
      }).select().single();

      if (!insertRes.error) inserted.push(insertRes.data);
    }

    return new Response(JSON.stringify({ success: true, inserted: inserted.length, ocr: ocrData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
