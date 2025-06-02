
const { blobServiceClient, computerVisionClient, CONTAINERS } = require('../config/azure');
const { Upload, Sale } = require('../models');

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

    // Extract receipt data from OCR results
    const extractedData = extractReceiptData(ocrResult.analyzeResult.readResults);
    
    // Update upload with OCR results
    await upload.update({
      status: 'success',
      amount: extractedData.amount,
      litres: extractedData.litres,
      fuelType: extractedData.fuelType,
      processedAt: new Date(),
      ocrData: {
        ...extractedData,
        timestamp: new Date().toISOString(),
        rawText: ocrResult.analyzeResult.readResults
      }
    });

    // Optionally create a sale record from the OCR data
    if (extractedData.amount > 0 && extractedData.litres > 0) {
      await Sale.create({
        userId: upload.userId,
        pumpId: extractedData.pumpId || null,
        fuelType: extractedData.fuelType,
        litres: extractedData.litres,
        pricePerLitre: extractedData.amount / extractedData.litres,
        totalAmount: extractedData.amount,
        shift: getCurrentShift(),
        uploadId: upload.id
      });
    }

    console.log(`OCR processing completed for upload ${uploadId}`);
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
  processOCR,
  extractReceiptData
};
