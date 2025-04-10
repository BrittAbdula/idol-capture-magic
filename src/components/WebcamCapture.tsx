import React, { useRef, useState, useCallback, useEffect } from "react";
import { Camera, FlipHorizontal, Grid3X3 } from "lucide-react";
import { toast } from "sonner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PhotoOverlay } from "@/contexts/PhotoStripContext";

interface WebcamCaptureProps {
	onCapture: (images: string[], aspectRatio?: string) => void;
	aspectRatio?: string;
	photoLimit?: number;
	countdownTime?: number;
	defaultFilter?: string;
	lightColor?: string;
	playSound?: boolean;
	photoOverlays?: PhotoOverlay[];
}

type FilterType = "Normal" | "Warm" | "Cool" | "Vintage" | "B&W" | "Dramatic";

const WebcamCapture: React.FC<WebcamCaptureProps> = ({
	onCapture,
	aspectRatio = "4:3",
	photoLimit = 4,
	countdownTime = 3,
	defaultFilter = "Normal",
	lightColor = "#FFD700",
	playSound = false,
	photoOverlays,
}) => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const videoContainerRef = useRef<HTMLDivElement>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const sessionCompleteRef = useRef(false);

	const [isStreaming, setIsStreaming] = useState(false);
	const [countdownValue, setCountdownValue] = useState<number | null>(null);
	const [isCapturing, setIsCapturing] = useState(false);
	const [activeFilter, setActiveFilter] = useState<FilterType>(
		(defaultFilter as FilterType) || "Normal"
	);
	const [capturedImages, setCapturedImages] = useState<string[]>([]);
	const [photoCount, setPhotoCount] = useState(0);
	const [mirrored, setMirrored] = useState(true);
	const [currentAspectRatio, setCurrentAspectRatio] = useState<string>(aspectRatio);
	const [showGrid, setShowGrid] = useState(false);
	const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
	const [videoDisplaySize, setVideoDisplaySize] = useState({ width: 0, height: 0 });
	const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
	const [overlayImages, setOverlayImages] = useState<HTMLImageElement[]>([]);

	const defaultAspectRatios: Record<string, { width: number; height: number }> = {
		"1:1": { width: 1, height: 1 },
		"4:3": { width: 4, height: 3 },
		"3:2": { width: 3, height: 2 },
		"4:5": { width: 4, height: 5 },
	};

	useEffect(() => {
		const updateSizes = () => {
			if (videoContainerRef.current && videoRef.current) {
				const containerRect = videoContainerRef.current.getBoundingClientRect();
				const videoRect = videoRef.current.getBoundingClientRect();

				setContainerSize({
					width: containerRect.width,
					height: containerRect.height,
				});

				setVideoDisplaySize({
					width: videoRect.width,
					height: videoRect.height,
				});
			}
		};

		updateSizes();
		window.addEventListener("resize", updateSizes);

		const observer = new MutationObserver(updateSizes);
		if (containerRef.current) {
			observer.observe(containerRef.current, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ["style", "class"],
			});
		}

		return () => {
			window.removeEventListener("resize", updateSizes);
			observer.disconnect();
		};
	}, [isStreaming, currentAspectRatio]);

	useEffect(() => {
		if (photoOverlays && photoOverlays.length > 0) {
			const loadImages = photoOverlays.map((overlay) => {
				return new Promise<HTMLImageElement | null>((resolve) => {
					if (!overlay || !overlay.url || overlay.url === "/placeholder.svg") {
						resolve(null);
						return;
					}

					const img = new Image();
					img.src = overlay.url;
					img.onload = () => resolve(img);
					img.onerror = () => resolve(null);
				});
			});

			Promise.all(loadImages).then((loadedImages) => {
				setOverlayImages(loadedImages.filter(Boolean) as HTMLImageElement[]);
			});
		}
	}, [photoOverlays]);

	useEffect(() => {
		if (playSound) {
			audioRef.current = new Audio("/audio/camera-shutter.mp3");
		} else {
			audioRef.current = null;
		}
	}, [playSound]);

	useEffect(() => {
		setCurrentAspectRatio(aspectRatio);
	}, [aspectRatio]);

	useEffect(() => {
		setActiveFilter((defaultFilter as FilterType) || "Normal");
	}, [defaultFilter]);

	// 修改 startWebcam 函数，确保请求的视频流宽高比与 currentAspectRatio 一致
	const startWebcam = useCallback(async () => {
		try {
			// 解析当前宽高比
			const [widthRatio, heightRatio] = currentAspectRatio
				.split(":")
				.map((num) => parseInt(num, 10));
			const targetRatio = widthRatio / heightRatio;
			// 使用精确的宽高比请求摄像头
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: "user",
					width: { ideal: widthRatio * 160 },
					height: { ideal: heightRatio * 160 },
				},
			});

			if (videoRef.current) {
				videoRef.current.srcObject = stream;

				videoRef.current.onloadedmetadata = () => {
					if (videoRef.current) {
						// 获取视频实际尺寸
						const videoWidth = videoRef.current.videoWidth;
						const videoHeight = videoRef.current.videoHeight;

						// 计算实际宽高比
						const actualRatio = videoWidth / videoHeight;
						console.log("视频实际宽高比:", actualRatio, "目标宽高比:", targetRatio);

						setVideoSize({
							width: videoWidth,
							height: videoHeight,
						});
					}
				};

				setIsStreaming(true);
			}
		} catch (err) {
			console.error("Error accessing webcam:", err);
			toast.error("Could not access webcam. Please allow camera access and try again.");
		}
	}, [currentAspectRatio]);

	const stopWebcam = useCallback(() => {
		if (videoRef.current && videoRef.current.srcObject) {
			const stream = videoRef.current.srcObject as MediaStream;
			const tracks = stream.getTracks();

			tracks.forEach((track) => {
				track.stop();
			});

			videoRef.current.srcObject = null;
			setIsStreaming(false);
		}
	}, []);

	// 修改 captureImage 函数，确保 canvas 的宽高比与 currentAspectRatio 一致
	const captureImage = useCallback(() => {
		if (videoRef.current && canvasRef.current) {
			const video = videoRef.current;
			const canvas = canvasRef.current;

			if (audioRef.current) {
				audioRef.current.play().catch((e) => console.log("Audio play failed", e));
			}

			// 解析当前宽高比
			const [widthRatio, heightRatio] = currentAspectRatio
				.split(":")
				.map((num) => parseInt(num, 10));
			const targetRatio = widthRatio / heightRatio;

			let width = video.videoWidth;
			let height = video.videoHeight;
			let offsetX = 0;
			let offsetY = 0;

			// 获取当前照片的模板设置
			const currentOverlay = photoOverlays && photoOverlays[photoCount];
			const photoPosition = currentOverlay?.photoPosition;

			// 如果有模板设置的photoPosition，使用其宽高比
			if (photoPosition) {
				const templateRatio = photoPosition.width / photoPosition.height;

				// 根据模板宽高比裁剪视频
				if (width / height > templateRatio) {
					// 视频比例比模板宽，需要裁剪宽度
					const newWidth = Math.floor(height * templateRatio);
					offsetX = Math.floor((width - newWidth) / 2);
					width = newWidth;
				} else {
					// 视频比例比模板窄，需要裁剪高度
					const newHeight = Math.floor(width / templateRatio);
					offsetY = Math.floor((height - newHeight) / 2);
					height = newHeight;
				}

				// 再次验证宽高比
				const actualRatio = width / height;
				if (Math.abs(actualRatio - templateRatio) > 0.01) {
					width = Math.floor(height * templateRatio);
				}
			} else {
				// 使用当前设置的宽高比
				if (width / height > targetRatio) {
					// 视频比例比目标宽，需要裁剪宽度
					const newWidth = Math.floor(height * targetRatio);
					offsetX = Math.floor((width - newWidth) / 2);
					width = newWidth;
				} else {
					// 视频比例比目标窄，需要裁剪高度
					const newHeight = Math.floor(width / targetRatio);
					offsetY = Math.floor((height - newHeight) / 2);
					height = newHeight;
				}

				// 再次验证宽高比
				const actualRatio = width / height;
				if (Math.abs(actualRatio - targetRatio) > 0.01) {
					width = Math.floor(height * targetRatio);
				}
			}

			// 确保宽高是整数
			width = Math.floor(width);
			height = Math.floor(height);

			canvas.width = width;
			canvas.height = height;

			const ctx = canvas.getContext("2d");
			if (ctx) {
				// 清除画布
				ctx.clearRect(0, 0, canvas.width, canvas.height);

				// 绘制视频帧
				if (mirrored) {
					ctx.translate(canvas.width, 0);
					ctx.scale(-1, 1);
				}

				ctx.drawImage(video, offsetX, offsetY, width, height, 0, 0, width, height);

				// 应用滤镜
				if (activeFilter !== "Normal") {
					switch (activeFilter) {
						case "Warm":
							ctx.filter = "sepia(0.3) brightness(1.05)";
							break;
						case "Cool":
							ctx.filter =
								"brightness(1.1) contrast(1.1) saturate(1.25) hue-rotate(-10deg)";
							break;
						case "Vintage":
							ctx.filter = "sepia(0.5) brightness(0.9) contrast(1.1)";
							break;
						case "B&W":
							ctx.filter = "grayscale(1)";
							break;
						case "Dramatic":
							ctx.filter = "contrast(1.25) brightness(0.9)";
							break;
					}
					if (mirrored) {
						ctx.resetTransform();
						ctx.translate(canvas.width, 0);
						ctx.scale(-1, 1);
					} else {
						ctx.resetTransform();
					}
					ctx.drawImage(video, offsetX, offsetY, width, height, 0, 0, width, height);
				}

				// 获取当前照片对应的叠加层
				const currentOverlay = photoOverlays && photoOverlays[photoCount];
				const currentOverlayImg = overlayImages[photoCount];

				// 绘制叠加层
				if (
					currentOverlay &&
					currentOverlayImg &&
					currentOverlay.url &&
					currentOverlay.url !== "/placeholder.svg"
				) {
					ctx.resetTransform(); // 重置变换，确保叠加层位置正确

					// 基础缩放比例
					let scale = currentOverlay.scale || 1;

					// 如果有叠加层图片尺寸，计算适当的缩放比例
					if (currentOverlayImg.width > 0 && currentOverlayImg.height > 0) {
						// 获取当前照片对应的 photoPosition
						const photoPosition = currentOverlay.photoPosition;

						if (photoPosition) {
							// 计算画布与 photoPosition 的比例
							const canvasToPhotoRatio = Math.min(
								canvas.width / photoPosition.width,
								canvas.height / photoPosition.height
							);

							// 计算叠加层图片与 photoPosition 的比例
							const imgToPhotoRatio = Math.min(
								photoPosition.width / currentOverlayImg.width,
								photoPosition.height / currentOverlayImg.height
							);

							// 综合计算最终缩放比例
							// 用户设置的 scale * 图片与照片位置的比例 * 画布与照片位置的比例
							scale = scale * imgToPhotoRatio * canvasToPhotoRatio;

							console.log("拍照时计算详情:", {
								用户设置scale: currentOverlay.scale || 1,
								图片与照片位置比例: imgToPhotoRatio,
								画布与照片位置比例: canvasToPhotoRatio,
								最终scale: scale,
							});
						} else {
							// 没有 photoPosition，使用简单的比例计算
							const widthRatio = canvas.width / currentOverlayImg.width;
							const heightRatio = canvas.height / currentOverlayImg.height;

							// 使用较小的比例，确保叠加层完全显示在画布内
							const fitRatio = Math.min(widthRatio, heightRatio) * 0.5; // 使用0.5作为默认缩放因子

							// 应用用户设置的 scale 和适合画布的缩放比例
							scale = scale * fitRatio;
						}
					}

					// 计算叠加层的位置和大小
					const posX = currentOverlay.position.x;
					const posY = currentOverlay.position.y;
					const overlayWidth = currentOverlayImg.width * scale;
					const overlayHeight = currentOverlayImg.height * scale;

					// 绘制叠加层图片
					ctx.drawImage(currentOverlayImg, posX, posY, overlayWidth, overlayHeight);

					console.log("拍照时绘制叠加层:", {
						position: { x: posX, y: posY },
						size: { width: overlayWidth, height: overlayHeight },
						scale: scale,
					});
				}

				// 获取最终图像数据
				const imageDataURL = canvas.toDataURL("image/jpeg", 0.9);
				const newCapturedImages = [...capturedImages, imageDataURL];

				setCapturedImages(newCapturedImages);

				const nextPhotoCount = photoCount + 1;
				setPhotoCount(nextPhotoCount);

				onCapture(newCapturedImages, currentAspectRatio);

				setIsCapturing(true);
				setTimeout(() => setIsCapturing(false), 300);
			}
		}
	}, [
		capturedImages,
		onCapture,
		mirrored,
		activeFilter,
		currentAspectRatio,
		photoCount,
		photoOverlays,
		overlayImages,
	]);

	useEffect(() => {
		if (photoCount === 0) {
			sessionCompleteRef.current = false;
		}

		if (photoCount === photoLimit && !sessionCompleteRef.current) {
			toast.success("Photo strip complete!");
			sessionCompleteRef.current = true;
		} else if (photoCount > 0 && photoCount < photoLimit) {
			const timer = setTimeout(() => {
				startCountdown();
			}, 1500);

			return () => clearTimeout(timer);
		}
	}, [photoCount, photoLimit]);

	const startCountdown = useCallback(() => {
		setCountdownValue(countdownTime);

		const countdownInterval = setInterval(() => {
			setCountdownValue((prev) => {
				if (prev === 1) {
					clearInterval(countdownInterval);
					captureImage();
					return null;
				}
				return prev ? prev - 1 : null;
			});
		}, 1000);

		return () => clearInterval(countdownInterval);
	}, [captureImage, countdownTime]);

	const startPhotoSession = useCallback(() => {
		setCapturedImages([]);
		setPhotoCount(0);

		onCapture([], currentAspectRatio);

		startCountdown();
	}, [startCountdown, onCapture, currentAspectRatio]);

	const toggleMirror = useCallback(() => {
		setMirrored((prev) => !prev);
	}, []);

	useEffect(() => {
		startWebcam();
		return () => {
			stopWebcam();
		};
	}, [startWebcam, stopWebcam]);

	const toggleGrid = useCallback(() => {
		setShowGrid((prev) => !prev);
	}, []);

	const getContainerStyle = () => {
		const containerStyle: React.CSSProperties = {
			position: "relative",
			width: "100%",
			height: "auto",
			backgroundColor: "black",
			overflow: "hidden",
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
		};

		const arr = currentAspectRatio.split(":");
		const widthRatio = parseInt(arr[0], 10);
		const heightRatio = parseInt(arr[1], 10);
		containerStyle.aspectRatio = `${widthRatio}/${heightRatio}`;
    console.log('containerStyle.aspectRatio:', containerStyle.aspectRatio);

		return containerStyle;
	};

	const getVideoStyle = () => {
		return {
			transform: mirrored ? "scaleX(-1)" : "none",
			objectFit: "cover" as const,
			width: "100%",
			height: "100%",
		};
	};

	const getFilterClassName = () => {
		switch (activeFilter) {
			case "Warm":
				return "sepia-[0.3] brightness-105";
			case "Cool":
				return "brightness-110 contrast-110 saturate-125 hue-rotate-[-10deg]";
			case "Vintage":
				return "sepia-[0.5] brightness-90 contrast-110";
			case "B&W":
				return "grayscale";
			case "Dramatic":
				return "contrast-125 brightness-90";
			default:
				return "";
		}
	};

	const getAspectRatioRect = () => {
		return {
			width: "100%",
			height: "100%",
		};
	};

	const inCaptureMode = countdownValue !== null || (photoCount > 0 && photoCount < photoLimit);

	// 实时预览叠加层函数
	const renderLiveOverlay = () => {
		if (
			!isStreaming ||
			!photoOverlays ||
			photoOverlays.length === 0 ||
			photoCount >= photoOverlays.length
		)
			return null;

		const currentOverlay = photoOverlays[photoCount];
		if (!currentOverlay || !currentOverlay.url || currentOverlay.url === "/placeholder.svg")
			return null;

		// 获取当前叠加层图片
		const currentOverlayImg = overlayImages[photoCount];
		if (!currentOverlayImg) return null;

		// 基础缩放比例
		let scale = currentOverlay.scale || 1;

		// 如果有视频尺寸和叠加层图片尺寸，计算适当的缩放比例
		if (
			videoSize.width > 0 &&
			videoSize.height > 0 &&
			currentOverlayImg.width > 0 &&
			currentOverlayImg.height > 0
		) {
			// 获取当前照片对应的 photoPosition
			const photoPosition = photoOverlays?.[photoCount]?.photoPosition;

			if (photoPosition) {
				// 计算视频与 photoPosition 的比例
				const videoToPhotoRatio = Math.min(
					videoSize.width / photoPosition.width,
					videoSize.height / photoPosition.height
				);

				// 计算叠加层图片与 photoPosition 的比例
				const imgToPhotoRatio = Math.min(
					photoPosition.width / currentOverlayImg.width,
					photoPosition.height / currentOverlayImg.height
				);

				// 综合计算最终缩放比例
				// 用户设置的 scale * 图片与照片位置的比例 * 视频与照片位置的比例
				scale = scale * imgToPhotoRatio * videoToPhotoRatio;

				console.log("计算详情:", {
					用户设置scale: currentOverlay.scale || 1,
					图片与照片位置比例: imgToPhotoRatio,
					视频与照片位置比例: videoToPhotoRatio,
					最终scale: scale,
				});
			} else {
				// 没有 photoPosition，使用简单的比例计算
				const widthRatio = videoSize.width / currentOverlayImg.width;
				const heightRatio = videoSize.height / currentOverlayImg.height;

				// 使用较小的比例，确保叠加层完全显示在视频内
				const fitRatio = Math.min(widthRatio, heightRatio) * 0.5; // 使用0.5作为默认缩放因子

				// 应用用户设置的 scale 和适合视频的缩放比例
				scale = scale * fitRatio;
			}
		}

		console.log(
			"计算后的scale:",
			scale,
			"视频尺寸:",
			videoSize,
			"图片尺寸:",
			{ width: currentOverlayImg.width, height: currentOverlayImg.height },
			"photoPosition:",
			photoOverlays?.[photoCount]?.photoPosition
		);

		return (
			<div
				className="absolute pointer-events-none"
				style={{
					position: "absolute",
					left: `${currentOverlay.position.x}px`,
					top: `${currentOverlay.position.y}px`,
					transform: `scale(${scale})`,
					transformOrigin: "top left",
					zIndex: 10,
				}}
			>
				<img
					src={currentOverlay.url}
					alt="Overlay"
					className="object-contain"
					style={{
						maxWidth: `${videoSize.width}px`,
						maxHeight: `${videoSize.height}px`,
					}}
				/>
			</div>
		);
	};

	return (
		<div className="flex flex-col overflow-hidden rounded-lg shadow-lg" ref={containerRef}>
			<div className="relative bg-black mb-4">
				{isCapturing && (
					<div
						className="absolute inset-0 bg-white opacity-30 z-10 animate-flash"
						style={{ backgroundColor: lightColor }}
					/>
				)}

				<div style={getContainerStyle()}>
					<div className="relative w-full h-full" ref={videoContainerRef}>
						<video
							ref={videoRef}
							autoPlay
							playsInline
							muted
							className={`${getFilterClassName()}`}
							style={getVideoStyle()}
						/>

						<div
							className="absolute pointer-events-none"
							style={{
								boxShadow: `0 0 0 2000px rgba(0, 0, 0, 0.3)`,
								...getAspectRatioRect(),
								aspectRatio: `${currentAspectRatio.split(":")[0]}/${
									currentAspectRatio.split(":")[1]
								}`,
								margin: "auto",
								inset: 0,
							}}
						/>

						{showGrid && (
							<div
								className="absolute pointer-events-none"
								style={{
									...getAspectRatioRect(),
									aspectRatio: `${currentAspectRatio.split(":")[0]}/${
										currentAspectRatio.split(":")[1]
									}`,
									margin: "auto",
									inset: 0,
									backgroundImage:
										"linear-gradient(to right, rgba(255,255,255,0.3) 2px, transparent 2px), linear-gradient(to bottom, rgba(255,255,255,0.3) 2px, transparent 2px)",
									backgroundSize: "33.33% 33.33%",
									backgroundPosition: "center",
								}}
							/>
						)}

						{renderLiveOverlay()}

						<canvas ref={canvasRef} className="hidden" />

						{countdownValue && (
							<div className="absolute inset-0 flex items-center justify-center z-10">
								<span className="text-7xl font-bold text-white animate-pulse-slight">
									{countdownValue}
								</span>
							</div>
						)}

						{photoCount > 0 && photoCount < photoLimit && !countdownValue && (
							<div className="absolute bottom-4 right-4 bg-black/50 px-3 py-1 rounded-full z-10">
								<span className="text-sm font-bold text-white">
									Photo {photoCount} of {photoLimit}
								</span>
							</div>
						)}

						{!inCaptureMode && (
							<>
								<button
									onClick={toggleMirror}
									className="absolute top-3 right-3 bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors z-20"
								>
									<FlipHorizontal className="w-5 h-5 text-white" />
								</button>

								<button className="absolute top-3 left-3 bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors z-20">
									<span className="text-xs font-bold text-white">
										{currentAspectRatio}
									</span>
								</button>

								<button
									onClick={toggleGrid}
									className="absolute bottom-3 left-3 bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors z-20"
								>
									<Grid3X3
										className={`w-5 h-5 ${
											showGrid ? "text-idol-gold" : "text-white"
										}`}
									/>
								</button>
							</>
						)}
					</div>
				</div>
			</div>

			<div className="py-4 flex justify-center">
				{!inCaptureMode && (
					<div className="flex gap-4">
						<button
							onClick={startPhotoSession}
							disabled={!isStreaming}
							className="w-16 h-16 bg-idol-gold flex items-center justify-center rounded-full transition-all 
                        hover:bg-opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<Camera className="w-6 h-6 text-black" />
						</button>
					</div>
				)}
			</div>

			<div className="p-3 bg-transparent mt-2 mb-4">
				<div className="flex justify-center">
					<ToggleGroup
						type="single"
						value={activeFilter}
						onValueChange={(value) =>
							!inCaptureMode && value && setActiveFilter(value as FilterType)
						}
						className={inCaptureMode ? "opacity-50 pointer-events-none" : ""}
					>
						<ToggleGroupItem
							value="Normal"
							className="text-xs data-[state=on]:bg-idol-gold data-[state=on]:text-black"
						>
							Normal
						</ToggleGroupItem>
						<ToggleGroupItem
							value="Warm"
							className="text-xs data-[state=on]:bg-idol-gold data-[state=on]:text-black"
						>
							Warm
						</ToggleGroupItem>
						<ToggleGroupItem
							value="Cool"
							className="text-xs data-[state=on]:bg-idol-gold data-[state=on]:text-black"
						>
							Cool
						</ToggleGroupItem>
						<ToggleGroupItem
							value="Vintage"
							className="text-xs data-[state=on]:bg-idol-gold data-[state=on]:text-black"
						>
							Vintage
						</ToggleGroupItem>
						<ToggleGroupItem
							value="B&W"
							className="text-xs data-[state=on]:bg-idol-gold data-[state=on]:text-black"
						>
							B&W
						</ToggleGroupItem>
						<ToggleGroupItem
							value="Dramatic"
							className="text-xs data-[state=on]:bg-idol-gold data-[state=on]:text-black"
						>
							Dramatic
						</ToggleGroupItem>
					</ToggleGroup>
				</div>
			</div>
		</div>
	);
};

export default WebcamCapture;
