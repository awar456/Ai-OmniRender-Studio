import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

export const apiRouter = express.Router();

const getApiKey = () => process.env.GEMINI_API_KEY || '';

const getAIClient = () => {
  const apiKey = getApiKey();
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Status endpoint
apiRouter.get('/status', (req: Request, res: Response) => {
  const apiKey = getApiKey();
  res.json({
    status: 'online',
    apiKeyConfigured: Boolean(apiKey && apiKey.length > 5),
    engine: 'OmniRender Neural Bridge v3.8',
    supportedModels: [
      'gemini-omni-1.2-flash',
      'gemini-3-pro-image-preview',
      'gemini-nano-banana-2.1',
      'gemini-3.1-flash-lite-image',
      'gemini-3.8-flash',
      'gemini-4-argon',
      'gemini-3.1-flash-lite',
      'lyria-3-clip-preview',
      'lyria-3-pro-preview',
    ],
    timestamp: Date.now(),
  });
});

// Image generation / editing endpoint
apiRouter.post('/generate-image', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      model = 'gemini-nano-banana-2.1',
      aspectRatio = '16:9',
      imageSize = '1K',
      sourceImageBase64,
      sourceMimeType = 'image/png',
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const ai = getAIClient();

    // Map requested model to safe valid model names
    let targetModel = model;
    if (model === 'gemini-3-pro-image-preview' || model === 'gemini-3-pro-image') {
      targetModel = 'gemini-3-pro-image';
    } else if (model === 'gemini-nano-banana-2.1') {
      targetModel = 'gemini-nano-banana-2.1';
    } else if (model === 'gemini-3.1-flash-lite-image') {
      targetModel = 'gemini-3.1-flash-lite-image';
    }

    const parts: any[] = [];
    if (sourceImageBase64) {
      // Clean base64 prefix if present
      const cleanBase64 = sourceImageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: sourceMimeType,
        },
      });
    }
    parts.push({ text: prompt });

    // Build configuration
    const config: any = {};
    if (targetModel === 'gemini-nano-banana-2.1' || targetModel === 'gemini-3-pro-image') {
      config.imageConfig = {
        aspectRatio: aspectRatio,
        imageSize: imageSize,
      };
    }

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: { parts },
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    let generatedImageUrl = '';
    let explanationText = '';

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        generatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
      } else if (part.text) {
        explanationText += part.text + '\n';
      }
    }

    if (!generatedImageUrl) {
      // If the model didn't return an image part directly (e.g. text answer or refusal)
      return res.json({
        success: false,
        text: explanationText || response.text || 'No image stream returned.',
        error: 'The model did not return image data. Check prompt or quota.',
      });
    }

    return res.json({
      success: true,
      imageUrl: generatedImageUrl,
      text: explanationText,
      model: targetModel,
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Image generation failed',
      code: error.status || 500,
    });
  }
});

// Video generation endpoint using gemini-omni-1.2-flash via Interactions API
apiRouter.post('/generate-video', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      sourceImageBase64,
      sourceMimeType = 'image/png',
      aspectRatio = '16:9',
      resolution = '720p',
      duration = '10s',
    } = req.body;

    if (!prompt && !sourceImageBase64) {
      return res.status(400).json({ error: 'A prompt or source image is required.' });
    }

    const ai = getAIClient();
    const inputParts: any[] = [];

    if (sourceImageBase64) {
      const cleanBase64 = sourceImageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      inputParts.push({
        type: 'image',
        mime_type: sourceMimeType,
        data: cleanBase64,
      });
    }

    if (prompt) {
      inputParts.push({
        type: 'text',
        text: prompt,
      });
    }

    const interaction = await ai.interactions.create(
      {
        model: 'gemini-omni-1.2-flash',
        input: inputParts.length === 1 && inputParts[0].type === 'text' ? inputParts[0].text : inputParts,
        background: false,
        store: false,
        stream: false,
        response_format: {
          type: 'video',
          aspect_ratio: aspectRatio === '9:16' ? '9:16' : '16:9',
          duration: duration || '10s',
          resolution: resolution || '720p',
        },
      },
      { timeout: 300000 }
    );

    const videoPart = interaction.output_video;
    if (videoPart && videoPart.data) {
      const mime = videoPart.mime_type || 'video/mp4';
      const videoUrl = `data:${mime};base64,${videoPart.data}`;
      return res.json({
        success: true,
        videoUrl,
        interactionId: interaction.id,
      });
    }

    // Check interaction steps if output_video was not populated
    for (const step of interaction.steps || []) {
      if (step.type === 'model_output' && Array.isArray(step.content)) {
        const v = step.content.find((c: any) => c.type === 'video') as any;
        if (v && v.data) {
          const mime = v.mime_type || 'video/mp4';
          return res.json({
            success: true,
            videoUrl: `data:${mime};base64,${v.data}`,
          });
        }
      }
    }

    return res.status(500).json({
      success: false,
      error: 'Video model did not return video bytes. You can preview temporal animation in Studio Canvas.',
    });
  } catch (error: any) {
    console.error('Video generation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Video generation failed',
      code: error.status || 500,
    });
  }
});

