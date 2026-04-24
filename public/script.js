document.addEventListener('DOMContentLoaded', () => {
  // 获取DOM元素
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  const selectFileBtn = document.getElementById('selectFileBtn');
  const originalPreview = document.getElementById('originalPreview');
  const resultPreview = document.getElementById('resultPreview');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const generateBtn = document.getElementById('generateBtn');
  const resetBtn = document.getElementById('resetBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const exportExcelBtn = document.getElementById('exportExcelBtn');
  const langToggleBtn = document.getElementById('langToggleBtn');
  
  let currentImage = null;
  let currentResult = null;
  
  // 语言切换按钮点击事件
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
      toggleLanguage();
      // 更新按钮文本
      langToggleBtn.textContent = currentLang === 'zh-CN' ? '🌐 中文' : '🌐 English';
    });
    
    // 初始化按钮文本
    langToggleBtn.textContent = currentLang === 'zh-CN' ? '🌐 中文' : '🌐 English';
  }
  
  // 选择文件按钮点击事件
  selectFileBtn.addEventListener('click', () => {
    fileInput.click();
  });
  
  // 文件输入改变事件
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  });
  
  // 拖拽上传事件
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#666';
    uploadArea.style.backgroundColor = '#252525';
  });
  
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '#444';
    uploadArea.style.backgroundColor = '#222';
  });
  
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#444';
    uploadArea.style.backgroundColor = '#222';
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  });
  
  // 处理图片上传
  function handleImageUpload(file) {
    // 验证文件类型
    if (!file.type.match('image.*')) {
      alert(t('error.selectImage'));
      return;
    }
    
    // 验证文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert(t('error.fileTooLarge'));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      // 显示原图预览
      const img = document.createElement('img');
      img.src = e.target.result;
      
      // 清空预览区域并添加图片
      originalPreview.innerHTML = '';
      originalPreview.appendChild(img);
      
      // 保存当前图片
      currentImage = file;
      
      // 启用生成按钮
      generateBtn.disabled = false;
    };
    
    reader.readAsDataURL(file);
  }
  
  // 生成按钮点击事件
  generateBtn.addEventListener('click', generatePixelArt);
  
  // 重置按钮点击事件
  resetBtn.addEventListener('click', () => {
    // 重置表单
    fileInput.value = '';
    originalPreview.innerHTML = '<p>原图预览</p>';
    resultPreview.innerHTML = '<p>像素画预览</p>';
    currentImage = null;
    currentResult = null;
    generateBtn.disabled = true;
    downloadBtn.disabled = true;
    exportExcelBtn.disabled = true;
    
    // 重置参数为默认值
    const colorDepthInput = document.querySelector('input[name="colorDepth"][value="8"]');
    if (colorDepthInput) {
        colorDepthInput.checked = true;
    } else {
        // 如果没有8色选项，回退到16色或其他默认逻辑，这里保持健壮性
        const fallbackInput = document.querySelector('input[name="colorDepth"][value="16"]');
        if (fallbackInput) fallbackInput.checked = true;
    }
    
    const blockSizeInput = document.querySelector('input[name="blockSize"][value="8"]');
    if (blockSizeInput) {
        blockSizeInput.checked = true;
    }
  });
  
  // 下载按钮点击事件
  downloadBtn.addEventListener('click', () => {
    if (!currentResult) {
      alert(t('error.generateFirst'));
      return;
    }
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = currentResult;
    link.download = `pixel_art_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
  
  // 导出Excel按钮点击事件
  exportExcelBtn.addEventListener('click', exportToExcel);
  
  // 生成像素画函数
  async function generatePixelArt() {
    if (!currentImage) {
      alert(t('error.uploadFirst'));
      return;
    }
    
    // 获取参数
    const colorDepth = document.querySelector('input[name="colorDepth"]:checked').value;
    const blockSize = document.querySelector('input[name="blockSize"]:checked').value;
    
    // 显示加载指示器
    loadingIndicator.classList.remove('hidden');
    resultPreview.innerHTML = '';
    resultPreview.appendChild(loadingIndicator);
    
    try {
      // 创建 FormData 对象
      const formData = new FormData();
      formData.append('file', currentImage);
      formData.append('colors', colorDepth);
      formData.append('blockSize', blockSize);
      
      // 发送请求
      const response = await fetch('/api/pixelate', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        // 尝试解析错误信息，如果响应不是JSON则使用默认消息
        let errorMessage = t('error.generationFailed');
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          // 忽略解析错误，使用默认消息
        }
        throw new Error(errorMessage);
      }
      
      // 获取响应数据
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      
      // 释放之前的 Object URL 以避免内存泄漏
      if (currentResult) {
        URL.revokeObjectURL(currentResult);
      }
      
      // 更新结果预览
      const img = document.createElement('img');
      img.src = imageUrl;
      resultPreview.innerHTML = '';
      resultPreview.appendChild(img);
      
      // 保存结果用于下载
      currentResult = imageUrl;
      
      // 启用下载按钮和导出Excel按钮
      downloadBtn.disabled = false;
      exportExcelBtn.disabled = false;
    } catch (error) {
      console.error('生成像素画时出错:', error);
      resultPreview.innerHTML = `<p style="color: #ff6b6b;">${t('error.prefix')}${error.message}</p>`;
    } finally {
      // 隐藏加载指示器
      loadingIndicator.classList.add('hidden');
    }
  }
  
  // 导出为Excel函数
  async function exportToExcel() {
    if (!currentImage) {
      alert(t('error.uploadFirst'));
      return;
    }
    
    // 获取参数
    const colorDepth = document.querySelector('input[name="colorDepth"]:checked').value;
    const blockSize = document.querySelector('input[name="blockSize"]:checked').value;
    
    try {
      // 显示加载指示器
      loadingIndicator.classList.remove('hidden');
      resultPreview.innerHTML = '';
      resultPreview.appendChild(loadingIndicator);
      
      // 创建 FormData 对象
      const formData = new FormData();
      formData.append('file', currentImage);
      formData.append('colors', colorDepth);
      formData.append('blockSize', blockSize);
      
      // 发送请求到后端生成Excel文件
      const response = await fetch('/api/export-excel', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        let errorMessage = t('error.exportFailed');
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          // 忽略解析错误
        }
        throw new Error(errorMessage);
      }
      
      // 获取Excel文件blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // 创建下载链接
      const link = document.createElement('a');
      link.href = url;
      link.download = `pixel_art_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 释放URL对象
      URL.revokeObjectURL(url);
      
      // 恢复预览
      if (currentResult) {
        const img = document.createElement('img');
        img.src = currentResult;
        resultPreview.innerHTML = '';
        resultPreview.appendChild(img);
      }
    } catch (error) {
      console.error('导出Excel时出错:', error);
      resultPreview.innerHTML = `<p style="color: #ff6b6b;">${t('error.prefix')}${error.message}</p>`;
    } finally {
      // 隐藏加载指示器
      loadingIndicator.classList.add('hidden');
    }
  }
});