import numpy as np
import pandas as pd
from typing import Dict, Any, List
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import os

class LLMAnalyzer:
    def __init__(self):
        self.upload_dir = 'uploads'
        os.makedirs(self.upload_dir, exist_ok=True)
        self.tokenizer = None
        self.model = None

    def load_llm_model(self, model_path: str):
        """Load a HuggingFace LLM model."""
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(model_path)
            self.model = AutoModelForCausalLM.from_pretrained(model_path)
            return True
        except Exception as e:
            return str(e)

    def analyze_text_generation(self, prompt: str, max_length: int = 100) -> Dict[str, Any]:
        """Analyze text generation capabilities of the LLM."""
        if not self.model or not self.tokenizer:
            return {"error": "Model not loaded"}

        try:
            inputs = self.tokenizer(prompt, return_tensors="pt")
            outputs = self.model.generate(
                inputs["input_ids"],
                max_length=max_length,
                num_return_sequences=1,
                temperature=0.7,
                top_p=0.9,
                do_sample=True
            )
            generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Calculate metrics
            input_length = len(prompt.split())
            output_length = len(generated_text.split())
            response_time = 0.1  # This would be measured in a real implementation
            
            return {
                "status": "success",
                "generated_text": generated_text,
                "metrics": {
                    "input_length": input_length,
                    "output_length": output_length,
                    "response_time": response_time,
                    "expansion_ratio": output_length / input_length if input_length > 0 else 0
                }
            }
        except Exception as e:
            return {"error": str(e)}

    def evaluate_llm_performance(self, test_data: List[Dict[str, str]]) -> Dict[str, Any]:
        """Evaluate LLM performance on a test dataset."""
        if not self.model or not self.tokenizer:
            return {"error": "Model not loaded"}

        try:
            results = []
            for item in test_data:
                prompt = item.get("prompt", "")
                expected = item.get("expected", "")
                
                analysis = self.analyze_text_generation(prompt)
                if "error" in analysis:
                    continue
                    
                generated = analysis["generated_text"]
                metrics = analysis["metrics"]
                
                # Calculate similarity metrics (simplified for example)
                similarity = self._calculate_similarity(generated, expected)
                
                results.append({
                    "prompt": prompt,
                    "generated": generated,
                    "expected": expected,
                    "similarity": similarity,
                    **metrics
                })
            
            # Aggregate metrics
            avg_similarity = np.mean([r["similarity"] for r in results])
            avg_response_time = np.mean([r["response_time"] for r in results])
            avg_expansion = np.mean([r["expansion_ratio"] for r in results])
            
            return {
                "status": "success",
                "results": results,
                "summary_metrics": {
                    "average_similarity": avg_similarity,
                    "average_response_time": avg_response_time,
                    "average_expansion_ratio": avg_expansion
                }
            }
        except Exception as e:
            return {"error": str(e)}

    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate text similarity (simplified implementation)."""
        # This is a simplified implementation. In practice, you might want to use
        # more sophisticated methods like BERT embeddings or other similarity metrics
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        return len(intersection) / len(union) if union else 0

    def save_uploaded_file(self, file, file_type: str) -> str:
        """Save uploaded file and return its path."""
        filename = f"{file_type}_{os.urandom(8).hex()}{os.path.splitext(file.filename)[1]}"
        filepath = os.path.join(self.upload_dir, filename)
        file.save(filepath)
        return filepath 