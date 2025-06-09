// processing/mod.rs - Módulo de procesamiento avanzado

pub mod colors;
pub mod gradients;
pub mod effects;

pub use colors::{ColorProcessor, ColorValidator, contrast_ratio};
pub use gradients::{GradientProcessor, GradientType};
pub use effects::{
    EffectProcessor, 
    ShadowConfig, 
    GlowConfig, 
    BlurConfig, 
    NoiseConfig, 
    VintageConfig,
    EffectConfig
};