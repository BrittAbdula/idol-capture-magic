
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

1. photo booth 独立为一个组件，可以接收 template 参数：
  - aspect ratios: 可选值(1:1, 4:3, 3:2, 4:5)，缺省值是 4:3 
  - idol 图片:（部分区域透明，覆盖在视频流上层，实现和 idol 合照,可选）
  - photo num: 拍照张数(缺省 4张)
根据 aspect ratios 计算视频流尺寸，不让浏览器自动缩放，使用 object-fit: cover 让视频流适配容器
默认 aspectRatios = {
  "1:1": { width: 720, height: 720 },
  "4:3": { width: 960, height: 720 },
  "3:2": { width: 1080, height: 720 },
  "4:5": { width: 576, height: 720 }
};
filter、light color、countdown、sound 参数可在页面底部设置
  - sound: true/false(/audio/camera-shutter.map3,缺省关闭)
  - countdown: 1s,3s,5s,10s（缺省 3s）
  - filter:（控制缺省滤镜，可选）
  - light color: （控制补光灯和拍照时候屏幕闪烁灯颜色，可选）
在 app.js 里创建一个共享状态 photoStripData，包含完整的 photo-strip JSON。
在 photo-booth 过程中实时更新 photoStripData（新增照片、调整滤镜等）。
photo-strip 页面直接读取 photoStripData。

2. 用户直接进入 /photo-booth 页面，相机初始化缺省参数进行拍照
3. 用户拍完照之后，点击进入 /photo-strip 页面（即当前的 result 页面），进行编辑、下载等操作
5. 用户也可以直接进入 /photo-strip, 上传自己的照片进行编辑、下载等操作
6. 用户第二种拍照方案，从 /template/kpop 选模板，点击后进入 /photo-booth/kpop/momo/classic-01 直接拍照
7. 网站有个模版页供用户浏览 /template，每个模版由固定的参数构成
8. 每个模版由固定的参数构成，一部分用于 Photo booth 参数输入，一部分用户生成 Photo strip ：

注：在不同设备上，只需要整体缩放整个画布容器，不需要每个元素响应式重新布局

Template JSON 结构样例
{
  "templateId": "classic-01",
  "category": "kpop",
  "idol": "momo",
  "aspectRatio": "4:3",
  "resolution": {
    "width": 960,
    "height": 720
  },
  "countdown": 3,
  "photoNum": 4,
  "filter": "soft",
  "lightColor": "#FFD700",
  "idolOverlay": {
    "url": "https://idolbooth.com/assets/momo_classic.png",
    "position": {
      "x": 50,
      "y": 100
    },
    "scale": 1.2
  },
  "decoration": [
    {
      "type": "sticker",
      "url": "https://idolbooth.com/assets/star.png",
      "position": {
        "x": 200,
        "y": 300
      },
      "scale": 0.8
    },
    {
      "type": "frame",
      "url": "https://idolbooth.com/assets/classic_frame.png"
    }
  ],
  "sound": true
}


Photo-Strip JSON 结构样例
{
  "photoStripId": "session-20250324-asjzkkn",
  "templateId": "classic-01",
  "category": "kpop",
  "idol": "momo",
  "canvasSize": {
    "width": 1200,
    "height": 1600
  },
  "background": {
    "type": "image",
    "url": "https://idolbooth.com/assets/bg_star.jpg",
    "color": "#ffffff"
  },
  "photoPositions": [
    {
      "x": 100,
      "y": 100,
      "width": 400,
      "height": 500
    },
    {
      "x": 600,
      "y": 100,
      "width": 400,
      "height": 500
    },
    {
      "x": 100,
      "y": 700,
      "width": 400,
      "height": 500
    },
    {
      "x": 600,
      "y": 700,
      "width": 400,
      "height": 500
    }
  ],
  "photos": [
    "data:image/png;base64,...", 
    "data:image/png;base64,...", 
    "data:image/png;base64,...", 
    "data:image/png;base64,..."
  ],
  "frame": {
    "url": "https://idolbooth.com/assets/classic_frame.png"
  },
  "stickers": [
    {
      "url": "https://idolbooth.com/assets/heart.png",
      "x": 50,
      "y": 50,
      "scale": 1.0
    }
  ],
  "text": {
    "content": "With Momo ❤️",
    "font": "Arial",
    "size": 24,
    "color": "#FF4081",
    "position": {
      "x": 100,
      "y": 1500
    }
  }
}





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
