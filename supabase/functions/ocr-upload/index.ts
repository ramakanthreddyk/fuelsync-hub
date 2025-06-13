import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

// Azure OCR polling and line extraction
async function parseWithAzureOCR(imageBuffer: Uint8Array) {
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

  const opLocation = analyzeRes.headers.get("operation-location");
  if (!opLocation) throw new Error("Azure Read: missing Operation-Location");

  const opId = opLocation.split("/").pop();
  for (let i = 0; i < 10; i++) {
    await new Promise(res => setTimeout(res, 2000));
    const result = await fetch(`${AZURE_VISION_ENDPOINT}/vision/v3.2/read/analyzeResults/${opId}`, {
      headers: {
        "Ocp-Apim-Subscription-Key": AZURE_VISION_KEY
      }
    });
    const json = await result.json();
    if (["succeeded", "failed"].includes(json.status)) return json;
  }

  throw new Error("OCR polling timeout");
}

// Line extractor helpers
function extractLines(readResults: any[]): string[] {
  return readResults.flatMap(p => p.lines.map((l: any) => l.text.trim()));
}

function getDate(lines: string[]): string | null {
  for (const l of lines) {
    const m = l.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (m) {
      const [d, mth, y] = m[1].split('/');
      return `${y}-${mth}-${d}`;
    }
  }
  return null;
}

function getTime(lines: string[]): string | null {
  for (const l of lines) {
    const m = l.replace(/\s/g, '').match(/(\d{2}:\d{2}:\d{2})/);
    if (m) return m[1];
  }
  return null;
}

function getNozzles(lines: string[]): { nozzle_id: number, cumulative_volume: number }[] {
  const result = [];
  let current: any = null;

  const nextNumeric = (idx: number): number | null => {
    const m = lines[idx + 1]?.match(/([\d.]+)/);
    return m ? parseFloat(m[1]) : null;
  };

  for (let i = 0; i < lines.length; i++) {
    const txt = lines[i].toLowerCase();
    const hit = txt.match(/nozzle\s*no\.?\s*(\d+)/i);
    if (hit) {
      if (current && current.cumulative_volume) result.push(current);
      const no = parseInt(hit[1], 10);
      current = {
        nozzle_id: no,
        cumulative_volume: null
      };
      continue;
    }
    if (!current) continue;

    if (txt.includes("cumvolume")) current.cumulative_volume = nextNumeric(i);
  }

  if (current && current.cumulative_volume) result.push(current);
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const pump_sno = formData.get("pump_sno");

    if (!file || !pump_sno) {
      return new Response(JSON.stringify({ error: "file and pump_sno are required" }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const ocrRaw = await parseWithAzureOCR(buffer);
    console.log("📄 Azure OCR Raw:", JSON.stringify(ocrRaw, null, 2));

    const lines = extractLines(ocrRaw.analyzeResult.readResults);
    console.log("🔍 Extracted Lines:", lines);

    const ocrData = {
      reading_date: getDate(lines) ?? new Date().toISOString().split("T")[0],
      reading_time: getTime(lines) ?? new Date().toTimeString().slice(0, 5),
      nozzles: getNozzles(lines)
    };

    console.log("🧩 Parsed OCR Data:", ocrData);

    const { data: pump, error: pumpError } = await supabase
      .from("pumps")
      .select("id, station_id")
      .eq("pump_sno", pump_sno)
      .single();

    if (pumpError || !pump) {
      return new Response(JSON.stringify({ error: `Pump not found for sno: ${pump_sno}` }), {
        status: 404,
        headers: corsHeaders
      });
    }

    const inserted = [];

    for (const nozzle of ocrData.nozzles) {
      const { data: nozzleRow, error: nozzleError } = await supabase
        .from("nozzles")
        .select("id")
        .eq("pump_id", pump.id)
        .eq("nozzle_number", nozzle.nozzle_id)
        .maybeSingle();

      if (nozzleError || !nozzleRow) {
        console.warn(`⚠️ Nozzle ${nozzle.nozzle_id} not found for pump_id ${pump.id}`);
        continue;
      }

      const insertRes = await supabase
        .from("ocr_readings")
        .insert({
          station_id: pump.station_id,
          pump_sno,
          nozzle_id: nozzleRow.id,
          reading_date: ocrData.reading_date,
          reading_time: ocrData.reading_time,
          cumulative_vol: nozzle.cumulative_volume,
          source: "ocr",
          ocr_json: nozzle
        })
        .select()
        .single();

      if (!insertRes.error) inserted.push(insertRes.data);
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
