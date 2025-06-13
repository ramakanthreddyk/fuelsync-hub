import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
interface Database {
  public: {
    Tables: {
      pumps: {
        Row: {
          id: number;
          station_id: number;
          pump_sno: string;
        }
      };
      nozzles: {
        Row: {
          id: number;
          pump_id: number;
          nozzle_number: number;
          fuel_type: 'PETROL' | 'DIESEL' | 'CNG' | 'EV';
        }
      };
      ocr_readings: {
        Row: {
          id: number;
          station_id: number;
          pump_sno: string;
          nozzle_id: number;
          reading_date: string;
          reading_time: string;
          cumulative_vol: number;
          source: 'ocr' | 'manual';
          created_by: number | null;
        };
        Insert: {
          station_id: number;
          pump_sno: string;
          nozzle_id: number;
          reading_date: string;
          reading_time: string;
          cumulative_vol: number;
          source: 'ocr' | 'manual';
          created_by?: number;
        };
      };
      fuel_prices: {
        Row: {
          station_id: number | null;
          fuel_type: 'PETROL' | 'DIESEL' | 'CNG' | 'EV';
          price_per_litre: number;
          valid_from: string;
        };
      };
      sales: {
        Insert: {
          station_id: number;
          nozzle_id: number;
          reading_id: number;
          delta_volume_l: number;
          price_per_litre: number;
          total_amount: number;
        };
      };
    };
  };
}

const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
// Azure OCR processing
async function parseWithAzureOCR(imageBuffer) {
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
    await new Promise((res) => setTimeout(res, 2000));
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
function extractLines(readResults) {
  if (!readResults || !Array.isArray(readResults)) {
    return [];
  }
  return readResults.flatMap((page) => (page.lines || []).map((line) => line.text?.trim() || "")).filter((text) => text.length > 0);
}
function getDate(lines) {
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
function getTime(lines) {
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
function getNozzles(lines: string[]): { nozzle_id: number; cumulative_volume: number | null }[] {
  const result: { nozzle_id: number; cumulative_volume: number | null }[] = [];
  let current: { nozzle_id: number; cumulative_volume: number | null } | undefined = undefined;
  const getNextNumeric = (idx: number) => {
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
  return result.filter((nozzle) => nozzle.nozzle_id > 0 && nozzle.cumulative_volume !== null && nozzle.cumulative_volume > 0);
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
    return new Response(JSON.stringify({
      error: "Method not allowed"
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  try {
    console.log("📥 OCR upload request received");
    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file");
    const pump_sno = formData.get("pump_sno");
    const user_id = formData.get("user_id");
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
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    if (!user_id) {
      return new Response(JSON.stringify({
        error: "Authentication required: user_id is missing"
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
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
    const { data: pump, error: pumpError } = await supabase.from("pumps").select("id, station_id").eq("pump_sno", pump_sno).single();
    if (pumpError || !pump) {
      console.error("❌ Pump not found:", pumpError);
      return new Response(JSON.stringify({
        error: `Pump not found for serial number: ${pump_sno}`
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    console.log("✅ Found pump:", pump);
    // Insert OCR readings
    const inserted: any[] = [];
    for (const nozzle of ocrData.nozzles) {
      console.log("🔍 Processing nozzle:", nozzle.nozzle_id);
      // Find nozzle and its fuel type
      const { data: nozzleRow, error: nozzleError } = await supabase
        .from("nozzles")
        .select("id, fuel_type")
        .eq("pump_id", pump.id)
        .eq("nozzle_number", nozzle.nozzle_id)
        .maybeSingle();
      if (nozzleError || !nozzleRow) {
        console.warn(`⚠️ Nozzle ${nozzle.nozzle_id} not found for pump ${pump.id}`);
        continue;
      }
      console.log("✅ Found nozzle:", nozzleRow.id);
      // Insert reading
      const { data: insertResult, error: insertError } = await supabase.from("ocr_readings").insert({
        station_id: pump.station_id,
        pump_sno: pump_sno,
        nozzle_id: nozzleRow.id,
        reading_date: ocrData.reading_date,
        reading_time: ocrData.reading_time,
        cumulative_vol: nozzle.cumulative_volume,
        source: "ocr",
        created_by: parseInt(user_id)
      }).select().single();
      if (insertError) {
        console.error("❌ Insert error for nozzle", nozzle.nozzle_id, ":", insertError);
        continue;
      }
      console.log("✅ Inserted reading:", insertResult.id);
      inserted.push(insertResult);
      // Fetch previous reading (excluding this one)
      const { data: previous, error: prevError } = await supabase
        .from("ocr_readings")
        .select("cumulative_vol")
        .eq("station_id", pump.station_id)
        .eq("nozzle_id", nozzleRow.id)
        .neq("id", insertResult.id)
        .order("reading_date", { ascending: false })
        .order("reading_time", { ascending: false })
        .limit(1)
        .maybeSingle();

      const previousVol = previous?.cumulative_vol || 0;
      const deltaVol = parseFloat((insertResult.cumulative_vol - previousVol).toFixed(3));
      if (deltaVol <= 0) {
        console.log("ℹ️ Skipping sale creation due to non-positive delta:", deltaVol);
        continue;
      }

      // Get price per litre
      const { data: priceRow, error: priceError } = await supabase
        .from("fuel_prices")
        .select("price_per_litre")
        .eq("fuel_type", nozzleRow.fuel_type)
        .or(`station_id.eq.${pump.station_id},station_id.is.null`)
        .lte("valid_from", new Date().toISOString())
        .order("valid_from", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (priceError || !priceRow) {
        console.warn("⚠️ No fuel price found for nozzle", nozzleRow.id);
        continue;
      }

      const pricePerLitre = parseFloat(priceRow.price_per_litre.toString());
      const totalAmount = parseFloat((deltaVol * pricePerLitre).toFixed(2));

      // Insert sale
      const { error: saleError } = await supabase.from("sales").insert({
        station_id: pump.station_id,
        nozzle_id: nozzleRow.id,
        reading_id: insertResult.id,
        delta_volume_l: deltaVol,
        price_per_litre: pricePerLitre,
        total_amount: totalAmount
      });

      if (saleError) {
        console.error("❌ Failed to insert sale:", saleError);
      } else {
        console.log("💰 Sale recorded:", { deltaVol, pricePerLitre, totalAmount });
      }

    }
    console.log("🎉 OCR processing complete. Inserted", inserted.length, "readings");
    return new Response(JSON.stringify({
      success: true,
      inserted: inserted.length,
      ocr: ocrData,
      readings: inserted
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    console.error("💥 OCR Edge Function Error:", error);
    return new Response(JSON.stringify({
      error: error.message || "Internal server error",
      details: error.stack
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
