use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use rust_generator::engine::{
    generator::QrGenerator,
    customizer::QrCustomizer,
    validator::QrValidator,
    optimizer::QrOptimizer,
};
use rust_generator::routes::qr_v2::{QrGenerateRequest, QrOptions};

fn benchmark_basic_generation(c: &mut Criterion) {
    let generator = QrGenerator::new();
    
    c.bench_function("basic_qr_generation", |b| {
        b.iter(|| {
            generator.generate(
                black_box("https://example.com"),
                black_box(None::<&QrOptions>)
            )
        })
    });
}

fn benchmark_generation_by_size(c: &mut Criterion) {
    let generator = QrGenerator::new();
    let mut group = c.benchmark_group("qr_generation_by_size");
    
    for size in [100, 300, 500, 1000, 2000] {
        let options = QrOptions {
            size: Some(size),
            ..Default::default()
        };
        
        group.bench_with_input(
            BenchmarkId::from_parameter(size),
            &size,
            |b, _| {
                b.iter(|| {
                    generator.generate(
                        black_box("https://example.com"),
                        black_box(Some(&options))
                    )
                })
            },
        );
    }
    group.finish();
}

fn benchmark_generation_by_data_length(c: &mut Criterion) {
    let generator = QrGenerator::new();
    let mut group = c.benchmark_group("qr_generation_by_data_length");
    
    let data_samples = vec![
        ("short", "Hello"),
        ("medium", "https://example.com/some/path/to/resource"),
        ("long", &"x".repeat(500)),
        ("very_long", &"x".repeat(2000)),
    ];
    
    for (name, data) in data_samples {
        group.bench_with_input(
            BenchmarkId::new("data_length", name),
            &data,
            |b, data| {
                b.iter(|| {
                    generator.generate(
                        black_box(data),
                        black_box(None::<&QrOptions>)
                    )
                })
            },
        );
    }
    group.finish();
}

fn benchmark_customization_features(c: &mut Criterion) {
    let generator = QrGenerator::new();
    let customizer = QrCustomizer::new();
    let base_qr = generator.generate("https://example.com", None).unwrap();
    
    let mut group = c.benchmark_group("qr_customization");
    
    // Eye shapes
    group.bench_function("eye_shape_rounded", |b| {
        let options = QrOptions {
            eye_shape: Some("rounded-square".to_string()),
            ..Default::default()
        };
        b.iter(|| {
            customizer.apply(black_box(&base_qr), black_box(&options))
        })
    });
    
    // Data patterns
    group.bench_function("data_pattern_dots", |b| {
        let options = QrOptions {
            data_pattern: Some("dots".to_string()),
            ..Default::default()
        };
        b.iter(|| {
            customizer.apply(black_box(&base_qr), black_box(&options))
        })
    });
    
    // Gradients
    group.bench_function("gradient_linear", |b| {
        let options = QrOptions {
            gradient: Some(rust_generator::routes::qr_v2::GradientOptions {
                gradient_type: "linear".to_string(),
                colors: vec!["#000000".to_string(), "#0000FF".to_string()],
                angle: Some(45.0),
                center_x: None,
                center_y: None,
            }),
            ..Default::default()
        };
        b.iter(|| {
            customizer.apply(black_box(&base_qr), black_box(&options))
        })
    });
    
    group.finish();
}

fn benchmark_validation(c: &mut Criterion) {
    let validator = QrValidator::new();
    
    c.bench_function("qr_validation", |b| {
        let request = QrGenerateRequest {
            data: "https://example.com".to_string(),
            options: Some(QrOptions::default()),
        };
        b.iter(|| {
            validator.validate(black_box(&request))
        })
    });
}

fn benchmark_optimization(c: &mut Criterion) {
    let optimizer = QrOptimizer::new();
    let large_svg = format!(
        r#"<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000">{}</svg>"#,
        "<rect x='10' y='10' width='10' height='10' fill='black'/>".repeat(1000)
    );
    
    c.bench_function("svg_optimization", |b| {
        b.iter(|| {
            optimizer.optimize_svg(black_box(&large_svg))
        })
    });
}

fn benchmark_parallel_generation(c: &mut Criterion) {
    use rayon::prelude::*;
    let generator = QrGenerator::new();
    
    let mut group = c.benchmark_group("parallel_generation");
    
    for count in [10, 50, 100] {
        group.bench_with_input(
            BenchmarkId::from_parameter(count),
            &count,
            |b, &count| {
                b.iter(|| {
                    (0..count).into_par_iter().for_each(|i| {
                        let data = format!("https://example.com/item/{}", i);
                        let _ = generator.generate(&data, None);
                    });
                })
            },
        );
    }
    
    group.finish();
}

fn benchmark_cache_performance(c: &mut Criterion) {
    use std::sync::Arc;
    use parking_lot::RwLock;
    use std::collections::HashMap;
    
    let cache: Arc<RwLock<HashMap<String, String>>> = Arc::new(RwLock::new(HashMap::new()));
    
    // Pre-populate cache
    {
        let mut cache_write = cache.write();
        for i in 0..1000 {
            cache_write.insert(format!("key_{}", i), format!("value_{}", i));
        }
    }
    
    let mut group = c.benchmark_group("cache_operations");
    
    group.bench_function("cache_read", |b| {
        b.iter(|| {
            let cache_read = cache.read();
            black_box(cache_read.get("key_500"));
        })
    });
    
    group.bench_function("cache_write", |b| {
        let mut counter = 0;
        b.iter(|| {
            let mut cache_write = cache.write();
            cache_write.insert(format!("key_new_{}", counter), "value".to_string());
            counter += 1;
        })
    });
    
    group.finish();
}

criterion_group!(
    benches,
    benchmark_basic_generation,
    benchmark_generation_by_size,
    benchmark_generation_by_data_length,
    benchmark_customization_features,
    benchmark_validation,
    benchmark_optimization,
    benchmark_parallel_generation,
    benchmark_cache_performance
);

criterion_main!(benches);