// Music generation endpoint using lyria-3-clip-preview / lyria-3-pro-preview
apiRouter.post('/generate-music', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      model = 'lyria-3-clip-preview',
      sourceImageBase64,
      sourceMimeType = 'image/png',
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const ai = getAIClient();
    const targetModel = model === 'lyria-3-pro-preview' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';

    let contents: any = prompt;
    if (sourceImageBase64) {
      const cleanBase64 = sourceImageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      contents = {
        parts: [
          { text: prompt },
          { inlineData: { data: cleanBase64, mimeType: sourceMimeType } },
        ],
      };
    }

    const responseStream = await ai.models.generateContentStream({
      model: targetModel,
      contents,
    });

    const audioChunks: Buffer[] = [];
    let lyrics = '';
    let mimeType = 'audio/mpeg';

    for await (const chunk of responseStream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part.inlineData?.data) {
          if (audioChunks.length === 0 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioChunks.push(Buffer.from(part.inlineData.data, 'base64'));
        }
        if (part.text) {
          lyrics += part.text;
        }
      }
    }

    if (audioChunks.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'No audio returned from music model.',
      });
    }

    const audioBase64 = Buffer.concat(audioChunks).toString('base64');
    const audioDataUrl = `data:${mimeType};base64,${audioBase64}`;

    return res.json({
      success: true,
      audioUrl: audioDataUrl,
      lyrics,
      model: targetModel,
    });
  } catch (error: any) {
    console.error('Music generation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Music generation failed',
    });
  }
});

// Multi-turn Director Chatbot endpoint
apiRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const {
      messages = [],
      role = 'Creative Director',
      model = 'gemini-3.8-flash',
    } = req.body;

    const validModels = ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    const targetModel = validModels.includes(model) ? model : 'gemini-3.8-flash';

    let systemInstruction = 'You are the Senior Creative Director and Visual VFX Architect for OmniRender AI Studio Pro.';
    if (role === 'Cinematographer') {
      systemInstruction =
        'You are a world-class Hollywood Cinematographer and Director of Photography (DP). You specialize in lens selection (anamorphic, prime, telephoto), camera movements (dolly zooms, cranes, orbital pans), lighting schemes (chiaroscuro, Rembrandt, neon key, volumetric god rays), and framing aspect ratios.';
    } else if (role === 'Prompt Architect') {
      systemInstruction =
        'You are an expert Generative AI Prompt Architect for diffusion and video models. You write mathematically precise, evocative prompts with weighted tokens, camera specs, lighting adjectives, negative constraints, and aesthetic styles.';
    } else if (role === '3D Stage Supervisor') {
      systemInstruction =
        'You are the 3D Virtual Production Stage Supervisor and Lead Technical Artist. You specialize in Three.js WebGL scenes, PBR materials (ACES Filmic, roughness, metalness, clearcoat), studio lighting rigs (key, fill, rim), procedural geometry crafting, and cinematic camera kinematics (damped orbits, crane shots, dolly zooms).';
    }

    const ai = getAIClient();

    // Map conversation into Gemini parts
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: targetModel,
      contents,
      config: {
        systemInstruction,
      },
    });

    const reply = response.text || 'I analyzed your request. How should we direct this sequence?';
    return res.json({
      success: true,
      content: reply,
      model: targetModel,
      role,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Chat generation failed',
    });
  }
});

