// 多语言支持配置
const translations = {
  'zh-CN': {
    // 页面标题
    'page.title': '像素画生成器 - Pixel Art Generator',
    'page.subtitle': '一键转换复古像素风',
    
    // 上传区域
    'upload.dragText': '拖拽图片至此或',
    'upload.selectFile': '选择文件',
    'upload.originalPreview': '原图预览',
    'upload.resultPreview': '像素画预览',
    'upload.processing': '处理中...',
    
    // 控制面板
    'controls.colorDepth': '色彩位数:',
    'controls.rainbow': '彩虹7色',
    'controls.engravingIntaglio': '版画阴刻',
    'controls.engravingRelief': '版画阳刻',
    'controls.blockSize': '像素块大小:',
    
    // 按钮
    'button.generate': '生成像素画',
    'button.reset': '重置',
    'button.download': '下载图片',
    'button.exportExcel': '导出Excel',
    
    // 页脚提示
    'footer.tipsTitle': '💡 使用建议',
    'footer.recommendedFormat': '推荐格式：',
    'footer.recommendedFormatDesc': 'PNG（支持透明）、JPEG（通用）、WebP（高效）',
    'footer.fileSize': '文件大小：',
    'footer.fileSizeDesc': '建议控制在 5MB 以内，最大支持 10MB',
    'footer.resolution': '分辨率：',
    'footer.resolutionDesc': '建议 4000×4000 像素以内',
    'footer.transparent': '透明背景：',
    'footer.transparentDesc': '需要透明效果请使用 PNG 或 WebP 格式',
    'footer.supportedFormats': '支持的格式：',
    'footer.formatsList': 'JPG, PNG, WebP, GIF, TIFF, SVG, AVIF, HEIC',
    'footer.copyright': '© 2023 Pixel Art Generator | 使用 Node.js & Sharp 构建',
    
    // 错误消息
    'error.selectImage': '请选择图片文件！',
    'error.fileTooLarge': '文件大小不能超过10MB！',
    'error.generateFirst': '请先生成像素画！',
    'error.uploadFirst': '请先上传图片！',
    'error.generationFailed': '生成失败',
    'error.exportFailed': '导出失败',
    'error.prefix': '错误: '
  },
  
  'en-US': {
    // Page title
    'page.title': 'Pixel Art Generator',
    'page.subtitle': 'One-click retro pixel art conversion',
    
    // Upload area
    'upload.dragText': 'Drag image here or',
    'upload.selectFile': 'Select File',
    'upload.originalPreview': 'Original Preview',
    'upload.resultPreview': 'Pixel Art Preview',
    'upload.processing': 'Processing...',
    
    // Control panel
    'controls.colorDepth': 'Color Depth:',
    'controls.rainbow': 'Rainbow 7 Colors',
    'controls.engravingIntaglio': 'Engraving Intaglio',
    'controls.engravingRelief': 'Engraving Relief',
    'controls.blockSize': 'Block Size:',
    
    // Buttons
    'button.generate': 'Generate Pixel Art',
    'button.reset': 'Reset',
    'button.download': 'Download Image',
    'button.exportExcel': 'Export Excel',
    
    // Footer tips
    'footer.tipsTitle': '💡 Tips',
    'footer.recommendedFormat': 'Recommended Format:',
    'footer.recommendedFormatDesc': 'PNG (supports transparency), JPEG (universal), WebP (efficient)',
    'footer.fileSize': 'File Size:',
    'footer.fileSizeDesc': 'Recommended under 5MB, max 10MB',
    'footer.resolution': 'Resolution:',
    'footer.resolutionDesc': 'Recommended under 4000×4000 pixels',
    'footer.transparent': 'Transparent Background:',
    'footer.transparentDesc': 'Use PNG or WebP for transparency',
    'footer.supportedFormats': 'Supported Formats:',
    'footer.formatsList': 'JPG, PNG, WebP, GIF, TIFF, SVG, AVIF, HEIC',
    'footer.copyright': '© 2023 Pixel Art Generator | Built with Node.js & Sharp',
    
    // Error messages
    'error.selectImage': 'Please select an image file!',
    'error.fileTooLarge': 'File size cannot exceed 10MB!',
    'error.generateFirst': 'Please generate pixel art first!',
    'error.uploadFirst': 'Please upload an image first!',
    'error.generationFailed': 'Generation failed',
    'error.exportFailed': 'Export failed',
    'error.prefix': 'Error: '
  }
};

// 当前语言
let currentLang = localStorage.getItem('pixelArtLang') || 'zh-CN';

// 获取翻译文本
function t(key) {
  return translations[currentLang][key] || key;
}

// 更新页面所有翻译
function updateLanguage() {
  // 更新带有 data-i18n 属性的元素
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (key && translations[currentLang][key]) {
      // 检查是否是 input 或 button 的 value/textContent
      if (element.tagName === 'INPUT' || element.tagName === 'BUTTON') {
        element.textContent = translations[currentLang][key];
      } else {
        element.textContent = translations[currentLang][key];
      }
    }
  });
  
  // 更新页面标题
  document.title = t('page.title');
  
  // 更新 HTML lang 属性
  document.documentElement.lang = currentLang;
  
  // 保存语言偏好
  localStorage.setItem('pixelArtLang', currentLang);
}

// 切换语言
function toggleLanguage() {
  currentLang = currentLang === 'zh-CN' ? 'en-US' : 'zh-CN';
  updateLanguage();
}

// 页面加载时初始化语言
document.addEventListener('DOMContentLoaded', () => {
  updateLanguage();
});