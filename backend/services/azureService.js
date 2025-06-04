const { blobServiceClient, computerVisionClient, CONTAINERS } = require('../config/azure');
const { Upload, NozzleReading } = require('../models');
const { parseOcrText } = require('../utils/ocrParser');
const { processNozzleReadings } = require('./salesCalculationService');

const uploadToBlob = async (buffer, filename) => {
  try {
    const containerClient = blobServiceClient.getContainerClient(CONTAINERS.RECEIPTS);
    const blockBlobClient = containerClient.getBlockBlobClient(filename);
    
    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: {
        blobContentType: 'image/jpeg'
      }
    });

    return blockBlobClient.url;
  } catch (error) {
    console.error('Azure blob upload error:', error);
    throw new Error('Failed to upload file to Azure');
  }
};

const processOCR = async (uploadId, imageUrl) => {
  try {
    console.log(`Processing OCR for upload ${uploadId}`);
    
    const upload = await Upload.findByPk(uploadId);
    if (!upload) {
      throw new Error('Upload not found');
    }

    // Use Azure Computer Vision to extract text
    const result = await computerVisionClient.readInStream(imageUrl);
    
    // Extract operation ID from the result
    const operationLocation = result.operationLocation;
    const operationId = operationLocation.split('/').pop();

    // Poll for results
    let ocrResult;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      ocrResult = await computerVisionClient.getReadResult(operationId);
      
      if (ocrResult.status === 'succeeded') {
        break;
      } else if (ocrResult.status === 'failed') {
        throw new Error('OCR processing failed');
      }
      
      // Wait 2 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    if (ocrResult.status !== 'succeeded') {
      throw new Error('OCR processing timeout');
    }

    // Extract the raw text from OCR results
    const rawText = ocrResult.analyzeResult.readResults
      .map(result => result.lines.map(line => line.text).join('\n'))
      .join('\n');

    console.log('Raw OCR text:', rawText);

    // Parse the OCR text using our custom parser
    const extractedData = parseOcrText(rawText);
    
    console.log('Extracted data:', extractedData);

    // Validate extracted data
    if (!extractedData.pump_sno || extractedData.nozzleReadings.length === 0) {
      throw new Error('Could not extract pump serial number or nozzle readings. Please upload a clearer image.');
    }

    // Use upload creation date if no date was extracted from OCR
    const readingDate = extractedData.date || upload.createdAt.toISOString().split('T')[0];
    const readingTime = extractedData.time || upload.createdAt.toTimeString().split(' ')[0];

    // Create nozzle readings in the database
    const nozzleReadings = [];
    const fuelTypeMap = { 1: 'Petrol', 2: 'Diesel', 3: 'Petrol', 4: 'Diesel' }; // Default mapping

    for (const reading of extractedData.nozzleReadings) {
      const nozzleReading = await NozzleReading.create({
        uploadId: upload.id,
        userId: upload.userId,
        pumpSno: extractedData.pump_sno,
        nozzleId: reading.nozzle_id,
        cumulativeVolume: reading.cumulative_volume,
        readingDate,
        readingTime,
        fuelType: fuelTypeMap[reading.nozzle_id] || 'Petrol',
        isManualEntry: false
      });

      nozzleReadings.push(nozzleReading);
    }

    // Process the readings to calculate sales
    const processedReadings = await processNozzleReadings(nozzleReadings);

    // Calculate totals for the upload
    const totalLitres = processedReadings.reduce((sum, r) => sum + parseFloat(r.litresSold || 0), 0);
    const totalAmount = processedReadings.reduce((sum, r) => sum + parseFloat(r.totalAmount || 0), 0);

    // Update upload with processed data
    await upload.update({
      status: 'success',
      amount: totalAmount,
      litres: totalLitres,
      fuelType: processedReadings.length > 0 ? processedReadings[0].fuelType : 'Petrol',
      processedAt: new Date(),
      ocrData: {
        ...extractedData,
        processedReadings: processedReadings.map(r => ({
          nozzleId: r.nozzleId,
          cumulativeVolume: r.cumulativeVolume,
          litresSold: r.litresSold,
          totalAmount: r.totalAmount
        })),
        timestamp: new Date().toISOString(),
        rawText: rawText
      }
    });

    console.log(`OCR processing completed for upload ${uploadId}. Total: ${totalLitres}L, ₹${totalAmount}`);
  } catch (error) {
    console.error(`OCR processing error for upload ${uploadId}:`, error);
    
    await Upload.update({
      status: 'failed',
      errorMessage: error.message
    }, {
      where: { id: uploadId }
    });
  }
};

const extractReceiptData = (readResults) => {
  // This is a simplified extraction logic
  // In production, you'd want more sophisticated pattern matching
  const text = readResults.map(result => 
    result.lines.map(line => line.text).join(' ')
  ).join(' ').toLowerCase();

  console.log('Extracted text:', text);

  let amount = 0;
  let litres = 0;
  let fuelType = 'Petrol';
  let pumpId = null;

  // Extract amount (look for currency symbols and numbers)
  const amountMatch = text.match(/(?:rs\.?|₹)\s*(\d+(?:\.\d{2})?)/i) || 
                     text.match(/(\d+\.\d{2})\s*(?:rs\.?|₹)/i);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1]);
  }

  // Extract litres
  const litresMatch = text.match(/(\d+(?:\.\d{1,3})?)\s*(?:l|ltr|litre|litres)/i);
  if (litresMatch) {
    litres = parseFloat(litresMatch[1]);
  }

  // Determine fuel type
  if (text.includes('diesel') || text.includes('hsd')) {
    fuelType = 'Diesel';
  }

  // Extract pump ID
  const pumpMatch = text.match(/pump\s*(?:no\.?)?\s*(\d+)/i) || 
                   text.match(/(\d+)\s*pump/i);
  if (pumpMatch) {
    pumpId = `pump-${pumpMatch[1]}`;
  }

  return {
    amount,
    litres,
    fuelType,
    pumpId
  };
};

const getCurrentShift = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return 'morning';
  if (hour >= 14 && hour < 22) return 'afternoon';
  return 'night';
};

module.exports = {
  uploadToBlob,
  processOCR
};
