
import requests
import random
import json
import string

# --- Configuration ---
BACKEND_URL = "http://localhost:3004"
QR_ENHANCED_ENDPOINT = f"{BACKEND_URL}/api/v3/qr/enhanced"
NUM_TESTS = 10 # Number of random QR codes to generate

# --- Possible Values (based on backend/src/schemas/qrSchemas.ts and documentation) ---

EYE_SHAPES = [
    'square', 'rounded_square', 'circle', 'dot', 'leaf', 'bars-horizontal',
    'bars-vertical', 'star', 'diamond', 'cross', 'hexagon', 'heart',
    'shield', 'crystal', 'flower', 'arrow', 'custom'
]

DATA_PATTERNS = [
    'square', 'dots', 'rounded', 'vertical', 'horizontal', 'diamond',
    'circular', 'star', 'cross', 'random', 'wave', 'mosaic'
]

GRADIENT_TYPES = ['linear', 'radial', 'conic', 'diamond', 'spiral']

EFFECT_TYPES = ['shadow', 'glow', 'blur', 'noise', 'vintage']

# --- Helper Functions ---

def generate_random_hex_color():
    return '#{:06x}'.format(random.randint(0, 0xFFFFFF))

def generate_random_string(length=10):
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for i in range(length))

def generate_random_url():
    subdomain = generate_random_string(random.randint(3, 8)).lower()
    domain = generate_random_string(random.randint(5, 10)).lower()
    tld = random.choice(['com', 'org', 'net', 'io', 'dev'])
    path = f"/{generate_random_string(random.randint(0, 15)).lower()}" if random.random() > 0.5 else ""
    return f"https://{subdomain}.{domain}.{tld}{path}"

def generate_random_qr_config():
    config = {
        "data": generate_random_url(),
        "options": {
            "error_correction": random.choice(['L', 'M', 'Q', 'H']),
            "customization": {}
        }
    }

    customization = config["options"]["customization"]

    # Random Colors
    if random.random() > 0.3: # 70% chance to have custom colors
        customization["colors"] = {
            "foreground": generate_random_hex_color(),
            "background": generate_random_hex_color()
        }
    
    # Random Gradient
    if random.random() > 0.5: # 50% chance to have a gradient
        grad_type = random.choice(GRADIENT_TYPES)
        colors = [generate_random_hex_color(), generate_random_hex_color()]
        if random.random() > 0.7: # Add a third color sometimes
            colors.append(generate_random_hex_color())
        
        gradient_config = {
            "enabled": True,
            "gradient_type": grad_type,
            "colors": colors,
            "apply_to_eyes": random.choice([True, False]),
            "apply_to_data": random.choice([True, False])
        }
        if grad_type == 'linear':
            gradient_config["angle"] = random.randint(0, 360)
        
        if random.random() > 0.5: # 50% chance to have stroke style
            gradient_config["stroke_style"] = {
                "enabled": True,
                "color": generate_random_hex_color(),
                "width": round(random.uniform(0.1, 2.0), 1),
                "opacity": round(random.uniform(0.1, 1.0), 1)
            }
        customization["gradient"] = gradient_config

    # Random Eye Shape
    if random.random() > 0.2: # 80% chance to have custom eye shape
        customization["eye_shape"] = random.choice(EYE_SHAPES)
    
    # Random Data Pattern
    if random.random() > 0.2: # 80% chance to have custom data pattern
        customization["data_pattern"] = random.choice(DATA_PATTERNS)

    # Random Effects (up to 3)
    num_effects = random.randint(0, 3)
    if num_effects > 0:
        selected_effects = random.sample(EFFECT_TYPES, num_effects)
        customization["effects"] = []
        for effect_type in selected_effects:
            effect_config = {"effect_type": effect_type}
            if effect_type == 'glow': # Glow can have a color
                if random.random() > 0.5:
                    effect_config["config"] = {"color": generate_random_hex_color()}
            customization["effects"].append(effect_config)
            
    # Ensure customization object is not empty if no options were added
    if not customization:
        config["options"].pop("customization")

    return config

# --- Main Execution ---

if __name__ == "__main__":
    print(f"Starting random QR generation tests. Sending {NUM_TESTS} requests to {QR_ENHANCED_ENDPOINT}")
    print("-" * 50)

    for i in range(NUM_TESTS):
        test_config = generate_random_qr_config()
        print(f"Test {i+1}/{NUM_TESTS}:")
        print(f"  Request Payload: {json.dumps(test_config, indent=2)}")

        try:
            response = requests.post(QR_ENHANCED_ENDPOINT, json=test_config, timeout=15)
            response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
            
            print(f"  Response Status: {response.status_code}")
            response_json = response.json()
            print(f"  Response Success: {response_json.get('success', False)}")
            if not response_json.get('success', False):
                print(f"  Response Error: {response_json.get('error', 'No error message')}")
            print("-" * 50)

        except requests.exceptions.Timeout:
            print("  Request timed out after 15 seconds.")
            print("-" * 50)
        except requests.exceptions.RequestException as e:
            print(f"  Request failed: {e}")
            if e.response is not None:
                print(f"  Response Status: {e.response.status_code}")
                print(f"  Response Body: {e.response.text}")
            print("-" * 50)
        except json.JSONDecodeError:
            print(f"  Failed to decode JSON response. Response text: {response.text}")
            print("-" * 50)

    print("Random QR generation tests finished.")
