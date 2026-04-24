const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const quantize = require('quantize');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

const app = express();
// 使用环境变量中的端口或默认使用4000端口
const PORT = process.env.PORT || 4000;

// 设置multer中间件来处理文件上传
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制10MB
  },
  fileFilter: (req, file, cb) => {
    // 只接受图片格式
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

// 设置静态文件目录
app.use(express.static('public'));

// 创建临时目录用于存储处理后的图片
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// 主页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 将Buffer转换为像素数组
async function bufferToPixels(buffer) {
  const { data, info } = await sharp(buffer)
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const pixels = [];
  
  for (let i = 0; i < data.length; i += info.channels) {
    pixels.push([
      data[i],           // red
      data[i + 1],       // green
      data[i + 2],       // blue
      info.channels > 3 ? data[i + 3] : 255 // alpha
    ]);
  }
  
  return { 
    pixels, 
    width: info.width, 
    height: info.height, 
    channels: info.channels 
  };
}

// 使用颜色量化生成有限调色板
function applyColorQuantization(pixels, colorCount) {
  // 如果是彩虹7色模式，使用固定的彩虹调色板
  if (colorCount === 'rainbow') {
    return applyRainbowPalette(pixels);
  }
  
  // 如果是版画阴刻模式
  if (colorCount === 'engraving-intaglio') {
    return applyEngravingIntaglio(pixels);
  }
  
  // 如果是版画阳刻模式
  if (colorCount === 'engraving-relief') {
    return applyEngravingRelief(pixels);
  }
  
  // 只使用RGB通道进行量化（忽略Alpha）
  const rgbPixels = pixels.map(p => [p[0], p[1], p[2]]);
  
  // 使用quantize库生成调色板
  const palette = quantize(rgbPixels, colorCount).palette();
  
  // 创建一个颜色查找表，提高性能
  const colorMap = new Map();
  
  // 为每个像素找到最接近的调色板颜色
  const indexedPixels = pixels.map(pixel => {
    // 创建颜色键值以进行缓存
    const key = `${pixel[0]},${pixel[1]},${pixel[2]}`;
    
    if (colorMap.has(key)) {
      // 保持原始Alpha值
      return [...colorMap.get(key), pixel[3]];
    }
    
    // 找到最接近的调色板颜色（使用RGB距离）
    let minDistance = Infinity;
    let closestColor = palette[0];
    
    for (const color of palette) {
      const dr = pixel[0] - color[0];
      const dg = pixel[1] - color[1];
      const db = pixel[2] - color[2];
      const distance = Math.sqrt(dr * dr + dg * dg + db * db);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = color;
      }
    }
    
    // 保持原始Alpha值
    const result = [...closestColor, pixel[3]];
    colorMap.set(key, closestColor);
    return result;
  });
  
  return indexedPixels;
}

// 应用版画阴刻效果（深色变黑，浅色变白）
function applyEngravingIntaglio(pixels) {
  console.log('使用版画阴刻效果（黑白二值化，深色→黑，浅色→白）');
  
  const threshold = 128; // 亮度阈值
  
  const indexedPixels = pixels.map(pixel => {
    // 计算亮度（使用加权平均）
    const brightness = 0.299 * pixel[0] + 0.587 * pixel[1] + 0.114 * pixel[2];
    
    // 阴刻：暗部为黑，亮部为白
    const value = brightness < threshold ? 0 : 255;
    
    return [value, value, value, pixel[3]];
  });
  
  return indexedPixels;
}

// 应用版画阳刻效果（深色变白，浅色变黑）
function applyEngravingRelief(pixels) {
  console.log('使用版画阳刻效果（黑白二值化，深色→白，浅色→黑）');
  
  const threshold = 128; // 亮度阈值
  
  const indexedPixels = pixels.map(pixel => {
    // 计算亮度（使用加权平均）
    const brightness = 0.299 * pixel[0] + 0.587 * pixel[1] + 0.114 * pixel[2];
    
    // 阳刻：暗部为白，亮部为黑（与阴刻相反）
    const value = brightness < threshold ? 255 : 0;
    
    return [value, value, value, pixel[3]];
  });
  
  return indexedPixels;
}

