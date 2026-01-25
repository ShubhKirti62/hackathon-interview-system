import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

interface FaceDetectionState {
    isModelLoaded: boolean;
    isDetecting: boolean;
    faceDetected: boolean;
    faceDescriptor: Float32Array | null;
    error: string | null;
}

interface UseFaceDetectionOptions {
    minConfidence?: number;
    detectionInterval?: number;
}

export const useFaceDetection = (options: UseFaceDetectionOptions = {}) => {
    const { minConfidence = 0.5, detectionInterval = 500 } = options;

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const detectionIntervalRef = useRef<number | null>(null);

    const [state, setState] = useState<FaceDetectionState>({
        isModelLoaded: false,
        isDetecting: false,
        faceDetected: false,
        faceDescriptor: null,
        error: null,
    });

    // Use refs for internal flags to stabilize callbacks
    const isModelLoadedRef = useRef(false);
    const isDetectingRef = useRef(false);

    // Load face-api models
    const loadModels = useCallback(async () => {
        if (isModelLoadedRef.current) return true;
        try {
            const MODEL_URL = '/models';
            console.log('Loading face detection models from:', MODEL_URL);

            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
            console.log('TinyFaceDetector loaded');

            await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
            console.log('Face Landmark 68 loaded');

            await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
            console.log('Face Recognition loaded');

            setState(prev => ({ ...prev, isModelLoaded: true, error: null }));
            return true;
        } catch (err) {
            console.error('Model loading error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to load face detection models';
            setState(prev => ({ ...prev, error: errorMessage }));
            return false;
        }
    }, []);

    // Start webcam
    const startCamera = useCallback(async () => {
        try {
            console.log('Requesting camera access...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user',
                },
            });
            streamRef.current = stream;
            console.log('Camera stream obtained');

            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                // Wait for video to be ready
                await new Promise<void>((resolve) => {
                    if (videoRef.current) {
                        videoRef.current.onloadedmetadata = () => {
                            console.log('Video metadata loaded');
                            resolve();
                        };
                    }
                });

                await videoRef.current.play();
                console.log('Video playing, readyState:', videoRef.current.readyState);
            }
            setState(prev => ({ ...prev, error: null }));
            return true;
        } catch (err) {
            console.error('Camera error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
            setState(prev => ({ ...prev, error: errorMessage }));
            return false;
        }
    }, []);

    // Stop webcam
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    // Detect face and get descriptor
    const detectFace = useCallback(async (): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>> | null> => {
        if (!videoRef.current) {
            console.log('No video element');
            return null;
        }

        // Check if models are actually loaded via face-api directly
        const modelsReady = faceapi.nets.tinyFaceDetector.isLoaded &&
            faceapi.nets.faceLandmark68Net.isLoaded &&
            faceapi.nets.faceRecognitionNet.isLoaded;

        if (!modelsReady) {
            console.log('Models not loaded yet');
            return null;
        }

        if (videoRef.current.readyState < 2) {
            console.log('Video not ready, readyState:', videoRef.current.readyState);
            return null;
        }
        if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
            console.log('Video dimensions are 0');
            return null;
        }
        console.log('Detecting face, video size:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);

        try {
            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: minConfidence }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detection) {
                console.log('Face detected with score:', detection.detection.score);
            }

            return detection || null;
        } catch (err) {
            console.error('Face detection error:', err);
            return null;
        }
    }, [minConfidence]);

    // Capture current face descriptor
    const captureFaceDescriptor = useCallback(async (): Promise<Float32Array | null> => {
        const detection = await detectFace();
        if (detection) {
            setState(prev => ({
                ...prev,
                faceDescriptor: detection.descriptor,
                faceDetected: true,
            }));
            return detection.descriptor;
        }
        setState(prev => ({ ...prev, faceDetected: false }));
        return null;
    }, [detectFace]);

    // Start continuous face detection
    const startDetection = useCallback(() => {
        if (detectionIntervalRef.current) return;

        isDetectingRef.current = true;
        setState(prev => ({ ...prev, isDetecting: true }));

        detectionIntervalRef.current = window.setInterval(async () => {
            const detection = await detectFace();

            if (detection && canvasRef.current && videoRef.current) {
                const canvas = canvasRef.current;
                const displaySize = {
                    width: videoRef.current.videoWidth,
                    height: videoRef.current.videoHeight,
                };

                faceapi.matchDimensions(canvas, displaySize);
                const resizedDetection = faceapi.resizeResults(detection, displaySize);

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    faceapi.draw.drawDetections(canvas, [resizedDetection]);
                    faceapi.draw.drawFaceLandmarks(canvas, [resizedDetection]);
                }
            }

            setState(prev => ({
                ...prev,
                faceDetected: !!detection,
                faceDescriptor: detection?.descriptor || prev.faceDescriptor,
            }));
        }, detectionInterval);
    }, [detectFace, detectionInterval]);

    // Stop continuous face detection
    const stopDetection = useCallback(() => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }
        isDetectingRef.current = false;
        setState(prev => ({ ...prev, isDetecting: false }));
    }, []);

    // Compare two face descriptors
    const compareFaces = useCallback((descriptor1: Float32Array, descriptor2: Float32Array): number => {
        return faceapi.euclideanDistance(descriptor1, descriptor2);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopDetection();
            stopCamera();
        };
    }, [stopDetection, stopCamera]);

    return {
        videoRef,
        canvasRef,
        ...state,
        loadModels,
        startCamera,
        stopCamera,
        detectFace,
        captureFaceDescriptor,
        startDetection,
        stopDetection,
        compareFaces,
    };
};

export default useFaceDetection;
