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
			sound: true,
		},
		canvasSize: {
			width: 1200,
			height: 1600,
		},
		background: {
			type: "color",
			color: "#ffffff",
		},
		photoPositions: [
			{ x: 100, y: 100, width: 400, height: 500 },
			{ x: 600, y: 100, width: 400, height: 500 },
			{ x: 100, y: 700, width: 400, height: 500 },
			{ x: 600, y: 700, width: 400, height: 500 },
		],
		previewUrl: "/placeholder.svg",
		photoOverlays: [
			{
				url: "/placeholder.svg",
				position: { x: 50, y: 100 },
				scale: 1.2,
			},
			{
				url: "/placeholder.svg",
				position: { x: 40, y: 120 },
				scale: 1.1,
			},
			{
				url: "/placeholder.svg",
				position: { x: 60, y: 90 },
				scale: 1.3,
			},
			{
				url: "/placeholder.svg",
				position: { x: 55, y: 110 },
				scale: 1.0,
			},
		],
		decoration: [
			{
				type: "sticker",
				url: "/placeholder.svg",
				position: {
					x: 200,
					y: 300,
				},
				scale: 0.8,
			},
			{
				type: "frame",
				url: "/placeholder.svg",
			},
		],
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
			sound: true,
		},
		canvasSize: {
			width: 1200,
			height: 1200,
		},
		background: {
			type: "color",
			color: "#FFF0F5",
		},
		photoPositions: [
			{ x: 100, y: 100, width: 400, height: 400 },
			{ x: 600, y: 100, width: 400, height: 400 },
			{ x: 100, y: 600, width: 400, height: 400 },
			{ x: 600, y: 600, width: 400, height: 400 },
		],
		previewUrl: "/placeholder.svg",
		photoOverlays: [
			{
				url: "/placeholder.svg",
				position: { x: 70, y: 150 },
				scale: 1.0,
			},
			{
				url: "/placeholder.svg",
				position: { x: 75, y: 155 },
				scale: 1.0,
			},
			{
				url: "/placeholder.svg",
				position: { x: 65, y: 145 },
				scale: 1.0,
			},
			{
				url: "/placeholder.svg",
				position: { x: 80, y: 160 },
				scale: 1.0,
			},
		],
		decoration: [
			{
				type: "sticker",
				url: "/placeholder.svg",
				position: {
					x: 300,
					y: 400,
				},
				scale: 1.0,
			},
		],
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
			sound: false,
		},
		canvasSize: {
			width: 1200,
			height: 800,
		},
		background: {
			type: "color",
			color: "#F0F8FF",
		},
		photoPositions: [
			{ x: 50, y: 50, width: 500, height: 333 },
			{ x: 650, y: 50, width: 500, height: 333 },
			{ x: 50, y: 417, width: 500, height: 333 },
			{ x: 650, y: 417, width: 500, height: 333 },
		],
		previewUrl: "/placeholder.svg",
		photoOverlays: [
			{
				url: "/placeholder.svg",
				position: { x: 100, y: 200 },
				scale: 1.1,
			},
			{
				url: "/placeholder.svg",
				position: { x: 105, y: 205 },
				scale: 1.1,
			},
			{
				url: "/placeholder.svg",
				position: { x: 95, y: 195 },
				scale: 1.1,
			},
			{
				url: "/placeholder.svg",
				position: { x: 110, y: 210 },
				scale: 1.1,
			},
		],
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
			sound: false,
		},
		canvasSize: {
			width: 480,
			height: 1600,
		},
		background: {
			type: "color",
			color: "#FFFFFF",
			imageUrl: "/images/templates/preview_1.png",
		},
		photoPositions: [
			{ x: 40, y: 120, width: 400, height: 300, borderRadius: 10 },
			{ x: 40, y: 450, width: 400, height: 300, borderRadius: 10 },
			{ x: 40, y: 780, width: 400, height: 300, borderRadius: 10 },
			{ x: 40, y: 1110, width: 400, height: 300, borderRadius: 10 },
		],
		photoOverlays: [
			{
				url: "/images/templates/template_1.png",
				position: { x: 0, y: 0 },
				scale: 1.0,
				photoPosition: { width: 480, height: 1600, x: 0, y: 0 },
			}
		],
		previewUrl: "/images/templates/preview_1.png",
	},
	{
		templateId: "y2k-style-01",
		category: "general",
		photoBoothSettings: {
			aspectRatio: "4:3",
			countdown: 3,
			photoNum: 3,
			filter: "Normal",
			lightColor: "#FFFFFF",
			sound: true,
		},
		canvasSize: {
			width: 480,
			height: 1600,
		},
		background: {
			type: "image",
			color: "#8B8BF5", // 紫蓝色背景
			imageUrl: "/images/templates/preview_2.png",
		},
		photoPositions: [
			{ x: 40, y: 120, width: 400, height: 300, borderRadius: 10 },
			{ x: 40, y: 550, width: 400, height: 300, borderRadius: 10 },
			{ x: 40, y: 980, width: 400, height: 300, borderRadius: 10 },
		],
		previewUrl: "/images/templates/preview_2.png",
		photoOverlays: [
			{
				url: "/images/templates/template_2.png",
				position: { x: 0, y: 0 },
				scale: 1.0,
				photoPosition: { width: 480, height: 1600, x: 0, y: 0 },
			}
		],
	},
];

export const getTemplate = (templateId: string): Template | undefined => {
	return templates.find((template) => template.templateId === templateId);
};

export const getTemplatesByCategory = (category: string): Template[] => {
	return templates.filter((template) => template.category === category);
};

export const getTemplatesByIdol = (idol: string): Template[] => {
	return templates.filter((template) => template.idol === idol);
};

export const getAllCategories = (): string[] => {
	const categories = new Set(templates.map((template) => template.category));
	return Array.from(categories);
};

export const getAllIdolsByCategory = (category: string): string[] => {
	const templates = getTemplatesByCategory(category);
	const idols = new Set(templates.map((template) => template.idol).filter(Boolean) as string[]);
	return Array.from(idols);
};
