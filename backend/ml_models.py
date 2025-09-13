import torch
from transformers import BlipProcessor, BlipForConditionalGeneration
from sentence_transformers import SentenceTransformer
from PIL import Image
from pillow_heif import register_heif_opener
import logging
from typing import Optional, List
import numpy as np

# Set up logging
logger = logging.getLogger(__name__)

# Global model instances
clip_model = None
blip_processor = None
blip_model = None


def load_models():
    """Initialize CLIP and BLIP models"""
    global clip_model, blip_processor, blip_model
    
    try:
        # Enable HEIC/HEIF support in PIL when available
        try:
            register_heif_opener()
        except Exception:
            # Non-fatal if HEIF opener not available
            pass

        # Load CLIP model for embeddings
        logger.info("Loading CLIP model...")
        clip_model = SentenceTransformer('clip-ViT-B-32')
        
        # Load BLIP model for captions
        logger.info("Loading BLIP model...")
        blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
        blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")
        
        logger.info("All ML models loaded successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Failed to load ML models: {e}")
        return False


def generate_image_embedding(image_path: str, max_retries: int = 1) -> Optional[np.ndarray]:
    """Generate CLIP embedding for an image"""
    if clip_model is None:
        logger.error("CLIP model not loaded")
        return None
    
    for attempt in range(max_retries + 1):
        try:
            # Load and process image
            image = Image.open(image_path).convert('RGB')

            # Generate embedding
            # SentenceTransformer expects list of PIL Images for CLIP
            embedding = clip_model.encode([image], convert_to_numpy=True, normalize_embeddings=False)
            if isinstance(embedding, list):
                embedding = np.array(embedding)
            # embedding shape: (1, 512) -> return 1D vector
            return embedding[0]
            
        except Exception as e:
            logger.warning(f"CLIP embedding attempt {attempt + 1} failed: {e}")
            if attempt == max_retries:
                logger.error(f"CLIP failed to process {image_path} after {max_retries + 1} attempts")
                return None
    
    return None


def generate_image_caption(image_path: str, max_retries: int = 1) -> Optional[str]:
    """Generate BLIP caption for an image"""
    if blip_model is None or blip_processor is None:
        logger.error("BLIP model not loaded")
        return None
    
    for attempt in range(max_retries + 1):
        try:
            # Load and process image
            image = Image.open(image_path).convert('RGB')
            
            # Generate caption
            inputs = blip_processor(image, return_tensors="pt")
            out = blip_model.generate(**inputs, max_length=50)
            caption = blip_processor.decode(out[0], skip_special_tokens=True)
            
            return caption
            
        except Exception as e:
            logger.warning(f"BLIP caption attempt {attempt + 1} failed: {e}")
            if attempt == max_retries:
                logger.error(f"BLIP failed to process {image_path} after {max_retries + 1} attempts")
                return None
    
    return None


def generate_text_embedding(text: str) -> Optional[np.ndarray]:
    """Generate CLIP embedding for text query"""
    if clip_model is None:
        logger.error("CLIP model not loaded")
        return None
    
    try:
        # Generate text embedding using same CLIP model
        embedding = clip_model.encode(text, convert_to_numpy=True, normalize_embeddings=False)
        return embedding if isinstance(embedding, np.ndarray) else np.array(embedding)
        
    except Exception as e:
        logger.error(f"Failed to generate text embedding for '{text}': {e}")
        return None 
