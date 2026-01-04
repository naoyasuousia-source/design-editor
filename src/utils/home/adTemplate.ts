export const HOME_AD_HTML = `
<div class="DesignSurface" style="position: relative; overflow: hidden; width: 800px; height: 800px; background: #fcfcfc; display: flex; align-items: center; justify-content: center; font-family: 'Inter', 'Noto Sans JP', sans-serif;">
    <!-- Minimal Background Image -->
    <div style="position: absolute; inset: 0;">
        <img src="./src/assets/home-ad.png" style="width: 100%; height: 100%; object-fit: cover;" />
    </div>
    
    <!-- Sophisticated Overlay -->
    <div style="position: relative; z-index: 10; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; padding-bottom: 120px; background: linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%);">
        <div style="text-align: center; color: white; transform: translateY(20px);">
            <h2 style="font-size: 56px; font-weight: 200; margin-bottom: 8px; letter-spacing: -1px; color: #fff; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                Creative Harmony
            </h2>
            <p style="font-size: 16px; line-height: 1.6; opacity: 0.9; font-weight: 400; letter-spacing: 0.1em; text-transform: uppercase;">
                AI-Driven Design Workspace
            </p>
        </div>
    </div>
    
    <!-- Subtle Border / Frame effect -->
    <div style="position: absolute; inset: 40px; border: 1px solid rgba(255,255,255,0.1); pointer-events: none;"></div>
</div>
`;
