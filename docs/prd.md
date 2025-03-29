
# IdolBooth - Project Requirements (PRD)

## Project Overview

Free AI Idol Photo Booth Online: Create Stunning Idol Photo Strips | IdolBooth.com

Use our free AI Idol Photo Booth online to capture your favorite idol moments. Generate stunning photo strips with advanced AI image processing for high-quality, realistic, and captivating results. Try our free idol photo booth now!


URL Structure:
/
/template
/template/kpop
/template/[{category}]/[{idol}]
/photo-booth?template=classic-01
/photo-strip
/template-creator

拍照、编辑过程实际是动态修改背后 JSON：
[ Template ] → Photo Booth → Photo Strip → Image
全局变量：currentTemplate, photoStripData
📌 处理流程
Template 页面：
用户选择模板，获取 JSON 数据
JSON 初始状态：photos: []，未填充照片

Photo Booth 页面：
读取 currentTemplate.photoBoothSettings，初始化相机相关参数
读取 currentTemplate.photoOverlays，初始化每次拍照的 overlay 图片和位置
读取 currentTemplate 初始化 photoStripData
拍照过程，根据 photoOverlays 随拍照次序更新 Overlay 图片，每次拍照更新 photoStripData 中 photos 列表 

Photo Strip 页面：
使用同一个 photoStripData 数据，进行画布渲染
允许用户调整贴纸、文字，并更新 JSON



1. photo booth 独立为一个组件，读取 photoBoothSettings 参数：
  - aspect ratios: 可选值(1:1, 4:3, 3:2, 4:5)，缺省值是 4:3 
  - photoOverlays:（idol 图片，覆盖在视频流上层，实现和 idol 合照,可选）
  - photo num: 拍照张数(缺省 4张)
根据 aspect ratios 计算视频流尺寸，不让浏览器自动缩放，使用 object-fit: cover 让视频流适配容器
默认 aspectRatios = {
  "1:1": { width: 720, height: 720 },
  "4:3": { width: 960, height: 720 },
  "3:2": { width: 1080, height: 720 },
  "4:5": { width: 576, height: 720 }
};
filter、light color、countdown、sound、photoOverlays 参数可在页面设置
  - sound: true/false(/audio/camera-shutter.map3,缺省关闭)
  - countdown: 1s,3s,5s,10s（缺省 3s）
  - filter:（控制缺省滤镜，可选）
  - light color: （控制补光灯和拍照时候屏幕闪烁灯颜色，可选）
在 app.js 里创建一个共享状态 currentTemplate, photoStripData 包含初始化 photo-booth, photo-strip 相关信息。
photo-booth 使用 currentTemplate 初始化配置，并实时更新 photoStripData（新增照片、调整滤镜等）。
photo-strip 页面直接读取 photoStripData 进行配置初始化和图片渲染。
这里特别注意视频流上方 photoOverlays 的位置、尺寸渲染，以及拍照过程中 Overlay 图片的变换。


2. 用户直接进入 /photo-booth 页面，相机初始化缺省参数进行拍照
3. 用户拍完照之后，进入 /photo-strip 页面，进行编辑、下载等操作
5. 用户也可以直接进入 /photo-strip, 上传自己的照片进行编辑、下载等操作，允许直接拖拽上传、批量上传
6. 用户第二种拍照方案，从 /template/kpop 选模板，点击后进入 /photo-booth/kpop/momo/classic-01 直接拍照
7. 网站有个模版页供用户浏览 /template，每个模版由固定的参数构成，参数结构和 photoStripData 共用

注：在不同设备上，只需要整体缩放整个画布容器，不需要每个元素响应式重新布局，photoOverlays 容器同理

