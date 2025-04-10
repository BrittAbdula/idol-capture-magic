import { Template } from "../contexts/PhotoStripContext";

// Sample template data - in a real application this would come from an API or database
export const templates: Template[] = [
	{
		templateId: "classic-01",
		category: "kpop",
		idol: "sunghoon",
		photoBoothSettings: {
			aspectRatio: "4:3",
			countdown: 1,
			photoNum: 4,
			filter: "Warm",
			lightColor: "#FFD700",
			sound: true,
		},
		canvasSize: {
			width: 429,
			height: 1296,
		},
		background: {
			type: "image",
			color: "#ffffff",
			imageUrl: "/images/templates/idol/sunghoon_picframe_1.png",
			overlayUrl: "/images/templates/idol/sunghoon_picframe_1.png",
		},
		photoPositions: [
			{ x: 34, y: 72, width: 400, height: 300 },
			{ x: 34, y: 372, width: 400, height: 300},
			{ x: 34, y: 672, width: 400, height: 300},
			{ x: 34, y: 972, width: 400, height: 300},
		],
		previewUrl: "/images/templates/idol/sunghoon_photoism.jpg",
		photoOverlays: [
			{
				url: "/images/templates/idol/sunghoon_1.png",
				position: { x: 0, y: 0 }, // 相对照片的左上角的xy
				scale: 1,
			},

			{
				url: "/images/templates/idol/sunghoon_2.png",
				position: { x: 0, y: 0 },
				scale: 1,
			},
			{
				url: "/images/templates/idol/sunghoon_3.png",
				position: { x: 0, y: 0 },
				scale: 1,
			},
			{
				url: "/images/templates/idol/sunghoon_4.png",
				position: { x: 0, y: 0 },
				scale: 1,
			},

			// {
			// 	url: "/images/templates/idol/sunghoon_3.png",
			// 	position: { x: 34, y: 672 },
			// 	scale: 1,
			// },
		],
		decoration: [
			// {
			// 	type: "sticker",
			// 	url: "/placeholder.svg",
			// 	position: {
			// 		x: 200,
			// 		y: 300,
			// 	},
			// 	scale: 0.8,
			// },
			// {
			// 	type: "frame",
			// 	url: "/placeholder.svg",
			// },
		],
	},
	{
		templateId: "standard-01",
		category: "general",
		photoBoothSettings: {
			aspectRatio: "47:29",
			countdown: 3,
			photoNum: 4,
			filter: "Normal",
			lightColor: "#FFFFFF",
			sound: false,
		},
		canvasSize: {
			width: 591,
			height: 1772,
		},
		background: {
			type: "image",
			color: "#FFFFFF",
			imageUrl: "/images/templates/template_1_1.png",
			overlayUrl: "/images/templates/template_1_2.png",
		},
		photoPositions: [
			{ x: 60, y: 110, width: 470, height: 290, borderRadius: 10 },
			{ x: 60, y: 450, width: 470, height: 290, borderRadius: 10 },
			{ x: 60, y: 780, width: 470, height: 290, borderRadius: 10 },
			{ x: 60, y: 1112, width: 470, height: 290, borderRadius: 10 },
			
		],
		previewUrl: "/images/templates/template_1_3.png",
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
