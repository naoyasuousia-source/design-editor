export const HOME_AD_HTML = `
<style>
    @keyframes homeAdvance {
        0% { opacity: 0; transform: translateY(60px) scale(0.98); filter: blur(15px); }
        100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
    }
    .animate-home-full {
        animation: homeAdvance 2.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
</style>
<div class="DesignSurface" style="position: relative; overflow: hidden; width: 100%; height: 100%; background: #0e0e0e; display: flex; align-items: center; justify-content: center; font-family: 'Inter', 'Noto Sans JP', sans-serif; user-select: none;">
    
    <!-- Sophisticated Ambient Light (Full Screen Container to avoid edges) -->
    <div style="position: absolute; inset: 0; background: radial-gradient(circle at 100% 50%, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 80%); pointer-events: none; mix-blend-mode: screen;"></div>
    <div style="position: absolute; inset: 0; background: radial-gradient(circle at 100% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 60%); pointer-events: none; mix-blend-mode: plus-lighter;"></div>
    
    <!-- Full Width Decorative Horizontal Lines -->
    <div style="position: absolute; top: 30%; left: 0; width: 100%; height: 1px; background: linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent); border-top: 1px solid rgba(255,255,255,0.05);"></div>
    <div style="position: absolute; bottom: 35%; left: 0; width: 100%; height: 1px; background: linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent); border-top: 1px solid rgba(255,255,255,0.05);"></div>
    
    <!-- Sophisticated Abstract Elements -->
    <div style="position: absolute; top: 15%; right: 10%; width: 20%; max-width: 300px; height: 1px; background: linear-gradient(to right, rgba(255,255,255,0.4), transparent);"></div>
    <div style="position: absolute; top: 15%; right: calc(10% + min(20%, 300px) + 10px); width: 8px; height: 1px; background: #3b82f6;"></div>
    
    <!-- Branding Area (Immersive Bottom Left) -->
    <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 60%; padding: 8% 10%; display: flex; flex-direction: column; justify-content: flex-end;">
        <div class="animate-home-full" style="position: relative;">
            <div style="font-size: clamp(18px, 0.4vw + 14px, 22px); letter-spacing: 0.6em; color: #3b82f6; font-weight: 700; margin-bottom: 24px; text-transform: uppercase;">
                Project Alpha
            </div>
            <h1 style="font-size: clamp(86px, 4vw + 62px, 120px); font-weight: 900; line-height: 0.85; color: #ffffff; letter-spacing: -0.04em; margin: 0; white-space: nowrap;">
                AI Link<br/>
                <span style="color: rgba(255,255,255,0.45);">Design</span>
            </h1>
            <div style="margin-top: 48px; width: clamp(60px, 5vw, 100px); height: 3px; background: #ffffff; opacity: 0.8;"></div>
            <p style="margin-top: 32px; font-size: clamp(22px, 0.8vw + 16px, 26px); color: rgba(255,255,255,0.6); line-height: 1.5; max-width: 700px; font-weight: 300; letter-spacing: -0.01em;">
                Constructing the future of visual communication through intelligent synthesis.
            </p>
        </div>
    </div>
    
    <!-- Subtle Grid / Texture -->
    <div style="position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 40px 40px; pointer-events: none;"></div>

</div>
`;
