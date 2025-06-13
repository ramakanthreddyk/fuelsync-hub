
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Azure OCR processing
async function parseWithAzureOCR(imageBuffer: Uint8Array) {
  const AZURE_VISION_ENDPOINT = Deno.env.get("AZURE_VISION_ENDPOINT");
  const AZURE_VISION_KEY = Deno.env.get("AZURE_VISION_KEY");

  if (!AZURE_VISION_ENDPOINT || !AZURE_VISION_KEY) {
    throw new Error("Azure Vision API credentials not configured");
  }

  console.log("🔍 Starting Azure OCR analysis...");

  const analyzeRes = await fetch(`${AZURE_VISION_ENDPOINT}/vision/v3.2/read/analyze`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": AZURE_VISION_KEY,
      "Content-Type": "application/octet-stream"
    },
    body: imageBuffer
  });

  if (!analyzeRes.ok) {
    throw new Error(`Azure OCR analysis failed: ${analyzeRes.status} ${analyzeRes.statusText}`);
  }

  const opLocation = analyzeRes.headers.get("operation-location");
  if (!opLocation) {
    throw new Error("Azure Read: missing Operation-Location header");
  }

  const opId = opLocation.split("/").pop();
  console.log("⏳ Polling Azure OCR results...");

  // Poll for results with timeout
  for (let i = 0; i < 15; i++) {
    await new Promise(res => setTimeout(res, 2000));
    
    const result = await fetch(`${AZURE_VISION_ENDPOINT}/vision/v3.2/read/analyzeResults/${opId}`, {
      headers: {
        "Ocp-Apim-Subscription-Key": AZURE_VISION_KEY
      }
    });

    if (!result.ok) {
      throw new Error(`Azure OCR polling failed: ${result.status}`);
    }

    const json = await result.json();
    
    if (json.status === "succeeded") {
      console.log("✅ Azure OCR completed successfully");
      return json;
    } else if (json.status === "failed") {
      throw new Error("Azure OCR processing failed");
    }
    
    console.log(`⏳ OCR status: ${json.status}, attempt ${i + 1}/15`);
  }

  throw new Error("OCR polling timeout - processing took too long");
}

// Text extraction helpers
function extractLines(readResults: any[]): string[] {
  if (!readResults || !Array.isArray(readResults)) {
    return [];
  }
  return readResults.flatMap(page => 
    (page.lines || []).map((line: any) => line.text?.trim() || "")
  ).filter(text => text.length > 0);
}

