
import { Template } from "../contexts/PhotoStripContext";

// Sample template data - in a real application this would come from an API or database
export const templates: Template[] = [
  {
    templateId: "classic-01",
    category: "kpop",
    idol: "momo",
    photoBoothSettings: {
      aspectRatio: "4:3",
      countdown: 3,
      photoNum: 4,
      filter: "Warm",
      lightColor: "#FFD700",
      sound: true
    },
    canvasSize: {
      width: 1200,
      height: 1600
    },
    background: {
      type: "color",
      color: "#ffffff"
    },
    photoPositions: [
      { x: 100, y: 100, width: 400, height: 500 },
      { x: 600, y: 100, width: 400, height: 500 },
      { x: 100, y: 700, width: 400, height: 500 },
      { x: 600, y: 700, width: 400, height: 500 }
    ],
    previewUrl: "https://store.genmojionline.com/cdn-cgi/imagedelivery/DEOVdDdfeGzASe0KdtD7FA//0cb13c3f-fa14-4d45-087b-34e33c3db000/public",
    photoOverlays: [
      {
        url: "https://store.genmojionline.com/cdn-cgi/imagedelivery/DEOVdDdfeGzASe0KdtD7FA//0cb13c3f-fa14-4d45-087b-34e33c3db000/public",
        position: { x: 50, y: 100 },
        scale: 1.2
      },
      {
        url: "https://store.genmojionline.com/cdn-cgi/imagedelivery/DEOVdDdfeGzASe0KdtD7FA//3a3f5674-e5fc-4669-9a30-56417377a600/public",
        position: { x: 40, y: 120 },
        scale: 1.1
      },
      {
        url: "https://store.genmojionline.com/cdn-cgi/imagedelivery/DEOVdDdfeGzASe0KdtD7FA//9c7c18ba-a1e8-47e6-1614-656a1867c200/public",
        position: { x: 60, y: 90 },
        scale: 1.3
      },
      {
        url: "https://store.genmojionline.com/cdn-cgi/imagedelivery/DEOVdDdfeGzASe0KdtD7FA//27d2bac5-281d-4ca6-006a-1301afd6dc00/public",
        position: { x: 55, y: 110 },
        scale: 1.0
      }
    ],
    decoration: [
    ]
  },
  {
    templateId: "cute-01",
    category: "kpop",
    idol: "lisa",
    photoBoothSettings: {
      aspectRatio: "1:1",
      countdown: 5,
      photoNum: 4,
      filter: "Vintage",
      lightColor: "#FF9999",
      sound: true
    },
    canvasSize: {
      width: 1200,
      height: 1200
    },
    background: {
      type: "color",
      color: "#FFF0F5"
    },
    photoPositions: [
      { x: 100, y: 100, width: 400, height: 400 },
      { x: 600, y: 100, width: 400, height: 400 },
      { x: 100, y: 600, width: 400, height: 400 },
      { x: 600, y: 600, width: 400, height: 400 }
    ],
    previewUrl: "/placeholder.svg",
    photoOverlays: [
      {
        url: "/placeholder.svg",
        position: { x: 70, y: 150 },
        scale: 1.0
      },
      {
        url: "/placeholder.svg",
        position: { x: 75, y: 155 },
        scale: 1.0
      },
      {
        url: "/placeholder.svg",
        position: { x: 65, y: 145 },
        scale: 1.0
      },
      {
        url: "/placeholder.svg",
        position: { x: 80, y: 160 },
        scale: 1.0
      }
    ],
    decoration: [
      {
        type: "sticker",
        url: "/placeholder.svg",
        position: {
          x: 300,
          y: 400
        },
        scale: 1.0
      }
    ]
  },
  {
    templateId: "cool-01",
    category: "kpop",
    idol: "jimin",
    photoBoothSettings: {
      aspectRatio: "3:2",
      countdown: 3,
      photoNum: 4,
      filter: "Cool",
      lightColor: "#99CCFF",
      sound: false
    },
    canvasSize: {
      width: 1200,
      height: 800
    },
    background: {
      type: "color",
      color: "#F0F8FF"
    },
    photoPositions: [
      { x: 50, y: 50, width: 500, height: 333 },
      { x: 650, y: 50, width: 500, height: 333 },
      { x: 50, y: 417, width: 500, height: 333 },
      { x: 650, y: 417, width: 500, height: 333 }
    ],
    previewUrl: "/placeholder.svg",
    photoOverlays: [
      {
        url: "/placeholder.svg",
        position: { x: 100, y: 200 },
        scale: 1.1
      },
      {
        url: "/placeholder.svg",
        position: { x: 105, y: 205 },
        scale: 1.1
      },
      {
        url: "/placeholder.svg",
        position: { x: 95, y: 195 },
        scale: 1.1
      },
      {
        url: "/placeholder.svg",
        position: { x: 110, y: 210 },
        scale: 1.1
      }
    ]
  },
  {
    templateId: "standard-01",
    category: "general",
    photoBoothSettings: {
      aspectRatio: "4:3",
      countdown: 3,
      photoNum: 4,
      filter: "Normal",
      lightColor: "#FFFFFF",
      sound: false
    },
    canvasSize: {
      width: 1200,
      height: 1600
    },
    background: {
      type: "color",
      color: "#FFFFFF"
    },
    photoPositions: [
      { x: 100, y: 100, width: 400, height: 500 },
      { x: 600, y: 100, width: 400, height: 500 },
      { x: 100, y: 700, width: 400, height: 500 },
      { x: 600, y: 700, width: 400, height: 500 }
    ],
    previewUrl: "/placeholder.svg"
  }
];

export const getTemplate = (templateId: string): Template | undefined => {
  return templates.find(template => template.templateId === templateId);
};

export const getTemplatesByCategory = (category: string): Template[] => {
  return templates.filter(template => template.category === category);
};

export const getTemplatesByIdol = (idol: string): Template[] => {
  return templates.filter(template => template.idol === idol);
};

export const getAllCategories = (): string[] => {
  const categories = new Set(templates.map(template => template.category));
  return Array.from(categories);
};

export const getAllIdolsByCategory = (category: string): string[] => {
  const templates = getTemplatesByCategory(category);
  const idols = new Set(templates.map(template => template.idol).filter(Boolean) as string[]);
  return Array.from(idols);
};
