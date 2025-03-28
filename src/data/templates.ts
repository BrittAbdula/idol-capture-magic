
import { Template } from "../contexts/PhotoStripContext";

// Sample template data - in a real application this would come from an API or database
export const templates: Template[] = [
  {
    templateId: "classic-01",
    category: "kpop",
    idol: "momo",
    aspectRatio: "4:3",
    resolution: {
      width: 960,
      height: 720
    },
    countdown: 3,
    photoNum: 4,
    filter: "Warm",
    lightColor: "#FFD700",
    idolOverlay: {
      url: "/placeholder.svg",
      position: {
        x: 50,
        y: 100
      },
      scale: 1.2
    },
    decoration: [
      {
        type: "sticker",
        url: "/placeholder.svg",
        position: {
          x: 200,
          y: 300
        },
        scale: 0.8
      },
      {
        type: "frame",
        url: "/placeholder.svg"
      }
    ],
    sound: true
  },
  {
    templateId: "cute-01",
    category: "kpop",
    idol: "lisa",
    aspectRatio: "1:1",
    resolution: {
      width: 720,
      height: 720
    },
    countdown: 5,
    photoNum: 4,
    filter: "Vintage",
    lightColor: "#FF9999",
    idolOverlay: {
      url: "/placeholder.svg",
      position: {
        x: 70,
        y: 150
      },
      scale: 1.0
    },
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
    ],
    sound: true
  },
  {
    templateId: "cool-01",
    category: "kpop",
    idol: "jimin",
    aspectRatio: "3:2",
    resolution: {
      width: 1080,
      height: 720
    },
    countdown: 3,
    photoNum: 4,
    filter: "Cool",
    lightColor: "#99CCFF",
    idolOverlay: {
      url: "/placeholder.svg",
      position: {
        x: 100,
        y: 200
      },
      scale: 1.1
    },
    sound: false
  },
  {
    templateId: "standard-01",
    category: "general",
    aspectRatio: "4:3",
    resolution: {
      width: 960,
      height: 720
    },
    countdown: 3,
    photoNum: 4,
    filter: "Normal",
    sound: false
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
