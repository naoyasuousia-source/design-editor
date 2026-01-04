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
    
    <!-- Full Width Decorative Horizontal Lines -->
    <div style="position: absolute; top: 30%; left: 0; width: 100%; height: 1px; background: linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent); border-top: 1px solid rgba(255,255,255,0.05);"></div>
    <div style="position: absolute; bottom: 35%; left: 0; width: 100%; height: 1px; background: linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent); border-top: 1px solid rgba(255,255,255,0.05);"></div>
    
    <!-- Ambient Light from Right Edge -->
    <div style="position: absolute; top: 0; right: 0; width: 40%; height: 100%; background: radial-gradient(circle at 100% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 70%); pointer-events: none;"></div>
    
    <!-- Sophisticated Abstract Elements -->
    <div style="position: absolute; top: 15%; right: 10%; width: 200px; height: 2px; background: linear-gradient(to right, rgba(255,255,255,0.4), transparent);"></div>
    <div style="position: absolute; top: 15%; right: calc(10% + 210px); width: 8px; height: 2px; background: #3b82f6;"></div>
    
    <!-- Branding Area (Immersive Bottom Left) -->
    <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 60%; padding: 8% 10%; display: flex; flex-direction: column; justify-content: flex-end;">
        <div class="animate-home-full" style="position: relative;">
            <div style="font-size: clamp(14px, 1.2vw, 21px); letter-spacing: 0.6em; color: #3b82f6; font-weight: 700; margin-bottom: 24px; text-transform: uppercase; opacity: 0.8;">
                Project Alpha
            </div>
            <h1 style="font-size: clamp(60px, 8vw, 120px); font-weight: 900; line-height: 0.85; color: #ffffff; letter-spacing: -0.04em; margin: 0; white-space: nowrap;">
                AI Link<br/>
                <span style="color: rgba(255,255,255,0.4);">Design</span>
            </h1>
            <div style="margin-top: 48px; width: clamp(40px, 5vw, 100px); height: 3px; background: #ffffff; opacity: 0.8;"></div>
            <p style="margin-top: 32px; font-size: clamp(16px, 1.5vw, 24px); color: rgba(255,255,255,0.5); line-height: 1.5; max-width: 600px; font-weight: 300; letter-spacing: -0.01em;">
                Constructing the future of visual communication through intelligent synthesis.
            </p>
        </div>
    </div>
    
    <!-- Subtle Grid / Texture -->
    <div style="position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 40px 40px; pointer-events: none;"></div>

</div>
`;