function getDate(lines: string[]): string | null {
  for (const line of lines) {
    // Match various date formats: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    const match = line.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/);
    if (match) {
      const parts = match[1].split(/[\/\-\.]/);
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
  }
  return null;
}

function getTime(lines: string[]): string | null {
  for (const line of lines) {
    // Match time formats: HH:MM:SS, HH:MM, with optional AM/PM
    const match = line.replace(/\s/g, '').match(/(\d{1,2}[:.]\d{2}(?:[:.]\d{2})?(?:[AP]M)?)/i);
    if (match) {
      let time = match[1].replace(/\./g, ':');
      
      // Convert 12-hour to 24-hour format
      if (time.includes('PM') || time.includes('pm')) {
        const timeParts = time.replace(/[AP]M/i, '').split(':');
        const hour = parseInt(timeParts[0]);
        if (hour < 12) {
          timeParts[0] = (hour + 12).toString();
        }
        time = timeParts.join(':');
      } else if (time.includes('AM') || time.includes('am')) {
        time = time.replace(/[AP]M/i, '');
        const timeParts = time.split(':');
        if (timeParts[0] === '12') {
          timeParts[0] = '00';
        }
        time = timeParts.join(':');
      }
      
      return time.replace(/[AP]M/i, '');
    }
  }
  return null;
}

function getNozzles(lines: string[]): { nozzle_id: number, cumulative_volume: number }[] {
  const result = [];
  let current: any = null;

  const getNextNumeric = (idx: number): number | null => {
    // Look in next few lines for a numeric value
    for (let i = idx + 1; i < Math.min(idx + 4, lines.length); i++) {
      const match = lines[i].match(/([\d,]+\.?\d*)/);
      if (match) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(value) && value > 0) {
          return value;
        }
      }
    }
    return null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    // Look for nozzle patterns
    const nozzleMatch = line.match(/(?:nozzle|noz)[\s]*(?:no\.?|number|#)?[\s]*(\d+)/i);
    if (nozzleMatch) {
      // Save previous nozzle if complete
      if (current && current.cumulative_volume !== null) {
        result.push(current);
      }
      
      current = {
        nozzle_id: parseInt(nozzleMatch[1]),
        cumulative_volume: null
      };
      continue;
    }

    if (!current) continue;

    // Look for cumulative volume indicators
    if (line.includes("cum") || line.includes("total") || line.includes("volume")) {
      const volume = getNextNumeric(i);
      if (volume !== null) {
        current.cumulative_volume = volume;
      }
    }
  }

  // Add the last nozzle if complete
  if (current && current.cumulative_volume !== null) {
    result.push(current);
  }

  return result.filter(nozzle => 
    nozzle.nozzle_id > 0 && 
    nozzle.cumulative_volume > 0
  );
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200 
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    console.log("📥 OCR upload request received");

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const pump_sno = formData.get("pump_sno") as string;
    const user_id = formData.get("user_id") as string;

    console.log("📋 Request details:", {
      filePresent: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      pumpSno: pump_sno,
      userId: user_id
    });

    if (!file || !pump_sno) {
      return new Response(JSON.stringify({ 
        error: "Missing required fields: file and pump_sno are required" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!user_id) {
      return new Response(JSON.stringify({ 
        error: "Authentication required: user_id is missing" 
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    console.log("🔍 Starting OCR processing...");

    // Process with Azure OCR
    const ocrRaw = await parseWithAzureOCR(buffer);
    console.log("📄 Azure OCR Raw response received");

    const lines = extractLines(ocrRaw.analyzeResult?.readResults || []);
    console.log("🔍 Extracted", lines.length, "lines from OCR");

    const ocrData = {
      reading_date: getDate(lines) || new Date().toISOString().split("T")[0],
      reading_time: getTime(lines) || new Date().toTimeString().slice(0, 8),
      nozzles: getNozzles(lines)
    };

    console.log("🧩 Parsed OCR Data:", {
      date: ocrData.reading_date,
      time: ocrData.reading_time,
      nozzleCount: ocrData.nozzles.length,
      nozzles: ocrData.nozzles
    });

    // Find pump in database
    const { data: pump, error: pumpError } = await supabase
      .from("pumps")
      .select("id, station_id")
      .eq("pump_sno", pump_sno)
      .single();

    if (pumpError || !pump) {
      console.error("❌ Pump not found:", pumpError);
      return new Response(JSON.stringify({ 
        error: `Pump not found for serial number: ${pump_sno}` 
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("✅ Found pump:", pump);

    // Insert OCR readings
    const inserted = [];

    for (const nozzle of ocrData.nozzles) {
      console.log("🔍 Processing nozzle:", nozzle.nozzle_id);

      // Find nozzle
      const { data: nozzleRow, error: nozzleError } = await supabase
        .from("nozzles")
        .select("id")
        .eq("pump_id", pump.id)
        .eq("nozzle_number", nozzle.nozzle_id)
        .maybeSingle();

      if (nozzleError || !nozzleRow) {
        console.warn(`⚠️ Nozzle ${nozzle.nozzle_id} not found for pump ${pump.id}`);
        continue;
      }

      console.log("✅ Found nozzle:", nozzleRow.id);

      // Insert reading
      const { data: insertResult, error: insertError } = await supabase
        .from("ocr_readings")
        .insert({
          station_id: pump.station_id,
          pump_sno: pump_sno,
          nozzle_id: nozzleRow.id,
          reading_date: ocrData.reading_date,
          reading_time: ocrData.reading_time,
          cumulative_vol: nozzle.cumulative_volume,
          source: "ocr",
          ocr_json: nozzle,
          user_id: parseInt(user_id)
        })
        .select()
        .single();

      if (insertError) {
        console.error("❌ Insert error for nozzle", nozzle.nozzle_id, ":", insertError);
        continue;
      }

      console.log("✅ Inserted reading:", insertResult.id);
      inserted.push(insertResult);
    }

    console.log("🎉 OCR processing complete. Inserted", inserted.length, "readings");

    return new Response(
      JSON.stringify({ 
        success: true, 
        inserted: inserted.length, 
        ocr: ocrData,
        readings: inserted
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error: any) {
    console.error("💥 OCR Edge Function Error:", error);
    
    return new Response(JSON.stringify({ 
      error: error.message || "Internal server error",
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