currentTemplate & photoStripData Json 样例:
{
  "photoStripId": "session-20250324-asjzkkn",
  "templateId": "classic-01",
  "category": "kpop",
  "idol": "momo",
  "canvasSize": {
    "width": 1200,
    "height": 1600
  },
  "previewUrl": "https://idolbooth.com/generated/previews/session-20250324-asjzkkn.png",
  "background": {
    "type": "image",
    "url": "https://idolbooth.com/assets/bg_star.jpg",
    "color": "#ffffff"
  },
  "photoPositions": [
    { "x": 100, "y": 100, "width": 400, "height": 500 },
    { "x": 600, "y": 100, "width": 400, "height": 500 },
    { "x": 100, "y": 700, "width": 400, "height": 500 },
    { "x": 600, "y": 700, "width": 400, "height": 500 }
  ],
  "photos": [
    "data:image/png;base64,...", 
    "data:image/png;base64,...", 
    "data:image/png;base64,...", 
    "data:image/png;base64,..."
  ],
  "photoOverlays": [
    {
      "url": "https://idolbooth.com/assets/momo_pose1.png",
      "position": { "x": 50, "y": 100 },
      "scale": 1.2
    },
    {
      "url": "https://idolbooth.com/assets/momo_pose2.png",
      "position": { "x": 40, "y": 120 },
      "scale": 1.1
    },
    {
      "url": "https://idolbooth.com/assets/momo_pose3.png",
      "position": { "x": 60, "y": 90 },
      "scale": 1.3
    },
    {
      "url": "https://idolbooth.com/assets/momo_pose4.png",
      "position": { "x": 55, "y": 110 },
      "scale": 1.0
    }
  ],
  "decoration": [
    {
      "type": "sticker",
      "url": "https://idolbooth.com/assets/star.png",
      "position": { "x": 200, "y": 300 },
      "scale": 0.8
    },
    {
      "type": "frame",
      "url": "https://idolbooth.com/assets/classic_frame.png",
      "position": { "x": 0, "y": 0 },
      "scale": 1.0
    }
  ],
  "text": {
    "content": "With Momo ❤️",
    "font": "Arial",
    "size": 24,
    "color": "#FF4081",
    "position": { "x": 100, "y": 1500 }
  },
  "photoBoothSettings": {
    "aspectRatio": "4:3",
    "countdown": 3,
    "photoNum": 4,
    "filter": "soft",
    "lightColor": "#FFD700",
    "sound": true
  }
}


templateId	string	模板 ID
photoStripId	string	该次拍摄的唯一 ID
category	string	归属分类（如 kpop, jpop）
idol	string	偶像名称
previewUrl	string	该模板的预览图片 URL
photoOverlays	object	偶像照片和位置信息（实现合影）
photoBoothSettings	object	photo-booth 拍照时的参数，如倒计时、滤镜等

canvasSize	object	画布大小，宽高单位 px
background	object	背景设置（图片或纯色）
photoPositions	array	计算照片在 canvas 上的坐标
photos	array	 canvas 上的照片,拍摄得到的照片
decoration	array	贴纸、边框等装饰元素
text	object	文字内容、样式、位置




## Core Features

### 1. Photo Capture

- **Multiple Capture Methods**:
  - Webcam capture with countdown timer
  - Photo upload from device

- **Photo Strip Creation**:
  - Support for capturing up to 1 - n photos in sequence
  - Support for different aspect ratios (1:1, 4:3, 3:2)
  - 默认使用 4 张 photos

### 2. Photo Strip Customization

- **Background Color Selection**:
  - Predefined color palette
  - Custom color input option

- **Personalization**:
  - Custom caption text
  - Date display toggle
  - Automatic branding with "IdolBooth" watermark

### 3. Output Options

- **Download**:
  - High-quality JPEG download
  - Optimized for sharing and printing

- **Print**:
  - Direct print functionality
  - Print-friendly formatting

- **Sharing**:
  - Native device sharing when available
  - Fallback to download when sharing API is not supported

## User Experience Requirements

- **Responsiveness**:
  - Fully responsive design across all device sizes
  - Optimized UI for both mobile and desktop

- **Accessibility**:
  - Clear, readable text
  - Intuitive controls
  - Proper contrast ratios

- **Performance**:
  - Fast photo processing
  - Optimized canvas rendering
  - Minimal loading times

## Technical Requirements

- **Browser Compatibility**:
  - Support for all modern browsers
  - Graceful degradation for older browsers

- **Security**:
  - All processing done client-side
  - No unnecessary data collection

- **Maintainability**:
  - Well-structured, componentized code
  - Clear documentation
  - Type safety with TypeScript