// 应用彩虹7色调色板（红橙黄绿蓝靛紫+黑白）
function applyRainbowPalette(pixels) {
  // 定义固定的彩虹调色板（9种颜色）
  const rainbowPalette = [
    [255, 0, 0],     // 红色
    [255, 165, 0],   // 橙色
    [255, 255, 0],   // 黄色
    [0, 255, 0],     // 绿色
    [0, 0, 255],     // 蓝色
    [75, 0, 130],    // 靛色
    [148, 0, 211],   // 紫色
    [255, 255, 255], // 白色
    [0, 0, 0]        // 黑色
  ];
  
  console.log('使用彩虹7色调色板（9种颜色）:', rainbowPalette);
  
  const colorMap = new Map();
  
  // 为每个像素找到最接近的彩虹颜色
  const indexedPixels = pixels.map(pixel => {
    const key = `${pixel[0]},${pixel[1]},${pixel[2]}`;
    
    if (colorMap.has(key)) {
      return [...colorMap.get(key), pixel[3]];
    }
    
    // 找到最接近的彩虹颜色
    let minDistance = Infinity;
    let closestColor = rainbowPalette[0];
    
    for (const color of rainbowPalette) {
      const dr = pixel[0] - color[0];
      const dg = pixel[1] - color[1];
      const db = pixel[2] - color[2];
      const distance = Math.sqrt(dr * dr + dg * dg + db * db);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = color;
      }
    }
    
    // 保持原始Alpha值
    const result = [...closestColor, pixel[3]];
    colorMap.set(key, closestColor);
    return result;
  });
  
  return indexedPixels;
}

// 将像素数组转换回Buffer
function pixelsToBuffer(pixels, width, height, channels) {
  const bufferSize = width * height * channels;
  if (isNaN(bufferSize) || bufferSize <= 0) {
    throw new Error(`无效的缓冲区大小: ${bufferSize}, width: ${width}, height: ${height}, channels: ${channels}`);
  }
  
  const buffer = Buffer.alloc(bufferSize);
  
  for (let i = 0; i < pixels.length; i++) {
    const pixel = pixels[i];
    const idx = i * channels;
    
    if (idx + channels > buffer.length) {
      console.warn(`索引超出范围，跳过剩余像素`);
      break;
    }
    
    // 确保颜色值在有效范围内
    buffer[idx] = Math.min(255, Math.max(0, Math.round(pixel[0])));     // red
    buffer[idx + 1] = Math.min(255, Math.max(0, Math.round(pixel[1]))); // green
    buffer[idx + 2] = Math.min(255, Math.max(0, Math.round(pixel[2]))); // blue
    if (channels > 3) {
      buffer[idx + 3] = Math.min(255, Math.max(0, Math.round(pixel[3]))); // alpha
    }
  }
  
  return buffer;
}

// 图片处理API
app.post('/api/pixelate', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传图片文件' });
    }

    // 从请求体中获取参数
    const { colors = 16, blockSize = 8 } = req.body;
    
    // 如果参数来自FormData，也可能是字符串形式
    const colorCount = ['rainbow', 'engraving-intaglio', 'engraving-relief'].includes(colors) 
      ? colors 
      : parseInt(colors);
    const blockSizeNum = parseInt(blockSize);

    console.log(`Processing image with params: colors=${colorCount}, blockSize=${blockSizeNum}`);

    // 验证参数
    const validColorOptions = ['rainbow', 'engraving-intaglio', 'engraving-relief', 8, 16, 32, 128, 256];
    if (!validColorOptions.includes(colorCount)) {
      return res.status(400).json({ error: '颜色数必须是 rainbow, engraving-intaglio, engraving-relief, 8, 16, 32, 128, 或 256' });
    }

    if (![8, 16, 32].includes(blockSizeNum)) {
      return res.status(400).json({ error: '像素块大小必须是 8, 16, 或 32' });
    }

    // 获取图片元数据
    const metadata = await sharp(req.file.buffer).metadata();

    // 计算缩小后的尺寸
    const newWidth = Math.max(1, Math.floor(metadata.width / blockSizeNum));
    const newHeight = Math.max(1, Math.floor(metadata.height / blockSizeNum));

    console.log(`Original size: ${metadata.width}x${metadata.height}, New size: ${newWidth}x${newHeight}`);

    // 第一步：缩小图片以创建像素块效果
    const smallImageBuffer = await sharp(req.file.buffer)
      .resize(newWidth, newHeight, { 
        kernel: 'nearest' 
      })
      .toBuffer();

    // 第二步：提取像素并应用颜色量化
    const { pixels, width: smallWidth, height: smallHeight, channels } = await bufferToPixels(smallImageBuffer);
    
    console.log(`Extracted ${pixels.length} pixels with ${channels} channels`);
    
    // 应用颜色量化
    const quantizedPixels = applyColorQuantization(pixels, colorCount);
    
    console.log(`Quantized to ${quantizedPixels.length} pixels`);
    
    // 转换回Buffer
    const quantizedBuffer = pixelsToBuffer(quantizedPixels, smallWidth, smallHeight, channels);

    // 第三步：放大回原始尺寸，保持像素化效果
    const processedBuffer = await sharp(quantizedBuffer, {
      raw: {
        width: smallWidth,
        height: smallHeight,
        channels: channels
      }
    })
    .resize(metadata.width, metadata.height, { 
      kernel: 'nearest',  // 使用最近邻插值保持像素块效果
      fit: 'fill'
    })
    .png()
    .toBuffer();

    console.log('Image processed successfully');

    res.set('Content-Type', 'image/png');
    res.send(processedBuffer);
  } catch (error) {
    console.error('图片处理出错:', error);
    res.status(500).json({ error: '图片处理失败', details: error.message });
  }
});

