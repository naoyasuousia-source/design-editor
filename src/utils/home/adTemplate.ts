export const HOME_AD_HTML = `
<div class="DesignSurface" style="position: relative; overflow: hidden; width: 800px; height: 800px; background: #050505; display: flex; align-items: center; justify-content: center;">
    <!-- Abstract Background -->
    <div style="position: absolute; inset: 0; opacity: 0.6;">
        <img src="./src/assets/home-ad.png" style="width: 100%; height: 100%; object-fit: cover;" />
    </div>
    
    <!-- Content Overlay -->
    <div style="position: relative; z-index: 10; text-align: center; color: white; padding: 40px; background: rgba(0,0,0,0.4); backdrop-filter: blur(20px); border-radius: 40px; border: 1px solid rgba(255,255,255,0.1); width: 80%; max-width: 600px;">
        <h2 style="font-size: 48px; font-weight: 900; margin-bottom: 16px; letter-spacing: -2px; background: linear-gradient(to right, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            DESIGN WITH AI
        </h2>
        <p style="font-size: 18px; line-height: 1.6; opacity: 0.8; font-weight: 300; margin-bottom: 32px;">
            Next-generation creative canvas.<br/>
            Seamlessly co-create with advanced intelligence.
        </p>
        <div style="display: flex; gap: 16px; justify-content: center;">
            <div style="padding: 12px 24px; background: #3b82f6; border-radius: 99px; font-weight: 700; font-size: 14px; box-shadow: 0 10px 20px rgba(59,130,246,0.3);">
                CREATE NEW
            </div>
            <div style="padding: 12px 24px; background: rgba(255,255,255,0.1); border-radius: 99px; font-weight: 700; font-size: 14px; border: 1px solid rgba(255,255,255,0.1);">
                LATEST PROJECT
            </div>
        </div>
    </div>
    
    <!-- Decorative Elements -->
    <div style="position: absolute; bottom: 40px; left: 40px; font-family: monospace; font-size: 10px; opacity: 0.3; letter-spacing: 2px; color: white;">
        // STATUS: READY TO CREATE
    </div>
</div>
`;
