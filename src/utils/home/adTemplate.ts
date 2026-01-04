export const HOME_AD_HTML = `
<style>
    @keyframes homeAdvance {
        0% { opacity: 0; transform: translateY(60px) scale(0.95) rotate(-1deg); filter: blur(10px); }
        40% { opacity: 0.5; filter: blur(5px); }
        100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); filter: blur(0); }
    }
    .animate-home-complex {
        animation: homeAdvance 2.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }
</style>
<div class="DesignSurface" style="position: relative; overflow: hidden; width: 800px; height: 800px; background: #0e0e0e; transform: scale(0.9); transform-origin: center; display: flex; align-items: center; justify-content: center; font-family: 'Inter', 'Noto Sans JP', sans-serif; user-select: none;">
    <!-- Abstract Geometric Background -->
    <div style="position: absolute; top: -100px; right: -100px; width: 400px; height: 400px; background: #3b82f6; opacity: 0.15; border-radius: 50%; filter: blur(80px);"></div>
    <div style="position: absolute; bottom: 10%; right: 10%; width: 2px; height: 60%; background: linear-gradient(to bottom, transparent, #3b82f6, transparent); opacity: 0.5;"></div>
    
    <!-- Minimal Squares - High Visibility Gray -->
    <div style="position: absolute; top: 20%; left: 15%; width: 40px; height: 40px; border: 1px solid rgba(255,255,255,0.4);"></div>
    <div style="position: absolute; top: 25%; left: 20%; width: 20px; height: 20px; background: #3b82f6; opacity: 0.4;"></div>
    
    <!-- Main Branding Area (Bottom Left 1/4) -->
    <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 60%; padding: 80px; display: flex; flex-direction: column; justify-content: flex-end;">
        <div class="animate-home-complex" style="position: relative;">
            <!-- Typographic Effect -->
            <div style="font-size: 18px; letter-spacing: 0.6em; color: #3b82f6; font-weight: 700; margin-bottom: 24px; text-transform: uppercase;">
                Project Alpha
            </div>
            <h1 style="font-size: 100px; font-weight: 900; line-height: 0.85; color: #ffffff; letter-spacing: -4px; margin: 0;">
                AI Link<br/>
                <span style="color: rgba(255,255,255,0.45);">Design</span>
            </h1>
            <div style="margin-top: 48px; width: 80px; height: 3px; background: #ffffff;"></div>
            <p style="margin-top: 32px; font-size: 21px; color: rgba(255,255,255,0.6); line-height: 1.5; max-width: 450px; font-weight: 300;">
                Constructing the future of visual communication through intelligent synthesis.
            </p>
        </div>
    </div>
    
    <!-- Decorative Lines & Dots - High Visibility Gray -->
    <div style="position: absolute; top: 60px; right: 60px; display: flex; flex-direction: column; gap: 8px;">
        <div style="width: 32px; height: 1px; background: rgba(255,255,255,0.4);"></div>
        <div style="width: 16px; height: 1px; background: rgba(255,255,255,0.4);"></div>
    </div>
    
    <!-- Sophisticated Border Wrapper -->
    <div style="position: absolute; inset: 20px; border: 1px solid rgba(255,255,255,0.1); pointer-events: none;"></div>
</div>
`;
