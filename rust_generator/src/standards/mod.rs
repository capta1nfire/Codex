// standards/mod.rs - Módulo de estándares industriales

pub mod gs1;
pub mod validator;
pub mod decoder;

pub use gs1::{Gs1Encoder, Gs1Parser, ApplicationIdentifier};
pub use validator::{StandardValidator, ValidationProfile};
pub use decoder::{QrDecoder, DecodedData};