// 导出Excel API
app.post('/api/export-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传图片文件' });
    }

    // 从请求体中获取参数
    const { colors = 16, blockSize = 8 } = req.body;
    
    // 如果参数来自FormData，也可能是字符串形式
    const colorCount = ['rainbow', 'engraving-intaglio', 'engraving-relief'].includes(colors) 
      ? colors 
      : parseInt(colors);
    const blockSizeNum = parseInt(blockSize);

    console.log(`Exporting to Excel with params: colors=${colorCount}, blockSize=${blockSizeNum}`);

    // 验证参数
    const validColorOptions = ['rainbow', 'engraving-intaglio', 'engraving-relief', 8, 16, 32, 128, 256];
    if (!validColorOptions.includes(colorCount)) {
      return res.status(400).json({ error: '颜色数必须是 rainbow, engraving-intaglio, engraving-relief, 8, 16, 32, 128, 或 256' });
    }

    if (![8, 16, 32].includes(blockSizeNum)) {
      return res.status(400).json({ error: '像素块大小必须是 8, 16, 或 32' });
    }

    // 获取图片元数据
    const metadata = await sharp(req.file.buffer).metadata();

    // 计算缩小后的尺寸（像素画的行列数）
    const pixelWidth = Math.max(1, Math.floor(metadata.width / blockSizeNum));
    const pixelHeight = Math.max(1, Math.floor(metadata.height / blockSizeNum));

    console.log(`Pixel grid size: ${pixelWidth}x${pixelHeight}`);

    // 第一步：缩小图片以创建像素块效果
    const smallImageBuffer = await sharp(req.file.buffer)
      .resize(pixelWidth, pixelHeight, { 
        kernel: 'nearest' 
      })
      .toBuffer();

    // 第二步：提取像素并应用颜色量化
    const { pixels, width, height, channels } = await bufferToPixels(smallImageBuffer);
    
    console.log(`Extracted ${pixels.length} pixels`);
    
    // 应用颜色量化
    const quantizedPixels = applyColorQuantization(pixels, colorCount);
    
    console.log(`Quantized to ${quantizedPixels.length} pixels`);

    // 第三步：创建Excel工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pixel Art');

    // 设置单元格为完美正方形（通过调试确定的精确值）
    const columnWidth = 1.33;  // 列宽（字符单位）
    const rowHeight = 10.5;    // 行高（点单位）
    
    // 初始化所有列的宽度
    for (let col = 1; col <= pixelWidth; col++) {
      worksheet.getColumn(col).width = columnWidth;
    }
    
    // 初始化所有行的高度
    for (let row = 1; row <= pixelHeight; row++) {
      worksheet.getRow(row).height = rowHeight;
    }

    // 第四步：填充单元格颜色
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = y * width + x;
        const pixel = quantizedPixels[pixelIndex];
        
        // RGB值转换为十六进制颜色
        const r = Math.min(255, Math.max(0, Math.round(pixel[0])));
        const g = Math.min(255, Math.max(0, Math.round(pixel[1])));
        const b = Math.min(255, Math.max(0, Math.round(pixel[2])));
        const hexColor = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
        
        // 设置单元格背景色
        const cell = worksheet.getCell(y + 1, x + 1);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: hexColor.replace('#', 'FF') } // Excel需要ARGB格式
        };
        
        // 移除边框
        cell.border = {
          top: { style: 'none' },
          left: { style: 'none' },
          bottom: { style: 'none' },
          right: { style: 'none' }
        };
      }
    }

    console.log('Excel file created successfully');

    // 第五步：将工作簿写入buffer并发送
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.set('Content-Disposition', 'attachment; filename="pixel_art.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error('导出Excel出错:', error);
    res.status(500).json({ error: '导出Excel失败', details: error.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 错误处理
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
});