// Prompt enhancement endpoint
apiRouter.post('/enhance-prompt', async (req: Request, res: Response) => {
  try {
    const { prompt, style = 'Cyberpunk', camera = 'Orbital Crane', motionIntensity = 5 } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const ai = getAIClient();
    const systemInstruction = `You are a prompt engineer for OmniRender AI Studio Pro. Enhance the user's idea into an ultra-vivid, production-grade text-to-image or video prompt.
Include cinematic visual specs: lighting, camera motion (${camera}), artistic aesthetic (${style}), motion dynamism (intensity ${motionIntensity}/10), 8K optical details, and atmospheric particles. Output ONLY the enhanced prompt text, without conversational fluff or quotation marks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    return res.json({
      success: true,
      enhancedPrompt: response.text?.trim() || prompt,
    });
  } catch (error: any) {
    console.error('Enhance prompt error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Enhancement failed',
    });
  }
});

// Variations descriptor & analysis endpoint
apiRouter.post('/analyze-variations', async (req: Request, res: Response) => {
  try {
    const { sourceImageBase64, prompt } = req.body;
    const ai = getAIClient();

    const parts: any[] = [];
    if (sourceImageBase64) {
      const cleanBase64 = sourceImageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: 'image/png',
        },
      });
    }
    parts.push({
      text: `Analyze this image/concept and generate 4 creative stylistic variation concepts (e.g. Cyberpunk Flare, Renaissance Impasto, Cinema Scope Anamorphic, Noir Monochrome).
Return a valid JSON array of 4 objects with:
- "title": short punchy title
- "style": style preset name
- "filterType": one of "cyberpunk", "renaissance", "steampunk", "anime", "noir", "anamorphic"
- "promptModifier": descriptive prompt addition
- "colorPalette": array of 3 hex color codes
- "camera": recommended camera profile`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
      },
    });

    let variations = [];
    try {
      variations = JSON.parse(response.text || '[]');
    } catch {
      variations = [
        {
          title: 'Cyberpunk Neon Flare',
          style: 'Cyberpunk Dystopia',
          filterType: 'cyberpunk',
          promptModifier: 'volumetric neon light shafts, iridescent rain, chrome reflections, 8K',
          colorPalette: ['#00f0ff', '#ff007f', '#7928ca'],
          camera: 'Slow Push-In',
        },
        {
          title: 'Baroque Oil Impasto',
          style: 'Renaissance Painting',
          filterType: 'renaissance',
          promptModifier: 'oil glaze, chiaroscuro golden hour illumination, Caravaggio canvas grain',
          colorPalette: ['#d4af37', '#8b4513', '#1c1c1c'],
          camera: 'Orbital Crane',
        },
        {
          title: 'Anamorphic Cinema Scope',
          style: 'Hyper-Realistic 8K',
          filterType: 'anamorphic',
          promptModifier: 'Panavision 2.39:1 anamorphic horizontal lens flare, 35mm film grain, shallow depth',
          colorPalette: ['#38bdf8', '#fbbf24', '#0f172a'],
          camera: 'Drone Hyperlapse',
        },
        {
          title: 'Film Noir 35mm Silver',
          style: 'Film Noir 35mm',
          filterType: 'noir',
          promptModifier: 'high contrast monochrome silver halide, Venetian blind shadows, moody rain haze',
          colorPalette: ['#ffffff', '#9ca3af', '#000000'],
          camera: 'Cinematic Dolly Zoom',
        },
      ];
    }

    return res.json({
      success: true,
      variations,
    });
  } catch (error: any) {
    console.error('Analyze variations error:', error);
    return res.json({
      success: true,
      variations: [
        {
          title: 'Cyberpunk Neon Flare',
          style: 'Cyberpunk Dystopia',
          filterType: 'cyberpunk',
          promptModifier: 'volumetric neon light shafts, iridescent rain, chrome reflections, 8K',
          colorPalette: ['#00f0ff', '#ff007f', '#7928ca'],
          camera: 'Slow Push-In',
        },
        {
          title: 'Baroque Oil Impasto',
          style: 'Renaissance Painting',
          filterType: 'renaissance',
          promptModifier: 'oil glaze, chiaroscuro golden hour illumination, Caravaggio canvas grain',
          colorPalette: ['#d4af37', '#8b4513', '#1c1c1c'],
          camera: 'Orbital Crane',
        },
        {
          title: 'Anamorphic Cinema Scope',
          style: 'Hyper-Realistic 8K',
          filterType: 'anamorphic',
          promptModifier: 'Panavision 2.39:1 anamorphic horizontal lens flare, 35mm film grain',
          colorPalette: ['#38bdf8', '#fbbf24', '#0f172a'],
          camera: 'Drone Hyperlapse',
        },
        {
          title: 'Film Noir 35mm Silver',
          style: 'Film Noir 35mm',
          filterType: 'noir',
          promptModifier: 'high contrast monochrome silver halide, dramatic shadows, moody haze',
          colorPalette: ['#ffffff', '#9ca3af', '#000000'],
          camera: 'Cinematic Dolly Zoom',
        },
      ],
    });
  }
});
