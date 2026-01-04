export const HOME_AD_HTML = `
<div class="DesignSurface" style="position: relative; overflow: hidden; width: 800px; height: 800px; background: #262626; transform: scale(0.9); transform-origin: center; display: flex; align-items: center; justify-content: center; font-family: 'Inter', 'Noto Sans JP', sans-serif; user-select: none;">
    <!-- Abstract Geometric Background -->
    <div style="position: absolute; top: -100px; right: -100px; width: 400px; height: 400px; background: #3b82f6; opacity: 0.1; border-radius: 50%; blur: 80px; filter: blur(80px);"></div>
    <div style="position: absolute; bottom: 10%; right: 10%; width: 2px; height: 60%; background: linear-gradient(to bottom, transparent, #3b82f6, transparent); opacity: 0.3;"></div>
    
    <!-- Minimal Squares -->
    <div style="position: absolute; top: 20%; left: 15%; width: 40px; height: 40px; border: 1px solid rgba(255,255,255,0.1);"></div>
    <div style="position: absolute; top: 25%; left: 20%; width: 20px; height: 20px; background: #3b82f6; opacity: 0.2;"></div>
    
    <!-- Main Branding Area (Bottom Left 1/4) -->
    <div style="position: absolute; bottom: 0; left: 0; width: 50%; height: 50%; padding: 60px; display: flex; flex-direction: column; justify-content: flex-end;">
        <div style="position: relative;">
            <!-- Typographic Effect -->
            <div style="font-size: 12px; letter-spacing: 0.5em; color: #3b82f6; font-weight: 700; margin-bottom: 12px; text-transform: uppercase;">
                Project Alpha
            </div>
            <h1 style="font-size: 64px; font-weight: 900; line-height: 0.9; color: #ffffff; letter-spacing: -2px; margin: 0;">
                AI Link<br/>
                <span style="color: rgba(255,255,255,0.3);">Design</span>
            </h1>
            <div style="margin-top: 32px; width: 40px; height: 2px; background: #ffffff;"></div>
            <p style="margin-top: 24px; font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.6; max-width: 240px;">
                Constructing the future of visual communication through intelligent synthesis.
            </p>
        </div>
    </div>
    
    <!-- Decorative Lines & Dots -->
    <div style="position: absolute; top: 60px; right: 60px; display: flex; flex-direction: column; gap: 8px;">
        <div style="width: 32px; height: 1px; background: rgba(255,255,255,0.2);"></div>
        <div style="width: 16px; height: 1px; background: rgba(255,255,255,0.2);"></div>
    </div>
    
    <!-- Sophisticated Border Wrapper -->
    <div style="position: absolute; inset: 20px; border: 1px solid rgba(255,255,255,0.05); pointer-events: none;"></div>
</div>
`;
